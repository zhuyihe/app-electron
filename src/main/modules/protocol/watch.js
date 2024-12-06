// 注册自定义协议
const { dialog } = require('electron')
const agreement = 'GLPrinter' // 自定义协议名
// 验证是否为自定义协议的链接
const AGREEMENT_REGEXP = new RegExp(`^${agreement}://`)

// 监听自定义协议唤起
const watchProtocol = url => {
    // mac唤醒应用 会激活open-url事件 在open-url中判断是否为自定义协议打开事件
    const isProtocol = AGREEMENT_REGEXP.test(url)
    if (isProtocol) {
        console.log('获取协议链接, 根据参数做各种事情')
        dialog.showMessageBox({
            type: 'info',
            message: 'Mac protocol 自定义协议打开',
            detail: `自定义协议链接:${url}`
        })
    }
    // app.on('open-url', (event, url) => {
    //     const isProtocol = AGREEMENT_REGEXP.test(url)
    //     if (isProtocol) {
    //         console.log('获取协议链接, 根据参数做各种事情')
    //         dialog.showMessageBox({
    //             type: 'info',
    //             message: 'Mac protocol 自定义协议打开',
    //             detail: `自定义协议链接:${url}`
    //         })
    //     }
    // })
    // window系统下唤醒应用会激活second-instance事件 它在ready执行之后才能被监听
    // app.on('second-instance', (event, commandLine) => {
    //     // commandLine 是一个数组， 唤醒的链接作为数组的一个元素放在这里面
    //     commandLine.forEach(str => {
    //         if (AGREEMENT_REGEXP.test(str)) {
    //             console.log('获取协议链接, 根据参数做各种事情')
    //             dialog.showMessageBox({
    //                 type: 'info',
    //                 message: 'window protocol 自定义协议打开',
    //                 detail: `自定义协议链接:${str}`
    //             })
    //         }
    //     })
    // })
}

// 在ready事件回调中监听自定义协议唤起
console.log('监听成功')
export default watchProtocol
