// //  应用储存模块
// import appStorageModule from './appStorage'

// // //  设置模块
// import settingModule from './setting'
import service from '@/service'
import electronStore from './electronStore'
import setting from './setting'
import events from './events'
//  窗体模块
import windowModule from './windowServics'
import trayService from './tray'
import log from './logger'
import notification from './notification'
import setDefaultProtocol from './protocol/reg'
// import { updateHandle } from './update'
import { checkForUpdates } from './partUpdate'
export default {
    async init(app) {
        log()
        service()
        windowModule()
        electronStore(app)
        setting(app)
        trayService()
        events()
        notification()
        setDefaultProtocol()
        // updateHandle()
        checkForUpdates()
    }
}
