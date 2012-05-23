var js2js = require('./js2js-lib.js');

function ASTGen() {
    this.loc = null;
}

ASTGen.prototype.isArray = function (obj) {
    return Array.isArray(obj) || (obj && typeof obj === 'object' &&
        typeof obj.length === 'number');
    // return (obj instanceof Array);
    // return (obj && obj.length);
    // return Object.prototype.toString.call(obj) === '[object Array]';
};

ASTGen.prototype.isASTNode = function (n) {
    return n.hasOwnProperty('loc'); // Should be OK for now
};

ASTGen.prototype.withLoc = function (loc) {
    this.loc = loc;
    return this;
};

ASTGen.prototype.currentLoc = function () {
    return this.loc;
};

ASTGen.prototype.clearLoc = function() {
    this.loc = null;
};

ASTGen.prototype.This = function () {
    return new js2js.This(this.loc);
};

ASTGen.prototype.ID = function (name) {
    return new js2js.Token(js2js.IDENT_CAT, name, this.loc);
};

ASTGen.prototype.Ref = function (id) {
    if (typeof id === "string") {
        id = this.ID(id);
    }
    return new js2js.Ref(this.loc, id);
};

ASTGen.prototype.Value = function (v) {
    if (typeof v === "string") {
        return this.StringLiteral(v);
    } else if (v instanceof js2js.Token) {
        return this.Ref(v);
    } else {
        return v;
    }
};

ASTGen.prototype.Block = function () {
    var statements = [];
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (this.isArray(arg)) {
            for (var j = 0; j < arg.length; j++) {
                statements.push(arg[j]);
            }
        } else {
            statements.push(arg);
        }
    }
    return new js2js.BlockStatement(this.loc, statements);
};

ASTGen.prototype.ObjectLiteral = function (props) {
    if (!props) props = [];
    return new js2js.ObjectLiteral(this.loc, props);
};

ASTGen.prototype.StringLiteral = function (val) {
    return new js2js.Literal(this.loc, val)
};

ASTGen.prototype.GetProp = function (obj, prop) {
    return new js2js.OpExpr(this.loc, "x [ y ]", [this.Value(obj), prop]);
};

ASTGen.prototype.PutProp = function (obj, prop, val) {
    return this.Assign(this.GetProp(obj, prop), val);
};

ASTGen.prototype.Assign = function (from, to) {
    return new js2js.OpExpr(this.loc, "x = y", [from, this.Value(to)]);
};

ASTGen.prototype.Call = function (fn, args) {
    if (typeof fn === "string") {
        fn = this.Ref(fn);
    }
    if (!args) {
        args = [];
    } else if (!this.isArray(args)) {
        args = Array.prototype.slice.call(arguments, 1);
    } else {
        args = args.slice(0);
    }

    for (var i = 0; i < args.length; i++) {
        args[i] = this.Value(args[i]);
    }

    return new js2js.CallExpr(this.loc, fn, args);
};

ASTGen.prototype.Conditional = function (test, ifTrue, ifFalse) {
    return new js2js.OpExpr(this.loc, "x ? y : z", [
        this.Value(test),
        this.Value(ifTrue),
        this.Value(ifFalse)
    ]);
};

ASTGen.prototype.Statement = function (expr) {
    return new js2js.ExprStatement(this.loc, this.Value(expr));
};

ASTGen.prototype.Try = function (tryPart, catchPart, finallyPart) {
    if (catchPart === undefined && finallyPart === undefined) {
        catchPart = tryPart["catch"];
        finallyPart = tryPart["finally"];
        tryPart = tryPart["try"];
    }
    if (!catchPart) catchPart = null;
    if (!finallyPart) finallyPart = null;
    return new js2js.TryStatement(this.loc, tryPart, catchPart, finallyPart);
};

//-----------------------------------------------------------------------------

/*

Eliminate with from a AST fragment.

General strategy:

with (expr) {
    use(id);
    id = val;
}
=>
try {
    sandbox$enterWith(expr);
    use((sandbox$withScopeContains("prop") ? sandbox$propGet("prop") : prop));
    (sandbox$withScopeContains("id") ? sandbox$propSet("prop", val) : id = val);

} finally {
    sandbox$exitWith();
}

*/

function with_removal_ctx() {
    this.withStatements = [];
}

with_removal_ctx.prototype.create_ctx = function (ast) {
    return new with_removal_ctx();
}

with_removal_ctx.prototype.walk_statement = function (ast) {
    if (ast instanceof js2js.FunctionDeclaration) {
        var stmts = this.withStatements;
        this.withStatements = [];
        ast = js2js.ast_walk_statement(ast, this);
        this.withStatements = stmts;
        return ast;
    } else if (ast instanceof js2js.WithStatement) {
        // Replace 'with' statement:
        //   with (expr) { use(prop) ... }
        //   =>
        //   try {
        //       sandbox$enterWith(expr);
        //       use((sandbox$withScopeContains("prop") ? sandbox$propGet("prop") : prop));
        //   } finally {
        //       sandbox$exitWith();
        //   }

        var gen = new ASTGen().withLoc(ast.loc);

        ast.expr = this.walk_expr(ast.expr);
        this.withStatements.push(ast);
        ast.statement = this.walk_statement(ast.statement);
        this.withStatements.pop();

        var obj = ast.expr;
        var body = ast.statement;

        return gen.Try({
            "try" : gen.Block(
                gen.Statement(gen.Call("sandbox$enterWith", obj)),
                body instanceof js2js.BlockStatement ? body.statements : body
            ),
            "finally" : gen.Statement(gen.Call("sandbox$exitWith"))
        });
    } else {
        return js2js.ast_walk_statement(ast, this);
    }
}

with_removal_ctx.prototype.walk_expr = function (ast) {
    if (this.withStatements.length > 0) {
        if (ast instanceof js2js.Ref) {
            ast = js2js.ast_walk_expr(ast, this);
            var gen = new ASTGen().withLoc(ast.loc);
            return gen.Conditional(
                gen.Call("sandbox$withScopeContains", ast.id.toString()),
                gen.Call("sandbox$propGet", ast.id.toString()),
                ast
            );
        } else if (is_assignment(ast)) {
            var lhs = ast.exprs[0];
            if (lhs instanceof js2js.Ref) {
                var rhs = this.walk_expr(ast.exprs[1], this);
                var gen = new ASTGen().withLoc(ast.loc);

                return gen.Conditional(
                    gen.Call("sandbox$withScopeContains", lhs.id.toString()),
                    gen.Call("sandbox$propSet", ast.op, lhs.id.toString(), rhs),
                    new js2js.OpExpr(ast.loc, ast.op, [lhs, rhs]) // TODO: clone rhs to avoid potential problems with shared nodes?
                );
            }
        } else if (ast instanceof js2js.FunctionExpr) {
            ast = js2js.ast_walk_expr(ast, this);
            var gen = new ASTGen().withLoc(ast.loc);
            return gen.Call("sandbox$makeClosure", ast);
        }
    }
    return js2js.ast_walk_expr(ast, this);
}

function is_assignment(ast) {
    if (ast instanceof js2js.OpExpr) {
        switch (ast.op) {
            case "x = y":
            case "x += y":
            case "x -= y":
            case "x *= y":
            case "x /= y":
            case "x <<= y":
            case "x >>= y":
            case "x >>>= y":
            case "x &= y":
            case "x ^= y":
            case "x |= y":
            case "x %= y":
                return true;
        }
    }
    return false;
}

function with_removal(ast) {
    var ctx = new with_removal_ctx();
    return ctx.walk_statement(ast);
}

if (typeof exports !== 'undefined') {
    exports.with_removal = with_removal;
}