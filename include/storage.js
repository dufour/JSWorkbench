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
    jswb_closeAllTabs();
    var tabData = localStorage["jswb.tabs"];
    var tabs = tabData ? JSON.parse(tabData) : [];
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        var newTab = jswb_newTab(tab.title, tab.id);
        newTab.editor.setValue(tab.text);
    }    
    
    // Restore console
    window.output.innerHTML = localStorage["jswb.console"] || "";
    
    // Restore execution environment
    // TODO
}