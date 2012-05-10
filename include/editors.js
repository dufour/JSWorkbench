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
            "Shift-Cmd-S": function(cm) { jswb.saveProject(cm); return true; },
            "Shift-Cmd-O": function(cm) { jswb.loadProject(cm); return true; },
            "Ctrl-O": function (cm) { jswb.load(cm); return true; },            
        },
        
        onDragEvent: function(cm, event) {
            if (event.type === "drop") { 
                console.log(event);
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer; 
                var files = dt.files;            
                jswb.loadFile(cm, files[0]);
                return true;
            } else if (event.type === "dragover") {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }
    };
    
    var editor = CodeMirror(node, options);
    editor.save = jswb.save;
    return editor;
}

// ================================================================================
//                                       REPL
// ================================================================================

function REPLHistoryManager(cm) {
    this.editor = cm;
    this.history = [];
    this.pos = 0;
    this.limit = 100; // TODO: make this configurable
    this.currentLine = undefined;
}

REPLHistoryManager.prototype.resetPos = function () {
    this.pos = this.history.length;
    this.currentLine = undefined;
};

REPLHistoryManager.prototype.add = function (line) {
    this.history.push(line);
    while (this.history.length > this.limit) {
        this.history.shift();
    }
    this.resetPos();
};

REPLHistoryManager.prototype.previous = function () {
    var index = this.pos - 1;
    if (this.pos === this.history.length) {
        // Remember the current line to be able to restore it later, if needed
        this.currentLine = this.editor.getValue();
    }
    if (index >= 0) {
        // Restore previous history item
        this.editor.setValue(this.history[index]);
        this.pos = index;
    }
};

REPLHistoryManager.prototype.next = function () {
    var index = this.pos + 1;
    if (index < this.history.length) {
        this.editor.setValue(this.history[index]);
        this.pos = index;
    }  else if (index === this.history.length) {
        this.editor.setValue(this.currentLine);
        this.resetPos();
    }
};

function createREPL(node) {
    var options = {
        mode:  "javascript",
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: true,
        extraKeys: {
            "Ctrl-L": function (cm) { jswb.clearConsole(); cm.jswb.history.resetPos(); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm)},
            "Enter": function(cm) {
                var script = cm.getValue();
                cm.setValue("");
                cm.refresh();                           
                
                jswb.addLineToConsole(script, "console-line");
                if (script) {
                    try {
                        cm.busy = true;
                        var result = jswb.runScript(script);
                        if (result !== undefined) {
                            jswb.addLineToConsole(result, "console-result");
                        }
                    } catch (error) {
                        jswb.addLineToConsole(error, "console-error label label-important");
                    }
                    cm.jswb.history.add(script);
                    cm.busy = false;
                }
                
                return true;
            },
            "Up": function (cm) {
                cm.jswb.history.previous();
                return true;
            },
            "Down": function (cm) {
                cm.jswb.history.next();
                return true;
            }
        },
        onKeyEvent: function (cm, event) {
            if (cm.busy) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
    };
    var editor = CodeMirror(node, options);
    editor.jswb = {};
    editor.jswb.history = new REPLHistoryManager(editor);
    editor.busy = false;
    return editor;
}
