// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as child_process from 'node:child_process'

function checkPackageExists(packageName: string) {
    const rootPath = vscode.workspace.rootPath
    if (!rootPath) {
        throw new Error('No workspace opened.')
    }

    const { devDependencies, dependencies } = require(path.join(rootPath, 'package.json'))

    return !!(devDependencies?.[packageName] || dependencies?.[packageName])
}

function executeCommand(command: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const options = { cwd };

        child_process.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// prettier.format("", {
//     plugins: ['prettier-plugin-ux']
// })

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    if (!checkPackageExists('prettier') || !checkPackageExists('prettier-plugin-ux')) {
        vscode.window.showInformationMessage('监测到没有安装prettier和prettier-plugin-ux, 使用命令: npm install prettier prettier-plugin-ux --save-dev 安装')
    }

    const formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider('ux', {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            // 包没装，直接return
            if (!checkPackageExists('prettier') || !checkPackageExists('prettier-plugin-ux')) {
                return []
            }

            // 读取根目录
            const workspaceRoot = vscode.workspace.rootPath
            if (!workspaceRoot) {
                return []
            }

            // 获取当前需要格式化的文件
            const filePath = document.uri.fsPath;
            const prettierCommand = `npx prettier --write ${filePath}`

            try {
                await executeCommand(prettierCommand, workspaceRoot)
            } catch(err) {
                vscode.window.showErrorMessage((err as child_process.ExecException).message)
            }

            return []
        }
    })

    context.subscriptions.push(formatterDisposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
