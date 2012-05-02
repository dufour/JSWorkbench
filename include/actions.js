$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

function jswb_currentTab() {
    if (window.currentTab) {
        return window.tabs[window.currentTab];
    }
    return undefined;
}

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
    delete window.tabs[id];
}

function jswb_closeAllTabs() {
    var tabs = window.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            jswb_internal_closeTab(tab.id);
        }
    }
    window.tabs = [];
}

function jswb_closeTab(id) {
    jswb_internal_closeTab(id);
    
    // If no tabs remain, create a new one
    if ($("#editor-tabs").children("li").length === 0) {        
        jswb_newTab();
    }
}

function jswb_internal_nextTabID() {
    var tabs = window.tabs;
    var i = 1;
    while (tabs[i]) i++;
    return i;
}

function jswb_internal_makeCloseButton() {
    return $("<button/>").addClass("close").append("&times;");
}

function jswb_newTab(title, id) {
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
            jswb_closeTab(tabID);
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
            window.currentTab = tabID;
        };
    })(id));
    link.dblclick((function (title, tabID) {
        return function (event) {
            var newTitle = prompt("Enter a new name for '" + window.tabs[tabID].title + "'");
            if (newTitle !== null) {
                title.text(newTitle);
                window.tabs[tabID].title = newTitle;
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
    window.tabs[id] = tab;
    editor.tab = tab;
    
    // Activate new tab          
    $("#tab_" + id).tab("show");
    editor.refresh();
    
    return window.tabs[id];
}

function jswb_addAlert(text, title, kind) {
    var alertDiv = $("<div/>").addClass("alert");
    if (kind) alertDiv.addClass("alert-" + kind);
    alertDiv.text(text);
    if (title) {
        alertDiv.prepend($("<strong/>").text(title), " ");
    }
    alertDiv.prepend('<button class="close" data-dismiss="alert">&times;</button>');
    $(window.alerts).append(alertDiv);
}

function jswb_reportError(text, title) {
    if (title === undefined) title = "Error!";
    jswb_addAlert(text, title, "error"); 
}

function jswb_reportWarning(text, title) {
    if (title === undefined) title = "Warning!";
    jswb_addAlert(text, title); 
}

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
          jswb_reportError("File read failed");
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
    var bb = new BlobBuilder();
    bb.append(cm.getValue());
    var blob = bb.getBlob("application/x-download;charset=" + document.characterSet);
    saveAs(blob, cm.tab.title + ".js");
}

function jswb_load(cm) {
    // TODO
}

function jswb_saveProject(cm) {
    alert("Would save project...");
}

function jswb_loadProject(cm) {
    alert("Would load project...");
}
