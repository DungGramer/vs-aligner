import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("vs-aligner.align", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const document = editor.document;
    const selection = editor.selection;

    const delimiters = vscode.workspace
      .getConfiguration("commentAligner")
      .get<string[]>("delimiter") || ["//"];
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    const lines = [];
    for (let line = startLine; line <= endLine; line++) {
      lines.push(document.lineAt(line).text);
    }

    const alignedLines = alignLines(lines, delimiters);

    // Trim trailing spaces from the last line
    alignedLines[alignedLines.length - 1] =
      alignedLines[alignedLines.length - 1].trimEnd();

    editor.edit((editBuilder) => {
      editBuilder.replace(
        new vscode.Range(
          startLine,
          0,
          endLine,
          document.lineAt(endLine).text.length
        ),
        alignedLines.join("\n")
      );
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function alignLines(lines: string[], delimiters: string[]): string[] {
  const allParts = lines.map((line) =>
    removeBadSpace(parseLine(line, delimiters))
  );
  const maxPartsLengths: number[] = new Array(allParts[0].length).fill(0);

  // Determine the maximum length needed for each segment to align properly
  allParts.forEach((parts) => {
    parts.forEach((part, index) => {
      maxPartsLengths[index] = Math.max(
        maxPartsLengths[index],
        part.trimEnd().length
      );
    });
  });

  return allParts.map((parts) => {
    return parts
      .map((part, index) => {
        part = part.trimEnd();
        const additionalSpace = index < parts.length - 1 ? " " : ""; // Add space between parts except the last part
        return (
          part +
          " ".repeat(maxPartsLengths[index] - part.length) +
          additionalSpace
        );
      })
      .join("");
  });
}

function parseLine(lineText: string, delimiters: string[]): string[] {
  let parts = [lineText];
  delimiters.sort((a, b) => b.length - a.length); // Sort by length to prioritize longer delimiters
  delimiters.forEach((delimiter) => {
    parts = parts.flatMap((part) => {
      const regex = new RegExp(`(${escapeRegExp(delimiter)})`);
      return part.split(regex).filter((part) => part !== "");
    });
  });
  return parts;
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function removeBadSpace(arr: string[]) {
  return arr
    .map((part, index) => {
      return index > 1 ? part.trim() : part; //TODO: Not trim space first line because can't check this line in block or not
    })
    .filter(Boolean);
}