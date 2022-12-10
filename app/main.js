// sample electron app
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
// ipcMain is used to communicate between the main process and the renderer process
const { ipcMain } = require('electron');
// ipcRenderer is used to communicate between the renderer process and the main process
const { ipcRenderer } = require('electron');
const downloader = require("electron-download-manager");
let win;
let windows = new Set()

const createWindow = exports.createWindow = () => {
    let newWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, } });
    // newWindow.loadFile(path.join(__dirname, 'index.html'));
    newWindow.loadFile(path.join(__dirname, 'base.html'));
    newWindow.openDevTools();
    newWindow.once('ready-to-show', () => {
    newWindow.show();
    });
    newWindow.on('closed', () => {
    windows.delete(newWindow);
    newWindow = null;
    });
    windows.add(newWindow);
    return newWindow;
    };

app.on('ready',()=>createWindow());
// register listener for message from renderer process
ipcMain.on('register', (event, arg) => {
    // write window to variable and mark window as hidden and its register.html as content
    let win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, } });
    // check if windows has more than 1 window
    if (windows.size >= 1) {
        // if yes, close all windows except the window that is currently open
        for (let window of windows) {
            if (window !== win) {
                window.close();
            }
        }
    }
    // make window visible
    win.once('ready-to-show', () => {
        win.show();
    });
    win.webContents.loadFile(path.join(__dirname, 'register.html'));
    win.openDevTools();
    windows.add(win)
    win.on('closed', () => {
        windows.delete(win);
        win = null;
    });

    // close first window
    // console.log(windows)
});



// receive message from renderer process
ipcMain.on('login', (event) => {
    // same as register 
    let win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, } });
    if (windows.size >= 1) {
        for (let window of windows) {
            
            if (window !== win) {
                window.close();
            }
        }
    }

    win.once('ready-to-show', () => {
        win.show();
    }
    );
    win.webContents.loadFile(path.join(__dirname, 'login.html'));
    win.openDevTools();
    windows.add(win)
    win.on('closed', () => {
        windows.delete(win);
        win = null;
    });
});

ipcMain.on('login-success', (event, arg) => {
    // send home message to main process
    ipcMain.emit('home', event, arg);
});

// function for render homescreen after login
ipcMain.on('home', (event, arg) => {
    let win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, } });
    if (windows.size >= 1) {
        for (let window of windows) {
            if (window !== win) {
                window.close();
            }
        }
    }
    win.once('ready-to-show', () => {
        win.show();
    }
    );
    win.webContents.loadFile(path.join(__dirname, 'main.html'));
    win.openDevTools();
    windows.add(win)

    win.on('closed', () => {
        windows.delete(win);
        win = null;
    }
    );
});



app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
})


ipcMain.on("download", (event, url) => {
    downloader.register({
        downloadFolder: app.getPath("downloads"),
    })
    downloader.download({
        url: url,
    }, (error, info) => {
        if (error) {
            console.log(error);
        }
        // send message to renderer process
        event.sender.send("downloaded", info);
    }
    );
});