function createCodeEditor(node) {
    var options = {
        value: "// Enter javascript code here\nprintln(\"Hello, world!\");",
        mode:  "javascript",
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  true,   // Show line numbers
        matchBrackets: true,
        extraKeys: {
            "Enter": function(cm) { cm.autoInsertBraces(cm)},
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm)},
            "Shift-Cmd-S": function(cm) { jswb_saveProject(cm); return true; },
            "Shift-Cmd-O": function(cm) { jswb_loadProject(cm); return true; },
        }
    };
    
    var editor = CodeMirror(node, options);
    editor.save = jswb_save;
    return editor;
}

// ================================================================================
//                                       REPL
// ================================================================================

function createREPL(node) {
    var options = {
        mode:  "javascript",
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: true,
        extraKeys: {
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm)},
            "Enter": function(cm) {
                var script = cm.getValue();                           
                $(window.output).append($("<span/>").addClass("console-line").text(script), "\n");
                cm.setValue("");
                return true;
            },
        },
    };
    return CodeMirror(node, options);
}