var js2js = require('./js2js-lib.js');

function ASTGen(loc, options) {
    this.loc = loc;
    this.statements = [];
    if (options === undefined) options = {};
    this.options = options;
}

ASTGen.prototype.moveTo = function(loc) {
    this.loc = loc;
};

ASTGen.prototype.newThis = function () {
    return new js2js.This();
};

ASTGen.prototype.newObjectLiteral = function (props) {
    if (!props) props = [];
    return new js2js.ObjectLiteral(this.loc, props);
};

ASTGen.prototype.newID = function (name) {
    return new js2js.Token(js2js.IDENT_CAT, name, this.loc);
};

ASTGen.prototype.newRef = function (id) {
    if (typeof id === "string") {
        id = this.newID(id);
    }
    return new js2js.Ref(this.loc, id);
};

ASTGen.prototype.stringLiteral = function (val) {
    return new js2js.Literal(this.loc, val)
};

ASTGen.prototype.newGetProp = function (obj, prop) {
    return new js2js.OpExpr(this.loc, "x [ y ]", [obj, prop]);
};

ASTGen.prototype.newAssignment = function (from, to) {
    return new js2js.OpExpr(this.loc, "x = y", [from, to]);
};

ASTGen.prototype.newCall = function (fn, args) {
    if (typeof fn === "string") {
        fn = this.newRef(fn);
    }
    if (!args) args = [];
    return new js2js.CallExpr(this.loc, fn, args);
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

        var gen = new ASTGen(ast.loc);

        ast.expr = this.walk_expr(ast.expr);
        this.withStatements.push(ast);
        ast.statement = this.walk_statement(ast.statement);
        this.withStatements.pop();

        var obj = ast.expr;
        var body = ast.statement;

        var tryPart = new js2js.BlockStatement(ast.loc, []);
        tryPart.statements.push(new js2js.ExprStatement(ast.loc, gen.newCall("sandbox$enterWith", [obj])));
        if (body instanceof js2js.BlockStatement) {
            for (var i = 0; i < body.statements.length; i++) {
                tryPart.statements.push(body.statements[i]);
            }
        } else {
            tryPart.statements.push(body);
        }

        var finallyPart = new js2js.ExprStatement(ast.loc, gen.newCall("sandbox$exitWith"));

        return new js2js.TryStatement(ast.loc, tryPart, null, finallyPart);
    } else {
        return js2js.ast_walk_statement(ast, this);
    }
}

with_removal_ctx.prototype.walk_expr = function (ast) {
    if (this.withStatements.length > 0) {
        if (ast instanceof js2js.Ref) {
            ast = js2js.ast_walk_expr(ast, this);
            var gen = new ASTGen(ast.loc);
            return new js2js.OpExpr(ast.loc, "x ? y : z", [
                gen.newCall("sandbox$withScopeContains", [gen.stringLiteral(ast.id.toString())]),
                gen.newCall("sandbox$propGet", [gen.stringLiteral(ast.id.toString())]),
                ast
            ]);
        } else if (is_assignment(ast)) {
            var lhs = ast.exprs[0];
            if (lhs instanceof js2js.Ref) {
                var rhs = this.walk_expr(ast.exprs[1], this);
                var gen = new ASTGen(ast.loc);

                return new js2js.OpExpr(ast.loc, "x ? y : z", [
                    gen.newCall("sandbox$withScopeContains", [gen.stringLiteral(lhs.id.toString())]),
                    gen.newCall("sandbox$propSet", [gen.stringLiteral(ast.op), gen.stringLiteral(lhs.id.toString()), rhs]),
                    new js2js.OpExpr(ast.loc, ast.op, [lhs, rhs]) // TODO: clone rhs to avoid potential problems with shared nodes?
                ]);
            }
        } else if (ast instanceof js2js.FunctionExpr) {
            ast = js2js.ast_walk_expr(ast, this);
            var gen = new ASTGen(ast.loc);
            return gen.newCall("sandbox$makeClosure", [ast]);
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