function jswb_clearSession() {
    localStorage.removeItem("jswb");
}

function jswb_saveSession() {
    var state = jswb_serializeState();
    localStorage["jswb"] = JSON.stringify(state);
}

function jswb_loadSession() {
    // Restore tabs
    var state = localStorage["jswb"];
    if (state) {
        jswb_restoreState(JSON.parse(state));
    }
}