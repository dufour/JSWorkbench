$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

function jswb_runScript(s) {
    var _eval = eval; // Use indirect eval to simulate top-level execution
    return _eval(s);  // FIXME: insecure!
}

function jswb_clearConsole() {
    window.output.innerText = "";
    window.repl.setValue("");
}

function jswb_loadFile(cm, f) {
    var reader = new FileReader();
    reader.onerror = function (e) {
          alert("File read failed");
    };
    reader.onload = (function(theEditor) {
        return function(e) {
            theEditor.setValue(e.target.result);
       };
    })(cm);
    reader.readAsText(f);
}

function jswb_undo(cm) {
    cm.undo();
}

function jswb_redo(cm) {
    cm.redo();
}

function jswb_save(cm) {
    alert("Would save...");
}

function jswb_load(cm) {
    window.fileInput.click();
}

function jswb_saveProject(cm) {
    alert("Would save project...");
}

function jswb_loadProject(cm) {
    alert("Would load project...");
}