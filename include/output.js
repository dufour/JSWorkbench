jswb.outputPlugins = jswb.outputPlugins || [];

// ----- Plugins ------

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
    clear: function (container) {
        $(container).children("pre").empty();
    },
    builtins: {
        println: function (s) {
            $(jswb.output).children("pre").append($("<span/>").text(s), "\n");
        },
    },
};
jswb.outputPlugins.push(PlainTextOutput);

var PixelGridOutput = {
    label: "Grid",
    draw: function (container) {    
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
    clear: function (container) {
        $(container).empty();
        this.draw(container);
    },
    builtins: {
        setPixel: function (r, c, color) {
            if (!color) color = "black";
            $("#pixel_" + r + "_" + c, jswb.output).css('background-color', color);
        },
        clearPixel: function (r, c) {
            $("#pixel_" + r + "_" + c, jswb.output).css('background-color', 'transparent');
        },
        resetPixels: function () {
            PixelGridOutput.clear(jswb.output);
        },
        ROWS: 10,
        COLUMNS: 10,
    },
};
jswb.outputPlugins.push(PixelGridOutput);

jswb.clearOutput = function () {
    var p = jswb.currentOutput;
    if (p && p.clear) {
        p.clear(jswb.output);
    } else if (jswb.output) {
        $(jswb.output).empty();
    }
};

jswb.onOutputKindClicked = function (outputPlugin) {
    var container = jswb.output;
    $("[data-jswb-role=outputKindLabel]", container.parentNode).text(outputPlugin.label);
    jswb.currentOutput = outputPlugin;
    jswb.builtins = outputPlugin.builtins || {};
    
    
    $(container).empty();
    if (outputPlugin.draw) {        
        outputPlugin.draw(container);
    }
};

jswb.moveOutput = function (srcWindow, dstWindow, $) {
    var srcDocument = srcWindow.document;
    var dstDocument = dstWindow.document;

    // Move output box
    var newOutput = $(".outputBox", dstDocument).get(0);
    newOutput.innerHTML = jswb.output.innerHTML;
    jswb.output = newOutput;

    // Copy active plugin name
    var label_selector = "[data-jswb-role=outputKindLabel]";
    $(label_selector, dstDocument).text($(label_selector, srcDocument).text());

    // Move dropdown items
    var dropdown_selector = "[data-jswb-role=outputKindDropdown]";
    var dropdown = $(dropdown_selector, dstDocument).empty();
    $(dropdown_selector + " > li", srcDocument).remove().appendTo(dropdown);

    // $("[data-jswb-role=outputKindDropdown] > li", srcDocument).remove().appendTo($("#popup-dropdownOutputKind", dstDocument).empty());

    
    // $("[data-jswb-role=outputKindDropdown] > li", srcDocument).remove().appendTo(dropdown);
}

jswb.detachOutput = function () {
    var popup = window.open("popup.html", "", "width=420,height=375,location=no,status=no,toolbar=no,menubar=no");
    popup.focus();
    popup.jswb = jswb;

    $("#outputColumn").hide();
    $("#editorColumn").removeClass("span8").addClass("span12");
};

jswb.attachOutput = function (popup) {
    jswb.moveOutput(popup, popup.opener, popup.$);

    $("#outputColumn").show();
    $("#editorColumn").removeClass("span12").addClass("span8");
};

function jswb_internal_populateOutputKinds(container) {
    var dropdown = $(container).empty();
    for (var i = 0; i < jswb.outputPlugins.length; i++) {
        var p = jswb.outputPlugins[i];
        var link = $('<a href="#"/>').click((function (thePlugin) {
            return function (event) {
                event.preventDefault(); // Don't navigate to "#"
                jswb.onOutputKindClicked(thePlugin);
            };
        })(p)).text(p.label);
        dropdown.append($("<li/>").append(link));
    }
}

$(document).ready(function () {
    jswb_internal_populateOutputKinds(document.getElementById("dropdownOutputKind"));
    jswb.onOutputKindClicked(NoOutput);
});
