//
// Electronを用いたデスクトップアプリの開発
// 
// このアプリケーションの構成
// - バックエンド
//  - app/main.js      ウィンドウの作成、アプリの制御を担う。
//  - app/preload.js   レンダープロセス(renderer/index.html)にバックエンドとやり取りするための関数等を定義します。
// 
// - フロントエンド(レンダープロセス)
//  - renderer/index.html
//  - renderer/assets/css/style.css


// アプリ制御とブラウザウィンドウの作成するモジュールを読み込む
const { app, BrowserWindow, ipcMain } = require('electron')

// ファイルパスを楽に扱うためのライブラリ
const path = require('path')

// ファイルシステム : プロミス版
const fs = require('fs').promises


// パスを繋げて正規化する
function normalize(...item) {
    return path.normalize(path.join(...item))
}


// 与えられたfilepathがディレクトリか判定する
function isDirectory(filepath) {
    return fs.stat(filepath)
        .then(fd => fd.isDirectory())
        .catch(() => false)
}


// ファイルパスからファイル情報を取得する
async function openFile(filepath) {
    try {
        await fs.access(filepath, fs.constants.R_OK | fs.constants.W_OK)
    }
    catch {
        return {}
    }
        
    try {
        return {
            filepath,
            fd: await fs.stat(filepath)
        }
    }
    catch {
        return {}
    }
}

// 与えられたパス(rawPath)がディレクトリであれば、その直下のアクセス可能なファイルのリストを求める
async function handleFsDir(rawPath) {
    const filepath = normalize(rawPath)
    try {
        await fs.access(filepath, fs.constants.R_OK | fs.constants.W_OK)
    }
    catch {
        // アクセス権限無しのとき
        return []
    }
    // OK!アクセス可能みたいだ

    if (!await isDirectory(filepath)) {
        return []
    }

    const files = await fs.readdir(filepath)
    return Promise.all(files.map(item => openFile(normalize(filepath, item))))
        .then(stats => stats.filter(({filepath, fd}) => filepath && fd)
            .map(({filepath, fd}) => ({
                isDirectory: fd.isDirectory(),
                isFile: fd.isFile(),
                filename: fd.isFile()? path.relative(path.join(__dirname, '..', 'renderer'), filepath): filepath,
            }))
        )
}


// ファイルの先頭からsizeバイトを読み込む。
//
// @param {String} filepath 
// @param {Number} size 
// @return Promise<String, >
function lReadBytes(filepath, size) {
    return fs.open(filepath)
        .then(fd => new Promise((resolve, reject) => {
            const rstrm = fd.createReadStream({start: 0})
            rstrm.on('readable', () => {
                const chunk = rstrm.read(size)
                if (chunk === null) {
                    reject(`could not read(${size}).`)
                }
                else {
                    resolve(chunk)
                }
            })
        }))
}


// PNGのマジックナンバー: 十進数表現
const PNG_B10 = [137, 80 ,78, 71]


// ファイルの種類をマジックナンバーから判定する
//
// @param {String} filepath
// @param {[Number]} magicNumber
// @return {Promise<boolean, String>}
async function whatKindOf(filepath, magicNumber) {
    const bytes = await lReadBytes(filepath, magicNumber.length)
    const buf = Buffer.from(bytes)
    return magicNumber.map((n, offset) => n === buf.readUInt8(offset))
        .every(x => x)
}


function createWindow() {
    // ブラウザウィンドウを作成する
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // ウィンドウにアプリの起点となるHTMLファイル読み込む
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))

    // 開発ツールを開く
    mainWindow.webContents.openDevTools()
}


// このメソッドは、Electronの初期化が完了しブラウザウィンドウの作成準備が整った後で呼び出されます。
// 一部のAPIは、このイベントが起動してからではないと使用することができません。
app.whenReady().then(() => {
    // 準備が終わったらウィンドウを作成する
    createWindow()

    app.on('activate', function () {
        // macOSの場合、ウィンドウは再作成されることが一般的です。
        // ドックにアイコンがあるとき、かつ、このアプリのウィンドウが何一つ開かれていないときに限り、ウィンドウを再作成する。
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// 全てのウィンドウが閉じられたときにアプリを終了します。
app.on('window-all-closed', function () {
    // ただし、macOSを除きます。
    // macOSでアプリケーションを終了するには、以下の方法があります。
    // - ウィンドウ上で⌘+Qを入力する
    // - ドックからアプリケーションを終了させる
    // - etc...
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('fs:dir', (event, path) => handleFsDir(path))

