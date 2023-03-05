import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: 't4' }, new T4DefinitionProvider()));
	const bracketDecorationType = vscode.window.createTextEditorDecorationType({
		light: {
			backgroundColor: 'rgba(255, 100, 0, .2)'
		},
		dark: {
			backgroundColor: 'rgba(0, 100, 255, .2)'
		}
	});

	const codeBlockDecorationType = vscode.window.createTextEditorDecorationType({
		light: {
			backgroundColor: 'rgba(100,100,100,0.1)'
		},
		dark: {
			backgroundColor: 'rgba(220,220,220,0.1)'
		}
	});

	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
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
		const regEx = /(<#@|<#\+|<#=|<#)|(#>)+/g;
		const text = activeEditor.document.getText();
		const brackets: vscode.DecorationOptions[] = [];
		let match: RegExpExecArray;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'T4 Bracket **' + match[0] + '**' };

			brackets.push(decoration);
		}


		const blocks: vscode.DecorationOptions[] = [];

		let index = 0;
		let max = brackets.length;
		brackets.forEach(element => {

			if(index + 1 < max) {
				const start = brackets[index];
				const end = brackets[index + 1];

				const decoration = { range: new vscode.Range(start.range.end, end.range.start), hoverMessage: "" };

				blocks.push(decoration);
			}

			index += 2;
		});

		activeEditor.setDecorations(bracketDecorationType, brackets);
		activeEditor.setDecorations(codeBlockDecorationType, blocks);
	}

	function isT4File(editor: vscode.TextEditor): boolean{
		return editor.document.languageId == "t4";
	}
}

class T4DefinitionProvider implements vscode.DefinitionProvider {
  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
    return new Promise((resolve, reject) => {
      const line = document.lineAt(position.line).text;
      const regEx = /<#@\s*include\s*file\s*=\s*"(?<filepath>[^"]*)"\s*#>/dg;

      const match: RegExpExecArray = regEx.exec(line);
      if (
        !match ||
        position.character < (match as any).indices.groups.filepath[0] ||
        position.character > (match as any).indices.groups.filepath[1]
      ) {
        reject();
        return;
      }

      let definitionFilepath = (match as any).groups.filepath;
      if (!path.isAbsolute(definitionFilepath)) {
        const dirName = path.dirname(document.fileName);
        definitionFilepath = path.join(dirName, definitionFilepath);
      }

      if (!fs.existsSync(definitionFilepath)) {
        reject();
        return;
      }

      const originStart = (match as any).indices.groups.filepath[0];
      const originEnd = (match as any).indices.groups.filepath[1];
      resolve([
        {
          originSelectionRange: new vscode.Range(
            position.with({ character: originStart }),
            position.with({ character: originEnd })
          ),
          targetUri: vscode.Uri.file(definitionFilepath),
          targetRange: new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 0)
          ),
        },
      ]);
    });
  }
}
