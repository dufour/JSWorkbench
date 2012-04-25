function createCodeEditor(node) {
    var options = {
        value: "// Enter javascript code here\nprintln(\"Hello, world!\");",
        mode:  "javascript",
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  true,   // Show line numbers
        matchBrackets: true,
        extraKeys: {
            "Enter": function(cm) { cm.autoInsertBraces(cm)},
//            "Cmd-S": function(cm) { jswb_doSave(cm); return true; },
//            "Cmd-O": function(cm) { jswb_doLoad(cm); return true; },
//            "Cmd-Z": function(cm) { jswb_undo(cm); return true; },
//            "Shift-Cmd-Z": function(cm) { jswb_redo(cm); return true; },
            "Shift-Cmd-S": function(cm) { jswb_saveProject(cm); return true; },
            "Shift-Cmd-O": function(cm) { jswb_loadProject(cm); return true; },
        }
    };
    
    var editor = CodeMirror(node, options);
    editor.save = jswb_save;
    return editor;
//    return new CodeMirrorUI(node, {
//        path: "include/codemirror-ui/js/",
//        buttons: [
//            'undo',
//            'redo',
//            'jump',
//            'reindent'
//            'about'
//        ]
//    }, options);
}

// ================================================================================
//                                       REPL
// ================================================================================

function repl_onKeyEvent(cm, event) {
    if (cm.somethingSelected()) {
        event.stop();
        return true;
    }
    
//    } else if (event.
    return false;
}

function createREPL(node) {
    var options = {
        value: "> ",
        mode:  "javascript",
        indentUnit: 0,       // Indent with 4 spaces
        lineNumbers:  true,   // Show line numbers
//        matchBrackets: true,
        extraKeys: {
//            "Enter": function(cm) { return true; },
//            "Backspace": function(cm) { return true; },
        },
        
        onKeyEvent: repl_onKeyEvent,
    };
    return CodeMirror(node, options);
}