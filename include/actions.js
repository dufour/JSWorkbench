$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

jswb.getCurrentTab = function () {
    if (jswb.currentTab) {
        return jswb.tabs[jswb.currentTab];
    }
    return undefined;
};

function jswb_internal_closeTab(id) {
    // Remove tab
    var current_tab = $("#tabitem_" + id);
    if (current_tab.hasClass("active")) {
        var prev_tab = current_tab.prev();
        if (prev_tab.length === 0) {
            // no prev tab, use the next one
            prev_tab = current_tab.next();
        }
        if (prev_tab.length !== 0) {
            // Activate this tab
            prev_tab.children('a').tab('show');
        }
    }
    current_tab.remove();
    
    // Remove content
    $("#" + id).remove();
    
    // Clear data
    delete jswb.tabs[id];
}

jswb.closeAllTabs = function () {
    var tabs = jswb.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            jswb_internal_closeTab(tab.id);
        }
    }
    jswb.tabs = [];
};

jswb.closeTab = function (id) {
    jswb_internal_closeTab(id);
    
    // If no tabs remain, create a new one
    if ($("#editor-tabs").children("li").length === 0) {        
        jswb.newTab();
    }
};

function jswb_internal_nextTabID() {
    var tabs = jswb.tabs;
    var i = 1;
    while (tabs[i]) i++;
    return i;
}

function jswb_internal_makeCloseButton() {
    return $("<button/>").addClass("close").append("&times;");
}

jswb.newTab = function (title, id) {
    if (id === undefined) {
        id = jswb_internal_nextTabID();
    }
    if (title === undefined) {
        title = "untitled" + id;
    }
    
    // Create tab
    // <li><a href="#untitled" data-toggle="tab">untitled<button class="close">&times;</button></a></li>
    var close_button = jswb_internal_makeCloseButton();
    close_button.click((function (tabID) {
        return function (event) {
            event.stopPropagation();
            event.preventDefault();
            jswb.closeTab(tabID);
        };
    })(id));
    
    //     ___________
    //    | tab_id  x |
    //    |___________|______________
    //    | .tab-pane                |
    //    |                          |
    //    |      id                  |
    //    |                          |
    //    |__________________________|
    
    var titleSpan = $('<span/>').addClass("tabTitle").text(title);
    var link = $('<a data-toggle="tab"/>').attr("id", "tab_" + id).attr("href", "#" + id).append(titleSpan).append(close_button);
    link.on('shown', (function (tabID) {
        return function (event) {
            jswb.currentTab = tabID;
        };
    })(id));
    link.dblclick((function (title, tabID) {
        return function (event) {
            var newTitle = prompt("Enter a new name for '" + jswb.tabs[tabID].title + "'");
            if (newTitle !== null) {
                title.text(newTitle);
                jswb.tabs[tabID].title = newTitle;
            }
        };
    })(titleSpan, id));
    var tab_item = $("<li/>").attr("id", "tabitem_" + id).append(link);
    $("#editor-tabs").append(tab_item);        
    
    // Create content
    // <div class="tab-pane" id="untitled"><pre class="editor">Hello</pre></div>
    var pre = document.createElement('pre');
    pre.setAttribute("class", "editor");
    
    var content = $("<div/>").addClass("tab-pane").attr("id", id).append($(pre));
    $("#editors").append(content);          
    
    // Create and register editor
    var editor = createCodeEditor(pre);
    var tab = {
        id: id,
        editor: editor,
        title: title
    };
    jswb.tabs[id] = tab;
    editor.tab = tab;
    
    // Activate new tab          
    $("#tab_" + id).tab("show");
    editor.refresh();
    
    return jswb.tabs[id];
};

jswb.addAlert = function (text, title, kind) {
    var alertDiv = $("<div/>").addClass("alert");
    if (kind) alertDiv.addClass("alert-" + kind);
    alertDiv.text(text);
    if (title) {
        alertDiv.prepend($("<strong/>").text(title), " ");
    }
    alertDiv.prepend('<button class="close" data-dismiss="alert">&times;</button>');
    $(jswb.alerts).append(alertDiv);
};

jswb.reportError = function (text, title) {
    if (title === undefined) title = "Error!";
    jswb.addAlert(text, title, "error"); 
};

jswb.reportWarning = function (text, title) {
    if (title === undefined) title = "Warning!";
    jswb.addAlert(text, title); 
};

jswb.addLineToConsole = function (line, cssClass) {
    if (jswb.currentConsoleLine) {
        jswb.currentConsoleLine = undefined;
        $(jswb.console).append("\n");
    }
    if (!cssClass) cssClass = "console-output";
    $(jswb.console).append($("<span/>").addClass(cssClass).text(line), "\n");
};

jswb.runScript = function (s) {
    var _eval = eval; // Use indirect eval to simulate top-level execution
    return _eval("with (jswb.builtins) {" + s + "}");  // FIXME: insecure!
};

jswb.clearConsole = function () {
    $(jswb.console).empty();
    jswb.repl.setValue("");
};

jswb.loadFile = function (cm, f) {
    if (!cm) return;
    
    jswb_internal_readTextFile((function(theEditor) {
        return function(contents) {
            theEditor.setValue(contents);
       };
    })(cm));
};

jswb.undo = function (cm) {
    cm.undo();
};

jswb.redo = function (cm) {
    cm.redo();
};

function jswb_internal_readTextFile(f, callback) {
    if (!Modernizr.filereader) {
        jswb.reportError("File is reader not supported by the browser");
    } else {
        var reader = new FileReader();
        reader.onerror = function (e) {
            jswb.reportError("File read failed");
        };
        reader.onload = function(e) {
            callback(e.target.result);
        };        
        reader.readAsText(f);
    }
}

function jswb_internal_saveFile(contents, name) {
    if (name === undefined) name = "untitled";
    var bb = new BlobBuilder();    
    if (typeof contents !== "string") {
        contents = String(contents);
    }
    bb.append(contents);
    var blob = bb.getBlob("application/x-download;charset=" + document.characterSet);
    saveAs(blob, name);
}

function jswb_internal_openFile(callback) {
    if (!Modernizr.filereader) {
        jswb.reportError("File is reader not supported by the browser");
    } else {
        $("#btnOpenFile").click((function (cb) {
            return function (event) {
                 var fileInput = document.getElementById('fileInput');
                 var file = fileInput.files[0];
                 if (cb) {
                     cb(file);
                 }
                 $('#fileOpenDialog').modal('hide');
             };
        })(callback));
        
        // Display the dialog
        $("#fileOpenDialog").modal('show');
    }
}


jswb.save = function (cm) {
    jswb_internal_saveFile(cm.getValue(), cm.tab.title + ".js");
};

jswb.load = function (cm) {
    jswb_internal_openFile((function (editor) {
        return function (file) {
            jswb.loadFile(editor, file);
        };
    })(cm));
};

jswb.serializeState = function () {
    var state = {
        tabs: [],
        console: undefined
    };
    var tabs = jswb.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            state.tabs.push({
                id: tab.id,
                title: tab.title,
                text: tab.editor.getValue()
            });
        }
    }
    
    state.console = jswb.console.innerHTML;
    
    return state;
};

jswb.restoreState = function (state) {
    if (state === undefined) return;
    
    try {
        if (state.tabs) {
            var tabs = state.tabs;
            jswb.closeAllTabs();
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                var newTab = jswb.newTab(tab.title, tab.id);
                newTab.editor.setValue(tab.text);
            }
            if (jswb.tabs.length === 0) {
                jswb.newTab();
            }
        }
        
        // Restore console
        jswb.console.innerHTML = state.console || "";
    } catch (e) {
        jswb.reportError("Unable to restore state: " + e);
    }
};

jswb.saveProject = function (cm) {
    var state = jswb.serializeState();
    jswb_internal_saveFile(JSON.stringify(state), "project.jswb");
};

jswb.loadProject = function (cm) {
    jswb_internal_openFile(function (file) {
        jswb_internal_readTextFile(file, function (contents) {
            jswb.restoreState(JSON.parse(contents));
        });
    });
};
