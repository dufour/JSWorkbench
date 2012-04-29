$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

function jswb_addLineToConsole(line, cssClass) {
    if (window.currentConsoleLine) {
        window.currentConsoleLine = undefined;
        $(window.output).append("\n");
    }
    if (!cssClass) cssClass = "console-output";
    $(window.output).append($("<span/>").addClass(cssClass).text(line), "\n");
}

function jswb_runScript(s) {
    var _eval = eval; // Use indirect eval to simulate top-level execution
    return _eval(s);  // FIXME: insecure!
}

function jswb_clearConsole() {
    $(window.output).empty();
    window.repl.setValue("");
}

function jswb_loadFile(cm, f) {
    if (!cm) return;
    
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