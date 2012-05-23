sandbox$withScope = [];

function sandbox$enterWith(obj) {
    sandbox$withScope.push(obj);
}

function sandbox$exitWith(obj) {
    sandbox$withScope.pop();
}

function sandbox$makeClosure(f) {
    return (function (closureScope, func) {
        return function () {
            var savedScope = sandbox$withScope;
            sandbox$withScope = closureScope;
            try {
                func.apply(this, arguments);
            } finally {
                sandbox$withScope = savedScope;
            }
        };
    })(sandbox$withScope.slice(0), f);
}

function sandbox$withScopeContains(propName) {
    for (var i = sandbox$withScope.length - 1; i >= 0; i--) {
        var obj = sandbox$withScope[i];
        if (Object.prototype.hasOwnProperty.call(obj, propName)) {
            return true;
        }
    }

    return false;
}

function sandbox$propGet(propName) {
    for (var i = sandbox$withScope.length - 1; i >= 0; i--) {
        var obj = sandbox$withScope[i];
        if (Object.prototype.hasOwnProperty.call(obj, propName)) {
            return obj[propName];
        }
    }

    throw new Error("Ungarded use of sandbox$propGet");
}

function sandbox$propSet(propName, val) {
    for (var i = sandbox$withScope.length - 1; i >= 0; i--) {
        var obj = sandbox$withScope[i];
        if (Object.prototype.hasOwnProperty.call(obj, propName)) {
            return obj[propName] = val;
        }
    }

    throw new Error("Ungarded use of sandbox$propSet");
}
