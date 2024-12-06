<template>
    <div class="printEmr">
        <!-- <el-button type="primy" @click="back">返回</el-button> -->
        <webview id="printWebview" ref="printWebview" :src="fullPath" nodeintegration webpreferences="contextIsolation=no" />
        <div class="printP">
            <div class="printCon"><div v-html="html"></div></div>
            <printerConfig @sure="printEmr" @back="back" ref="cc"></printerConfig>
        </div>
        <!-- printEmr -->
    </div>
</template>

<script>
const path = require('path')
import printerConfig from '@/components/printerConfig.vue'
// import checkIoStutas from '@/mixins/checkIoStutas'
export default {
    name: 'printEmr',
    data() {
        return {
            fullPath: path.join(__static, 'print.html'),
            html: '',
            printInfo: {},
            printerList: [],
            key: ''
        }
    },
    // mixins: [checkIoStutas],
    components: {
        printerConfig
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            const emrConfig = this.$electronStore.get('emrConfig')
            this.printerList = this.$electronStore.get('printList')
            this.html = emrConfig.FileStream
            const webview = this.$refs.printWebview
            webview.addEventListener('dom-ready', () => {
                // const printer = this.printerList.find(device => device.displayName === machine)
                // this.printEmr(this.$refs['cc'].printInfo)
                // console.log(this.$isDevMode, '$isDevMode')
                // webview.openDevTools() //webview加载完成，可以处理一些事件了
                // console.log('dom-ready')
                // webview.send('ping') //向webview嵌套的页面响应事件
            })
            webview.addEventListener('ipc-message', event => {
                if (event.channel === 'webview-print-do') {
                    const json = {
                        silent: true,
                        printBackground: false,
                        deviceName: 'Microsoft Print to PDF' // 打印机对象的name
                        // copies: 1
                    }
                    console.log(json, 'printInfo')
                    // let a = JSON.parse(JSON.stringify(json))
                    webview
                        .print(json)
                        .then(() => {
                            // this.messageBox.close()
                            console.log('print success')
                            // this.$message({
                            //     message: '打印成功,跳转首页...',
                            //     type: 'success',
                            //     duration: 5000
                            // })
                            // setTimeout(() => {
                            //     this.back()
                            // }, 5000)
                        })
                        .catch(err => {
                            console.log(err)
                        })
                } else {
                    console.log(event.channel)
                }
            })
            this.changeEmrContent()
        },
        back() {
            this.$router.push('/')
        },
        // 2.判断打印机状态
        checkPrinter(machine) {
            // 本地获取打印机
            const printer = this.printerList.find(device => device.displayName === machine)
            console.log(printer, this.printerList, 'printer')
            // 有打印机设备并且状态正常直接打印
            if (printer && printer.status === 0) {
                this.printRender(machine)
            } else if (machine === '') {
                this.$message({
                    message: '请先设置其他打印机',
                    type: 'error',
                    duration: 1000
                })
            } else {
                this.$message({
                    message: '当前打印机不可用,请重新设置',
                    type: 'error'
                })
            }
        },
        printEmr(printInfo) {
            const { machine } = printInfo
            console.log(printInfo, 'printInfo')
            this.printInfo = printInfo
            this.checkPrinter(machine)
        },
        printRender(machine) {
            console.log(this.fullPath, 'dddd')
            // this.messageBox = this.$message({
            //     message: '打印中，请稍后',
            //     duration: 0
            // })
            // 获取<webview>节点
            const webview = this.$refs.printWebview
            // 发送信息到<webview>里的页面
            webview.send('webview-print-render', {
                content: this.html,
                parent: 'webview'
            })
        },
        async changeEmrContent() {
            this.$ipcRenderers.printHtml.get('on', (event, data) => {
                if (data) {
                    let emrContents = this.$electronStore.get('emrContents')
                    if (emrContents && emrContents !== this.html) {
                        this.html = emrContents
                    } else {
                        this.$message.warning('内容未改变')
                    }
                }
            })
        }
    },
    destroyed() {
        this.$ipcRenderers.printHtml.remove()
    }
}
</script>

<style lang="scss" scoped>
#printWebview {
    position: fixed;
    right: -500px;
}
.printEmr {
    // padding-top: 20px;
    .printP {
        display: flex;
        font-family: 'SimSun';
        // padding-top: 20px;

        .printCon {
            margin-top: 20px;
            flex: 1;
            height: calc(100vh - 40px);
            overflow: auto;
        }
    }
}
</style>
