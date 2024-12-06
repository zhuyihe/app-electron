const remote = require('@electron/remote')

import ipcRenderers from './ipcRenderers'
export default {
    /* eslint no-param-reassign: "error" */
    install(Vue) {
        Vue.prototype.$electronStore = remote.getGlobal('$electronStore')
        Vue.prototype.$webContents = remote.getGlobal('webContents')
        Vue.prototype.$windows = remote.getGlobal('$windows')
        Vue.prototype.$isDevMode = remote.getGlobal('$isDevMode')
        Vue.prototype.$ipcRenderers = ipcRenderers
        Vue.prototype.$windowService = remote.getGlobal('$windowService')
    }
}
