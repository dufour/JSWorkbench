function print(s) {
    if (typeof s !== "string") {
        s = String(s);
    }
    
    if (window.currentConsoleLine) {
        $(window.currentConsoleLine).append($("<span/>").text(s));
    } else {
        window.currentConsoleLine = document.createElement('span');
        window.output.appendChild(window.currentConsoleLine);
        $(window.currentConsoleLine).addClass("console-output").text(s);
    }
    
    if (s.charAt(s.length - 1) === "\n") {
        window.currentConsoleLine = undefined;
    } 
}

function println(s) {
    if (window.currentConsoleLine) {
        $(window.currentConsoleLine).append($("<span/>").text(s));
        window.currentConsoleLine = undefined;
        $(window.output).append("\n");
    } else {
        jswb_addLineToConsole(s, "console-output");
    }
}