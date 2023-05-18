//
// コンテキストブリッジによるセキュリティを考慮したメインプロセスとレンダープロセス間の連携
// 
// 詳細は、次のURLを参照。
// - https://www.electronjs.org/ja/docs/latest/tutorial/context-isolation
// - https://www.electronjs.org/ja/docs/latest/tutorial/sandbox
//

const { contextBridge, ipcRenderer } = require('electron')


// コンテキストブリッジを用いてレンダープロセスにメインプロセスの機能をAPIとして公開します。
// レンダープロセスからimgViewer変数を通じてアクセス可能になる。
contextBridge.exposeInMainWorld('imgViewer', {

    // メインプロセスの機能を公開するときは、直接扱えないようにすること。
    // ここでは、無名関数で包むことにより、ipcRenderer.invokeを直接使えないようにしている。

    // ファイルリストを取得する
    // 
    // @param {string} path ディレクトリパス
    // @return {[object]} ファイルリスト
    dir: path => ipcRenderer.invoke('fs:dir', path)

    // 以下に危険な公開方法を示す。
    // invoke: ipcRenderer.invoke
})
