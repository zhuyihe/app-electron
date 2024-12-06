import { autoUpdater } from 'electron-updater'

import { ipcMain } from 'electron'

const fs = require('fs')

const path = require('path')
// let global.$windows = null
autoUpdater.autoDownload = false

function emptyDir(path) {
    const files = fs.readdirSync(path)
    files.forEach(file => {
        const filePath = `${path}/${file}`
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
            emptyDir(filePath)
        } else {
            fs.unlinkSync(filePath)
            global.logs.info(`删除${file}文件成功`)
            console.log(`删除${file}文件成功`)
        }
    })
}
// const feedUrl = 'http://127.0.0.1:5500/'
// 'https://10.102.11.76/printsoftware/'
export function updateHandle({ feedUrl = 'https://10.102.11.76/printsoftware/', trayCheck = false } = {}) {
    console.log(feedUrl, trayCheck)
    autoUpdater.autoDownload = false
    autoUpdater.setFeedURL(feedUrl)
    // 当更新发生错误的时候触发。
    autoUpdater.on('error', err => {
        global.logs.info(`升级失败${JSON.stringify(err)}`)
        if (err.message.includes('sha512 checksum mismatch')) {
            sendUpdateMessage(-1, 'sha512校验失败')
        }
    })
    // 当开始检查更新的时候触发
    autoUpdater.on('checking-for-update', (event, arg) => {
        global.logs.info('检查更新')
        sendUpdateMessage(0)
    })
    // 发现可更新数据时
    autoUpdater.on('update-available', (event, arg) => {
        let updaterCacheDirName = 'glprinter-updater'
        const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending')
        sendUpdateMessage(1, event.releaseNotes)
        global.logs.info(`检查可用更新${updatePendingPath}`)
        if (updatePendingPath) {
            emptyDir(updatePendingPath)
        }
    })
    // 没有可更新数据时
    autoUpdater.on('update-not-available', (event, arg) => {
        global.logs.info('无更新数据')
        sendUpdateMessage(2)
    })
    // 下载监听
    autoUpdater.on('download-progress', progressObj => {
        sendUpdateMessage(3, progressObj)
    })
    // 下载完成
    autoUpdater.on('update-downloaded', () => {
        global.logs.info('下载完成')
        sendUpdateMessage(4)
    })
    if (trayCheck) {
        global.logs.info('trayCheck执行更新检查')
        autoUpdater.checkForUpdates().catch(err => {
            console.log('网络连接问题', err)
        })
    }
    // 执行更新检查
    ipcMain.on('check-update', () => {
        global.logs.info('执行更新检查')
        autoUpdater.checkForUpdates().catch(err => {
            console.log('网络连接问题', err)
        })
    })
    // 退出并安装
    ipcMain.on('confirm-update', () => {
        global.logs.info('开始安装')
        autoUpdater.quitAndInstall()
    })

    // 手动下载更新文件
    ipcMain.on('confirm-downloadUpdate', () => {
        global.logs.info('开始下载')
        autoUpdater.downloadUpdate()
    })
}

function sendUpdateMessage(type, data) {
    console.log(type, data, 'wdq')
    const senddata = {
        state: type,
        msg: data || ''
    }
    global.$windows.webContents.send('UpdateMsg', senddata)
}
