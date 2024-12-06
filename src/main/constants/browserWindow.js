const path = require('path')

const commonOptions = {
    width: 900,
    height: 500,
    id: 1,
    // autoHideMenuBar: true,
    show: false,
    webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        enableRemoteModule: true, // 启用remote
        nodeIntegration: true,
        nodeIntegrationInSubFrames: true,
        webviewTag: true,
        contextIsolation: false,
        preload: path.join(__dirname, './preload.js')
    }
}

const browserWindowOptions = {
    main: {
        minWidth: 750,
        minHeight: 600,
        ...commonOptions
    }
}
/**
 * 开发环境: http://localhost:8384
 * 正式环境: file://${__dirname}/index.html
 */
const winURL = global.isDevMode ? 'http://localhost:8384' : `app://./index.html`
export { browserWindowOptions, winURL }
