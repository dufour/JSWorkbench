jswb.clearSession = function () {
    localStorage.removeItem("jswb");
};

jswb.saveSession = function () {
    var state = jswb.serializeState();
    localStorage["jswb"] = JSON.stringify(state);
};

jswb.loadSession = function () {
    // Restore tabs
    var state = localStorage["jswb"];
    if (state) {
        jswb.restoreState(JSON.parse(state));
    }
};
