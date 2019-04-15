"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
function activate(context) {
    var bracketDecorationType = vscode.window.createTextEditorDecorationType({
        light: {
            backgroundColor: 'rgba(255, 100, 0, .2)'
        },
        dark: {
            backgroundColor: 'rgba(0, 100, 255, .2)'
        }
    });
    var codeBlockDecorationType = vscode.window.createTextEditorDecorationType({
        light: {
            backgroundColor: 'rgba(100,100,100,0.1)'
        },
        dark: {
            backgroundColor: 'rgba(220,220,220,0.1)'
        }
    });
    var activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }
    vscode.window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 200);
    }
    function updateDecorations() {
        if (!activeEditor || !isT4File(activeEditor)) {
            return;
        }
        var regEx = /(<#@|<#\+|<#=|<#|#>)+/g;
        var text = activeEditor.document.getText();
        var brackets = [];
        var match;
        while (match = regEx.exec(text)) {
            var startPos = activeEditor.document.positionAt(match.index);
            var endPos = activeEditor.document.positionAt(match.index + match[0].length);
            var decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'T4 Bracket **' + match[0] + '**' };
            brackets.push(decoration);
        }
        var blocks = [];
        var index = 0;
        var max = brackets.length;
        brackets.forEach(function (element) {
            if (index + 1 < max) {
                var start = brackets[index];
                var end = brackets[index + 1];
                var decoration = { range: new vscode.Range(start.range.end, end.range.start) };
                blocks.push(decoration);
            }
            index += 2;
        });
        activeEditor.setDecorations(bracketDecorationType, brackets);
        activeEditor.setDecorations(codeBlockDecorationType, blocks);
    }
    function isT4File(editor) {
        return editor.document.languageId == "t4";
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map