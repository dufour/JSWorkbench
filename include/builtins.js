function print(s) {
    if (typeof s !== "string") {
        s = String(s);
    }
    
    if (jswb.currentConsoleLine) {
        $(jswb.currentConsoleLine).append($("<span/>").text(s));
    } else {
        jswb.currentConsoleLine = document.createElement('span');
        jswb.console.appendChild(jswb.currentConsoleLine);
        $(jswb.currentConsoleLine).addClass("console-output").text(s);
    }
    
    if (s.charAt(s.length - 1) === "\n") {
        jswb.currentConsoleLine = undefined;
    } 
}

function println(s) {
    if (jswb.currentConsoleLine) {
        $(jswb.currentConsoleLine).append($("<span/>").text(s));
        jswb.currentConsoleLine = undefined;
        $(jswb.console).append("\n");
    } else {
        jswb.addLineToConsole(s, "console-output");
    }
}
