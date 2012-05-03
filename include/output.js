jswb.outputPlugins = jswb.outputPlugin || [];

var NoOutput = {
    label: "No output",
    draw: undefined,
    builtins: {},
};
jswb.outputPlugins.push(NoOutput);

var PlainTextOutput = {
    label: "Text",
    draw: function (container) {
        $(container).append($("<pre/>").attr("style", "height: 100%; border: none; overflow: scroll;"));
    },
    clear: function () {
        $("#outputBox > pre").empty();
    },
    builtins: {
        println: function (s) {
            $("#outputBox > pre").append($("<span/>").text(s), "\n");
        },
    },
};
jswb.outputPlugins.push(PlainTextOutput);

var PixelGridOutput = {
    label: "Grid",
    draw: function (container) {
        this.container = container;
        var table = $("<table/>").addClass("pixelBox");
        var rows = 10;
        var columns = 10;
        for (var i = 0; i < rows; i++) {
            var row = $("<tr/>");
            for (var j = 0; j < columns; j++) {
                row.append($("<td/>").attr("id", "pixel_" + i + "_" + j));
            }
            table.append(row);
        }
        $(container).append(table);
    },
    clear: function () {
        $(this.container).empty();
        this.draw(this.container);
    },
    builtins: {
        setPixel: function (r, c, color) {
            if (!color) color = "black";
            $("#pixel_" + r + "_" + c).css('background-color', color);
        },
        clearPixel: function (r, c) {
            $("#pixel_" + r + "_" + c).css('background-color', 'transparent');
        },
    },
};
jswb.outputPlugins.push(PixelGridOutput);

function jswb_clearOutput() {
    var p = jswb.currentOutput;
    if (p && p.clear) {
        p.clear();
    } else {
        $("#outputBox").empty();
    }
}

function jswb_onOutputKindClicked(outputPlugin) {
    $("#btnOutputKind > span.btnLabel").text(outputPlugin.label);
    jswb.currentOutput = outputPlugin;
    jswb.builtins = outputPlugin.builtins || {};
    
    if (outputPlugin.draw) {
        var container = document.getElementById("outputBox");
        $(container).empty();
        outputPlugin.draw(container);
    }
}

$(document).ready(function () {
    var dropdown = $("#dropdownOutputKind").empty();
    for (var i = 0; i < jswb.outputPlugins.length; i++) {
        var p = jswb.outputPlugins[i];
        var link = $('<a href="#"/>').click((function (thePlugin) {
            return function (event) {
                event.preventDefault(); // Don't navigate to "#"
                jswb_onOutputKindClicked(thePlugin);
            };
        })(p)).text(p.label);
        dropdown.append($("<li/>").append(link));
    }
    jswb.currentOutput = NoOutput;
});