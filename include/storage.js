function jswb_clearSession() {
    localStorage.removeItem("jswb.tabs");
    localStorage.removeItem("jswb.console");
}

function jswb_saveSession() {
    var tabData = [];

    // Save tabs
    var tabs = window.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            tabData.push({
                id: tab.id,
                title: tab.title,
                text: tab.editor.getValue()
            });
        }
    }
    localStorage["jswb.tabs"] = JSON.stringify(tabData);

    // Save console
    localStorage["jswb.console"] = window.output.innerHTML;
    
    // Save execution environment
    // TODO
}

function jswb_loadSession() {
    // Restore tabs
    var tabData = localStorage["jswb.tabs"];
    if (tabData) {
        jswb_closeAllTabs();
        var tabs = JSON.parse(tabData);
        if (tabs.length > 0) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                var newTab = jswb_newTab(tab.title, tab.id);
                newTab.editor.setValue(tab.text);
            }    
        }
        if (window.tabs.length === 0) {
            jswb_newTab();
        }
    }
    
    // Restore console
    window.output.innerHTML = localStorage["jswb.console"] || "";
    
    // Restore execution environment
    // TODO
}