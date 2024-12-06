const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8082 })

const soket = {
    start: ipcMain => {
        wss.on('connection', ws => {
            ws.on('message', message => {
                console.log('received: %s', message)
                // win.webContents.send('mainMsg', '我是主线程发送的消息')
                ipcMain.on('message', (event, arg) => {
                    console.log(arg) // prints "ping"
                    event.sender.send('asynchronous-reply', 'pong')
                })
            })

            ws.send('something')
        })
    }
}

export default soket
