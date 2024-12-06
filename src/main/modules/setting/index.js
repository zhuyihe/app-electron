import { Menu } from 'electron'

const setting = app => {
    //开机自启动
    app.setLoginItemSettings({
        //  开机启动
        openAtLogin: true,
        //  开机启动时为隐藏启动
        openAsHidden: true
    })
    app.setAppUserModelId(app.name)
    if (!global.isDevMode) Menu.setApplicationMenu(null)
}

export default setting
