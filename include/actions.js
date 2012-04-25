$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

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
    alert("Would load...");
}

function jswb_saveProject(cm) {
    alert("Would save project...");
}

function jswb_loadProject(cm) {
    alert("Would load project...");
}