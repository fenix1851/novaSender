// sample electron app
const {
    app,
    BrowserWindow
} = require('electron');
const path = require('path');
const url = require('url');
// ipcMain is used to communicate between the main process and the renderer process
const {
    ipcMain
} = require('electron');
// ipcRenderer is used to communicate between the renderer process and the main process
const {
    ipcRenderer
} = require('electron');
const downloader = require("electron-download-manager");
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const {
    default: axios
} = require('axios');
let win;
let windows = new Set()


const createWindow = exports.createWindow = () => {
    let newWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false
        }
    });
    newWindow.loadFile(path.join(__dirname, 'index.html'));
    // newWindow.loadFile(path.join(__dirname, 'sender.html'));
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

(async () => {
    pie.initialize(app);
    app.whenReady().then(createWindow);
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
})();

// app.on('ready', async () => {
//     await pie.initialize(app);
//     createWindow()});
// register listener for message from renderer process
ipcMain.on('register', (event, arg) => {
    // write window to variable and mark window as hidden and its register.html as content
    let win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
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
    // win.openDevTools();
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
    let win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    if (windows.size >= 1) {
        for (let window of windows) {

            if (window !== win) {
                window.close();
            }
        }
    }

    win.once('ready-to-show', () => {
        win.show();
    });
    win.webContents.loadFile(path.join(__dirname, 'login.html'));
    // win.openDevTools();
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
    let win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    if (windows.size >= 1) {
        for (let window of windows) {
            if (window !== win) {
                window.close();
            }
        }
    }
    win.once('ready-to-show', () => {
        win.show();
    });
    win.webContents.loadFile(path.join(__dirname, 'main.html'));
    // win.openDevTools();
    windows.add(win)

    win.on('closed', () => {
        windows.delete(win);
        win = null;
    });
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
    });
});

ipcMain.on('test-puppeteer', async (event, arg) => {
    console.log('test-puppeteer1')
    try {
        const browser = await pie.connect(app, puppeteer, {
            args: ['--enable-features=NetworkService',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--shm-size=1gb', // this solves the issue
                '--single-process',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
            ]
        });

        const window = new BrowserWindow();
        const url = "https://google.com/";
        await window.loadURL(url);
        await window.webContents.executeJavaScript('document.body.style.backgroundColor = "red"');
        // wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        const page = await pie.getPage(browser, window);
        console.log(page.url());
        window.destroy();
    } catch (error) {
        console.log(error)
    }
});

const timeout = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


ipcMain.on('startDistribution', async (event, arg) => {
    // send message to renderer process
    event.sender.send('startDistribution', 'startDistribution');
    // get url from renderer process
    const url = arg.url;
    const status = arg.status;
    // load whatsapp web url
    let userAgent = ''
    // check the platform and set user agent
    if (process.platform === 'darwin') {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    } else if (process.platform === 'win32') {
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    } else if (process.platform === 'linux') {
        userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    }
    switch (status) {
        case 'start':
            const loginWindow = new BrowserWindow()
            // load url with user agent and disabled default user agent
            let whatsappUrl = url.split('?')[0]
            console.log(whatsappUrl)
            await loginWindow.loadURL("https://web.whatsapp.com/send/?phone=422342342342&text=ae&type=phone_number&app_absent=0", {
                userAgent: userAgent,
                extraHeaders: 'pragma: no-cache\n',

            });
            // wait for closing the window
            await new Promise(resolve => loginWindow.on('closed', resolve));
            break;
        case 'reload':

            break;
    }

    const browser = await pie.connect(app, puppeteer, {
        args: ['--enable-features=NetworkService',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--shm-size=1gb', // this solves the issue
            '--single-process',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
        ]
    });
    // get browser version
    const version = await browser.version();
    console.log(version);
    // create new window
    const window = new BrowserWindow();
    // load url in window



    window.on('close', () => {
        event.sender.send('endDistribution', '501');
    })
    // localStorage.setItem('cnt', 1)
    // let cnt = localStorage.getItem('cnt')
    let bool = true

    await window.loadURL(url, {
        userAgent: userAgent,
        extraHeaders: 'pragma: no-cache\n'
    });
    const page = await pie.getPage(browser, window);
    while (bool) {
        try {
            await window.loadURL(url, {
                userAgent: userAgent,
                extraHeaders: 'pragma: no-cache\n'
            });
            await timeout(500);
            let noredirectURL = url + '&noRedirect=1'
            let response = await axios.get(noredirectURL)

            //wait for 0.5 seconds
            // get status code from window.loadURL
            let status = response.status
            // wait for did-navigation event in promise and get status code

            // window.webContents.on('did-navigate', async (event, url, httpResponseCode, httpStatusText) => {
            //     console.log('did-navigate')
            //     console.log(httpResponseCode)
            //     let status = httpResponseCode
            //     console.log(status)

            // })      
            // get status code from page 404, 500, 201, 402 via executeJavaScript
            console.log("status", status)
            switch (status) {
                case 201:
                    console.log('201')
                    // close 
                    event.sender.send('endDistribution', '201');
                    console.log('done')
                    windows.delete(window)
                    await window.destroy()
                    break
                case 402:
                    console.log('402')
                    // close 
                    event.sender.send('endDistribution', '402');
                    console.log('erroe')
                    windows.delete(window)
                    await window.destroy()
                    break
                case 500:
                    console.log('500')
                    // close 
                    event.sender.send('endDistribution', '500');
                    console.log('erroe')
                    windows.delete(window)
                    await window.destroy()
                    break
                case 404:
                    console.log('404')
                    // close
                    event.sender.send('endDistribution', '404');
                    console.log('erroe')
                    windows.delete(window)
                    await window.destroy()
                    break
            }




            await page.setCacheEnabled(false);
            // if (cnt = 0) {
            //     await page.waitForSelector('canvas', {
            //         timeout: 0
            //     })
            //     // ждать исчезновения канваса
            //     console.log('canvas is loaded')
            //     // ждать пока полностью не загрузится страница
            //     await page.waitForNavigation({
            //         waitUntil: 'networkidle2',
            //         timeout: 0
            //     });
            //     console.log('page is loaded')
            //     await timeout(2000)
            //     localStorage.setItem('cnt', 1)
            // }
            // ждать появления div с data-test-id="conversation-panel-wrapper"
            try {
                await page.waitForSelector('div[data-testid="conversation-panel-wrapper"]', {
                    timeout: 15000
                })
            } catch (error) {
                await page.waitForSelector('div[data-testid="popup-controls-ok"]', {
                    timeout: 0
                })
                await page.click('div[data-testid="popup-controls-ok"]');
                await window.loadURL(url, {
                    userAgent: userAgent
                });
                continue

            }


            console.log('div[data-test-id="conversation-panel-wrapper"] is loaded')
            console.log('page is loaded')
            // ждать 2 секунды div с data-test-id="confirm-popup"
            // дождаться загрузки страницы
            await page.waitForSelector('span[data-testid="send"]');
            // ждать 0.5 секунды чтобы успело прогрузиться
            await timeout(1500)
            console.log('send is loaded')
            // найти span с data-testid="send" и кликнуть по нему
            await page.click('span[data-testid="send"]');
            console.log('send is clicked')
            // ждать создания нового div с классом _1-FMR message-out focusable-list-item
            // await page.waitForSelector('div._1-FMR.message-out.focusable-list-item');
            await timeout(1500)
            console.log('new message is loaded')
            


        } catch (error) {
            console.log('503')
            console.log(error)
            console.log(error.name)
            console.log(error.message)
            console.log(error.code)

            let errorcode = error.code
            if (error.message.includes('net') || error.message.includes('5000')) {
                errorcode = 'ERR_ABORTED'

                event.sender.send('reloadDistribution', url);
                windows.delete(window)
                await window.destroy()
                break
                bool = false


            } else if (status == 201) {
                // event.sender.send('endDistribution', '201');
                break
                bool = false

            } else {
                event.sender.send('endDistribution', '503');
                console.log('erroe')
                windows.delete(window)
                await window.destroy()
                bool = false
                break
            }
        }

    }

    // ждать канвас
})