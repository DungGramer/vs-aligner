import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // console.log('Congratulations, your extension "vs-aligner" is now active!');
  const disposable = vscode.commands.registerCommand("vs-aligner.align", () => {
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;

    const selection = vscode.window.activeTextEditor?.selection;

    const startLine = selection?.start.line;
    const endLine = selection?.end.line;

    const commentInfoArray = [];

    if (!endLine || !document || !editor || !startLine) {
      return;
    }

    for (let line = startLine; line <= endLine; line++) {
      const curLineText = document.lineAt(line).text;
      const commentInfo = getCommentInfo(curLineText);

      commentInfoArray.push(commentInfo);
    }

    const maxCommentIndex = Math.max(
      ...commentInfoArray.map((info) => info.commentIndex)
    );

    const newTextArray = commentInfoArray.map((info) => {
      if (info.commentIndex === -1) {
        return info.textWithoutComment;
      }
      // return info.textWithoutComment.padEnd(maxCommentIndex, ' ') + info.comment;
			return info.textWithoutComment + addBlankString(maxCommentIndex - info.commentIndex) + info.comment;
    });

    const newText = newTextArray.join("\n");
    const range = new vscode.Range(
      startLine,
      0,
      endLine,
      document.lineAt(endLine).text.length
    );

    editor.edit((editBuilder) => {
      editBuilder.replace(range, newText);
    });
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function addBlankString(num: number) {
  const userSetting = vscode.workspace.getConfiguration('editor');
  const userTabSize = (userSetting.get('tabSize') || 4) as number;

	const tabSize: undefined | number | null = vscode.workspace.getConfiguration('vs-aligner').get('tabSize');
	const alignmentChar = vscode.workspace.getConfiguration('vs-aligner').get('alignmentChar', ' ');

  let blankStr = "";
  for (let i = 0; i < num; i++) {
    blankStr += alignmentChar.repeat((tabSize || userTabSize) / 2);
  }
  return blankStr;
}

function getCommentInfo(lineText: string) {
  const commentIndex = lineText.lastIndexOf("//");
  const comment = commentIndex === -1 ? "" : lineText.slice(commentIndex);
  const textWithoutComment =
    commentIndex === -1 ? lineText : lineText.slice(0, commentIndex);
  return { commentIndex, comment, textWithoutComment };
}
