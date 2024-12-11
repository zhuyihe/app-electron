import { app } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
//  窗体管理
import windowService from './modules/windowServics'
import modules from './modules'
import watchProtocol from './modules/protocol/watch'
let windowServe = windowService()

/**
 * @description 启动App
 * @author zyh
 * @date 19/08/2022
 * @export
 * @returns {*}  {void}
 */
export default function launchApp() {
    // 单例
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        return app.quit()
    }
    let win
    // 设置应用名称
    app.setName('Glprinter')
    // protocol.registerSchemesAsPrivileged([
    //     {
    //         scheme: 'app',
    //         privileges: {
    //             secure: true,
    //             standard: true
    //         }
    //     }
    // ])
    app.commandLine.appendSwitch('ignore-certificate-errors')
    /**
     * 打开主界面
     */
    function createWindow() {
        win = windowServe.createMainWin()
        global.$windows = win
        win.on('close', e => {
            //  未指定强制退出，都一律隐藏
            if (!global.forceQuit) {
                e.preventDefault()
                win.hide()
            }
        })
        win.on('show', e => {
            e.preventDefault()
            win.setAlwaysOnTop(true)

            setTimeout(() => {
                win.setAlwaysOnTop(false)
            }, 100)
        })
        console.log(process.env.WEBPACK_DEV_SERVER_URL, 'process.env.WEBPACK_DEV_SERVER_URL')
        if (!process.env.WEBPACK_DEV_SERVER_URL) {
            createProtocol('app')
            win.loadURL('app://./index.html')
        } else {
            win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        }
        if (global.isDevMode) win.webContents.openDevTools()
    }
    app.on('window-all-closed', e => {
        if (global.forceQuit) {
            app.quit()
        } else {
            e.preventDefault()
        }
    })
    // app.once('ready-to-show', () => {
    //     win.hide()
    // })
    //限制最大窗口数量 单例模式
    // eslint-disable-next-line no-unused-vars
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        const mainWindow = windowServe.mainWindow
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
            mainWindow.focus()
            mainWindow.show()
        }
        commandLine.forEach(str => {
            watchProtocol(str)
        })
    })
    app.on('open-url', (event, url) => {
        watchProtocol(url)
    })
    app.on('activate', () => {
        if (win === null) {
            createWindow()
        }
    })
    app.on('ready', async () => {
        // protocol.registerFileProtocol('atom', (request, callback) => {
        //     const url = request.url.substr(8)
        //     callback(decodeURI(url))
        // })
        await createWindow()
        modules.init(app)

        // console.log(global, 'wqdqwdqw')
    })
    process.on('uncaughtException', (error) => {
        // 在这里处理异常
        console.error('Uncaught Exception:', error);
        // 这里可以进行进一步的处理，比如关闭应用程序
        // app.quit();
    });
    // modules.init(app);
    if (global.isDevMode) {
        if (global.isWindows) {
            process.on('message', data => {
                if (data === 'graceful-exit') {
                    app.quit()
                }
            })
        } else {
            process.on('SIGTERM', () => {
                app.quit()
            })
        }
    }
}