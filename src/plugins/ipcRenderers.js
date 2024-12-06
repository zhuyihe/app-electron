import { ipcRenderer } from 'electron'

const ipcRenderers = {
    printHtml: {
        async get(type, callback) {
            await ipcRenderer[type]('printHtml', (event, arg) => {
                console.log(arg, 'arg')
                return callback(event, arg)
            })
        },
        remove() {
            ipcRenderer.removeAllListeners('printHtml')
        }
    },
    printPdf: {
        async get(type, callback) {
            await ipcRenderer[type]('printPdf', (event, arg) => {
                console.log(arg, 'arg')
                return callback(event, arg)
            })
        },
        remove() {
            ipcRenderer.removeAllListeners('printPdf')
        }
    },
    update: {
        async get(type, callback) {
            await ipcRenderer[type]('update', (event, arg) => {
                return callback(event, arg)
            })
        },
        remove() {
            ipcRenderer.removeAllListeners('update')
        }
    },
    checkForUpdate: {
        async get(type, callback) {
            await ipcRenderer[type]('checkForUpdate', (event, arg) => {
                return callback(event, arg)
            })
        },
        remove() {
            ipcRenderer.removeAllListeners('checkForUpdate')
        }
    }
}

export default ipcRenderers
