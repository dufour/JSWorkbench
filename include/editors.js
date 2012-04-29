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
            "Ctrl-O": function (cm) { jswb_load(cm); return true; },            
        },
        
        onDragEvent: function(cm, event) {
            if (event.type === "drop") { 
                console.log(event);
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer; 
                var files = dt.files;            
                jswb_loadFile(cm, files[0]);
                return true;
            } else if (event.type === "dragover") {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
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
            "Ctrl-L": function (cm) { jswb_clearConsole(); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm)},
            "Enter": function(cm) {
                var script = cm.getValue();
                cm.setValue("");
                cm.refresh();                           
                
                jswb_addLineToConsole(script, "console-line");
                if (script) {
                    try {
                        cm.busy = true;
                        var result = jswb_runScript(script);
                        cm.busy = false;
                        if (result !== undefined) {
                            jswb_addLineToConsole(result, "console-result");
                        }
                    } catch (error) {
                        jswb_addLineToConsole(error, "console-error label label-important");
                    }
                }
                
                return true;
            },
        },
        onKeyEvent: function (cm, event) {
            if (cm.busy) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
    };
    var editor = CodeMirror(node, options);
    editor.busy = false;
    return editor;
}