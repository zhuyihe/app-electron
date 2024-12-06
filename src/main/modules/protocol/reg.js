// 注册自定义协议
const { app } = require('electron')
const path = require('path')

// 注册自定义协议
const setDefaultProtocol = () => {
    const agreement = 'GLPrinter' // 自定义协议名
    let isSet = false // 是否注册成功
    console.log(global.$electronStore.get('hasProtocol'), 'hasProtocol')
    if (!global.$electronStore.get('hasProtocol')) {
        app.removeAsDefaultProtocolClient(agreement) // 每次运行都删除自定义协议 然后再重新注册
        // 开发模式下在window运行需要做兼容
        if (process.env.NODE_ENV === 'development' && process.platform === 'win32') {
            // 设置electron.exe 和 app的路径
            isSet = app.setAsDefaultProtocolClient(agreement, process.execPath, [path.resolve(process.argv[1])])
        } else {
            isSet = app.setAsDefaultProtocolClient(agreement)
        }
        global.$electronStore.set('hasProtocol', isSet)
        global.$electronStore.set('agreement',agreement)
        console.log('是否注册成功', global.$electronStore.get('hasProtocol'), isSet)
    }
}

export default setDefaultProtocol
