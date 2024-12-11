<template>
    <div
        class="connectToweb"
        v-loading="isUpdatte || isPartUpdatte"
        :element-loading-text="loadingText"
        element-loading-spinner="el-icon-loading"
    >
        当前版本：{{ version }}
        <div class="tip">
            <div>{{ printerStutas.msg }}</div>
            <div>
                <svg class="icon" aria-hidden="true" v-if="!printerStutas.type">
                    <use xlink:href="#icon-shibai" />
                </svg>
                <svg class="icon" aria-hidden="true" v-else>
                    <use xlink:href="#icon-chenggong" />
                </svg>
            </div>
        </div>
        <!-- <el-button type="primay" @click="checkDartUpdate">点击更新</el-button> -->
        <el-dialog
            title="更新提示"
            :visible.sync="dialogVisible"
            width="500px"
            :show-close="false"
            :close-on-click-modal="false"
            custom-class="updateDialog"
        >
            <div v-if="!isUpdatte">
                <span style="font-weight: bold" class="spanicon"><i class="el-icon-warning warning"></i>检测到新版本，是否更新？</span>
                <el-scrollbar style="height: 100%">
                    <div class="releaseNotes" v-if="releaseNotes.length">
                        <div v-for="(item, key) in releaseNotes" :key="key" class="releaseNotesItem">
                            <span v-if="item">{{ key + 1 }}、{{ item }}</span>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
            <span slot="footer" class="dialog-footer" v-if="!isUpdatte">
                <el-button @click="dialogVisible = false">稍后</el-button>
                <el-button type="primary" @click="confirmUpdate">确 定</el-button>
            </span>
        </el-dialog>
        <el-dialog
            title="更新提示"
            :visible.sync="dartdialogVisible"
            width="500px"
            :show-close="false"
            :close-on-click-modal="false"
            custom-class="updateDialog"
        >
            <div v-if="!isPartUpdatte">
                <span style="font-weight: bold" class="spanicon"><i class="el-icon-warning warning"></i>检测到新版本，是否更新？</span>
                <el-scrollbar style="height: 100%">
                    <div class="releaseNotes" v-if="releaseNotes.length">
                        <div v-for="(item, key) in releaseNotes" :key="key" class="releaseNotesItem">
                            <span v-if="item">{{ key + 1 }}、{{ item }}</span>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
            <span slot="footer" class="dialog-footer" v-if="!isPartUpdatte">
                <el-button @click="dartdialogVisible = false">稍后</el-button>
                <el-button type="primary" @click="confirmpartUpdate">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
// import checkIoStutas from '@/mixins/checkIoStutas'
// const  = require('node-native-printer')
// import printer from 'node-native-printer'
const remote = require('@electron/remote');
import { ipcRenderer } from 'electron';

export default {
    name: 'connectToweb',
    data() {
        return {
            ioStatus: {
                msg: '请与客户端链接',
                type: 'disconnect'
            },
            printerStutas: {
                msg: '打印功能准备就绪',
                type: true
            },
            printList: [],
            isUpdatte: false,
            loadingText: '加载中...',
            percent: 0,
            dialogVisible: false,
            colors: [
                { color: '#f56c6c', percentage: 20 },
                { color: '#e6a23c', percentage: 40 },
                { color: '#6f7ad3', percentage: 60 },
                { color: '#1989fa', percentage: 80 },
                { color: '#5cb87a', percentage: 100 }
            ],
            releaseNotes: [],
            dartdialogVisible: false,
            isPartUpdatte: false,
            version: ''
            // tip: '请与客户端链接'
        };
    },
    computed: {
        customStatus() {
            console.log(this.percent);
            if (this.percent == 100) {
                return 'success';
            } else {
                return 'exception';
            }
        }
    },
    // mixins: [checkIoStutas],
    created() {
        // this.update()
        this.init();
        
    },
    mounted() {
        this.version = remote.app.getVersion();
        //增量更新
        // this.checkDartUpdate()
        console.log(remote.app.getVersion(),ipcRenderer, 'aaa');
       
        // this.init()
    },
    methods: {
        async init() {
            // await this.linstenerIo()
            // this.linstenerPrinter()
            // this.togoPrint()
            //全量更新
            // this.linstenerUpdate()
            // console.log(printer.defaultPrinterName(), 'printer')
            this.linstenerDartUpdate();
        },
        linstenerDartUpdate() {
            
            console.log( ipcRenderer.on,' ipcRenderer.on')
            ipcRenderer.on('UpdatePartMsg', (event, arg) => {
                console.log(arg, 'arg');
                let { flag, releaseNotes, updateVersion } = arg;
                if (flag) {
                    console.log(flag, releaseNotes, updateVersion);
                    // this.isUpdatte = true
                    this.dartdialogVisible = true;
                    this.releaseNotes = releaseNotes.split('\r\n');
                }
            });
        },
        //增量更新
        checkDartUpdate() {
            let { flag, releaseNotes, updateVersion } = ipcRenderer.sendSync('exist_update');
            console.log({ flag, releaseNotes, updateVersion }, 'checkDartUpdate');
            if (flag) {
                // this.isUpdatte = true
                this.dartdialogVisible = true;
                this.releaseNotes = releaseNotes.split('\r\n');
            }
        },
        confirmpartUpdate() {
            this.isPartUpdatte = true;
            this.dartdialogVisible = false;
            this.loadingText = '正在安装更新，请稍等...';
            ipcRenderer.send('Sure');
            // ipcRenderer.invoke('new_update').then(res => {
            //     ipcRenderer.send('Sure')
            // })
        },
        update() {
            ipcRenderer.send('check-update');
        },
        confirmUpdate() {
            this.isUpdatte = true;
            this.dialogVisible = false;
            ipcRenderer.send('confirm-downloadUpdate');
        },
        linstenerUpdate() {
            let _this = this;
            //接收主进程版本更新消息
            ipcRenderer.on('UpdateMsg', (event, arg) => {
                console.log(arg, 'arg');

                let percentage = 0;
                switch (arg.state) {
                    case 1:
                        _this.releaseNotes = arg.msg ? arg.msg.split('\r\n') : [];
                        _this.dialogVisible = true;
                        _this.$windows.show();
                        // ipcRenderer.send('confirm-downloadUpdate')
                        break;
                    case 3:
                        percentage = Math.floor(arg.msg.percent);
                        _this.loadingText = `拼命下载中${percentage}%,请勿退出！`;
                        break;
                    case 4:
                        _this.progressStaus = 'success';
                        _this.loadingText = '下载完成,开始安装...';
                        ipcRenderer.send('confirm-update');
                        break;
                }
                // for (var i = 0; i < arg.length; i++) {
                // console.log(arg)
                // if ('update-available' == arg.cmd) {
                //     //显示升级对话框
                //     _this.dialogVisible = true
                // } else if ('download-progress' == arg.cmd) {
                //     //更新升级进度
                //     /**
                //          *
                //          * message{bytesPerSecond: 47673
                //          delta: 48960
                //         percent: 0.11438799862426002
                //         total: 42801693
                //         transferred: 48960
                //         }
                //         */
                //     console.log(arg.message.percent)
                //     let percent = Math.round(parseFloat(arg.message.percent))
                //     _this.percentage = percent
                // } else if ('error' == arg.cmd) {
                //     _this.dialogVisible = false
                //     _this.$message('更新失败')
                // }
                // }
            });
        },
        // linstenerIo() {
        //     ipcRenderer.send('checkIoStutas')
        //     ipcRenderer.on('checkIoStutas', (event, data) => {
        //         // console.log(event, data, 'qq')
        //         this.ioStatus = data
        //     })
        // },
        linstenerPrinter() {
            this.getPrintListHandle();
        },
        // 获取打印机列表
        getPrintListHandle() {
            // // 改用ipc异步方式获取列表，解决打印列数量多的时候导致卡死的问题
            // ipcRenderer.send('getPrinterList')
            // ipcRenderer.once('getPrinterList', (event, data) => {
            const data = this.$electronStore.get('printerList');
            // 过滤可用打印机
            this.printList = data.filter(element => element.status === 0);
            console.log(this.printList, 'this.printList');
            // 1.判断是否有打印服务
            if (this.printList.length <= 0) {
                this.printerStutas = {
                    msg: '打印服务异常,请尝试重启电脑',
                    type: false
                };
            } else {
                this.printerStutas = {
                    msg: '打印功能准备就绪',
                    type: true
                };
                // console.log(data, 'ccc')
                // this.checkPrinter()
                this.$electronStore.set('printList', this.printList);
            }
            // })
        },
        async togoPrint() {
            this.$ipcRenderers.printHtml.get('on', (event, data) => {
                if (data) this.checkStatus();
            });
            this.$ipcRenderers.printPdf.get('on', (event, data) => {
                console.log(data, 'qqq');
                if (data) this.checkStatus(data);
            });
        },

        checkStatus(data) {
            if (this.printerStutas.type) {
                this.$windows.show();
                console.log(this.$windows, data, ' this.$window');
                if (!data) {
                    this.$router.push('printEmr');
                } else {
                    this.$router.push('printPdf');
                    // console.log(data.url, 'data.url')
                    // window.open(data.url)
                    // this.$windows.loadURL(data.url)
                }
            }
        }
    }
};
</script>

<style lang="scss">
.connectToweb {
    width: 100%;
    height: calc(100vh - 48px);
    .tip {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        .icon {
            width: 30px;
            height: 30px;
            margin-left: 10px;
        }
        line-height: 16px;
        margin-top: 30px;
    }
}
.updateDialog {
    .warning {
        color: #e6a23c;
        font-size: 20px;
        margin-right: 10px;
    }
}
.spanicon {
    font-size: 18px;
}
.releaseNotes {
    max-height: 150px;
    margin-top: 10px;
    // overflow: auto;
    .releaseNotesItem {
        // line-height: 24px;
        padding-left: 10px;
        margin: 10px;
        font-size: 16px;
    }
}
</style>
