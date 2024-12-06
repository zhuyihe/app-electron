import { ipcRenderer } from 'electron'
import { debounce } from 'loadsh'
const checkIoStutas = {
    created() {
        this.checkIoStutas()
        this.serveSend()
    },
    data() {
        return {
            statusList: []
        }
    },
    sockets: {
        serConnection(data) {
            console.log(data)
        }
    },
    methods: {
        serveSend() {
            this.$socket.emit('SendMessage', 'hello serve')
        },
        checkIoStutas() {
            ipcRenderer.send('checkIoStutas')
            ipcRenderer.on('checkIoStutas', (event, data) => {
                // console.log(event, data, 'qq')
                // this.ioStatus = data
                if (this.$route.path == '/') {
                    this.ioStatus = data
                } else {
                    debounce(() => {
                        this.canelConnect(data)
                    }, 1000)
                    // debounced(this.canelConnect(data), 100)
                    // this.statusList.push(data)
                    // if (data.type == 'disconnect') {
                    //     this.$message.error('与客户端失去链接,即将退出当前页面...')
                    //     setTimeout(() => {
                    //         this.$router.push('/')
                    //     }, 3000)
                    // }
                }
                console.log(data, this.$route.path)
            })
        },
        canelConnect(data) {
            if (data.type == 'disconnect') {
                this.$message.error('与客户端失去链接,即将退出当前页面...')
                setTimeout(() => {
                    this.$router.push('/')
                }, 3000)
            }
        }
    }
}

export default checkIoStutas
