const storage = require('electron-store')

const electronStore = app => {
    const store = new storage({
        // defaults: defaultData,
        cwd: app.getPath('userData')
    })
    console.log(app.getPath('userData'), 'userData')
    global.$electronStore = store
    return store
}

export default electronStore
