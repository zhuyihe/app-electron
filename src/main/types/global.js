import { app } from 'electron'
import path from 'path'

global.isDevMode = process.env.NODE_ENV !== 'production'

global.rootPath = global.isDevMode ? __dirname : app.getPath('userData')
global.downloadPath = app.getPath('downloads')

global.isMac = process.platform == 'darwin'
global.isWindows = process.platform == 'win32'

let appTrayPath
let appLogoPath

if (global.isWindows) {
    appTrayPath = global.isDevMode ? path.join(process.cwd(), 'public', 'logo.png') : path.join(__dirname, 'logo.png')

    appLogoPath = global.isDevMode ? path.join(process.cwd(), 'public', 'logo.png') : path.join(__dirname, 'logo.png')
} else {
    appTrayPath = global.isDevMode ? path.join(process.cwd(), 'public', 'tray-darwin.png') : path.join(__dirname, 'tray-darwin.png')

    appLogoPath = global.isDevMode ? path.join(process.cwd(), 'public', 'app-darwin.png') : path.join(__dirname, 'app-darwin.png')
}

global.appTrayPath = appTrayPath
global.appLogoPath = appLogoPath
