<template>
    <div
      class="connectToweb"
      v-loading="isUpdatte || isPartUpdatte"
      :element-loading-text="loadingText"
      element-loading-spinner="el-icon-loading"
    >
      <!-- 版本信息 -->
      <div class="version-info">
        <span class="version-label">当前版本：</span>
        <span class="version-number">{{ version }}</span>
        <!-- <el-button type="text" class="check-update-btn" @click="checkDartUpdate">
          检查更新
        </el-button> -->
      </div>
  
      <!-- 打印机状态 -->
      <div class="status-card">
        <div class="status-content">
          <span class="status-text">{{ printerStutas.msg }}</span>
          <div class="status-icon">
            <svg
              class="icon"
              aria-hidden="true"
              :class="{ success: printerStutas.type }"
            >
              <use
                :xlink:href="
                  printerStutas.type ? '#icon-chenggong' : '#icon-shibai'
                "
              />
            </svg>
          </div>
        </div>
      </div>
  
      <!-- 更新对话框 -->
      <el-dialog
        title="更新提示"
        :visible.sync="dartdialogVisible"
        width="460px"
        :show-close="false"
        :close-on-click-modal="false"
        custom-class="updateDialog"
      >
        <div v-if="!isPartUpdatte" class="update-content">
          <div class="update-header">
            <i class="el-icon-warning-outline warning-icon"></i>
            <span class="update-title">检测到新版本，是否更新？</span>
          </div>
          
          <div class="update-info">
            <div class="version-compare">
              <div class="current-version">
                <span class="label">当前版本</span>
                <span class="version">{{ version }}</span>
              </div>
              <i class="el-icon-right arrow"></i>
              <div class="new-version">
                <span class="label">最新版本</span>
                <span class="version">{{ updateVersion || '1.0.2' }}</span>
              </div>
            </div>
            
            <div class="update-notes">
              <div class="notes-title">更新内容：</div>
              <div class="notes-list">
                <div v-for="(item, key) in filteredReleaseNotes" 
                     :key="key" 
                     class="note-item">
                  <i class="el-icon-check"></i>
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 更新进度 -->
        <div v-else class="update-progress">
          <el-progress 
            :percentage="updateProgress"
            :status="progressStatus"
            :stroke-width="8"
          ></el-progress>
          <p class="progress-text">{{ progressMessage }}</p>
        </div>
  
        <div slot="footer" class="dialog-footer" v-if="!isPartUpdatte">
          <el-button @click="dartdialogVisible = false" size="small">稍后更新</el-button>
          <el-button type="primary" @click="confirmpartUpdate" size="small">立即更新</el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ipcRenderer } from "electron";
  const remote = require("@electron/remote");
  
  export default {
    name: "CheckStatus",
  
    data() {
      return {
        version: "", // 当前版本号
        updateVersion: "", // 新版本号
        isUpdatte: false, // 是否正在更新
        isPartUpdatte: false, // 是否正在增量更新
        loadingText: "", // 加载提示文本
        dartdialogVisible: false, // 更新对话框显示状态
        releaseNotes: [], // 更新日志
        updateProgress: 0, // 更新进度
        progressStep: "", // 当前步骤
        progressMessage: "", // 进度消息
        printerStutas: {
          msg: "打印功能准备就绪",
          type: true,
        },
      };
    },
  
    computed: {
      filteredReleaseNotes() {
        return this.releaseNotes.filter((note) => note);
      },
      progressStatus() {
        return this.updateProgress >= 100 ? "success" : "";
      },
    },
  
    created() {
      this.init();
    },
  
    mounted() {
      // 获取当前版本
      this.version = remote.app.getVersion();
    },
  
    methods: {
      init() {
        // 监听增量更新消息
        this.linstenerDartUpdate();
        // 检查打印机状态
        this.getPrintListHandle();
      },
  
      // 监听增量更新消息
      linstenerDartUpdate() {
        // 获取现有的监听器数量
        const updateListeners = ipcRenderer.listenerCount('UpdatePartMsg');
        const progressListeners = ipcRenderer.listenerCount('InstallProgress');
          console.log(updateListeners,progressListeners,'progressListeners')
        // 只有在没有监听器时才添加
        if (updateListeners === 0) {
          ipcRenderer.on('UpdatePartMsg', (event, arg) => {
            console.log('收到更新消息:', arg);
            const { flag, releaseNotes, updateVersion } = arg;
            if (flag) {
              this.dartdialogVisible = true;
              this.releaseNotes = releaseNotes ? releaseNotes.split('\r\n') : [];
              this.updateVersion = updateVersion;
              // 重置进度
              this.updateProgress = 0;
              this.progressStep = '';
              this.progressMessage = '';
            }
          });
        }
  
        if (progressListeners === 0) {
          ipcRenderer.on('InstallProgress', (event, data) => {
            this.isPartUpdatte = true;
            this.updateProgress = data.progress || 0;
            this.progressStep = data.step || '';
            this.progressMessage = data.message || '';
            this.loadingText = `${data.step}\n${data.message}`;
          });
        }
      },
  
      // 手动检查更新
      checkDartUpdate() {
        const { flag, releaseNotes, version } = ipcRenderer.sendSync("exist_update");
        console.log("检查更新结果:", { flag, releaseNotes, version });
        if (flag) {
          this.dartdialogVisible = true;
          this.releaseNotes = releaseNotes.split("\r\n");
          this.updateVersion = version;
        } else {
          this.$message.info("当前已是最新版本");
        }
      },
  
      // 确认更新
      confirmpartUpdate() {
        this.isPartUpdatte = true;
        // 对话框保持打开状态，显示进度
        this.updateProgress = 0;
        this.progressStep = "准备更新";
        this.progressMessage = "正在准备安装更新...";
        this.loadingText = "正在准备更新安装...";
        ipcRenderer.send("Sure");
      },
  
      // 获取打印机列表状态
      getPrintListHandle() {
        const data = this.$electronStore.get("printerList");
        // 过滤可用打印机
        const availablePrinters = data
          ? data.filter((element) => element.status === 0)
          : [];
  
        if (availablePrinters.length <= 0) {
          this.printerStutas = {
            msg: "打印服务异常,请尝试重启电脑",
            type: false,
          };
        } else {
          this.printerStutas = {
            msg: "打印功能准备就绪",
            type: true,
          };
          this.$electronStore.set("printList", availablePrinters);
        }
      },
    },
  
    beforeDestroy() {
       // 清理事件监听
      ipcRenderer.removeAllListeners("UpdatePartMsg");
      ipcRenderer.removeAllListeners("InstallProgress");
    },
  };
  </script>
  
  <style lang="scss">
  .connectToweb {
    width: 100%;
    height: calc(100vh - 58px);
    //   padding: 20px;
    padding-top: 10px;
    background-color: #f5f7fa;
  
    .version-info {
      margin-bottom: 20px;
      height: 60px;
      line-height: 60px;
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
      display: flex;
      background-color: #fff;
      align-items: center;
      width: 90%;
      margin: 20px auto;
      padding:0 20px;  
      .version-label {
        color: #606266;
      }
  
      .version-number {
        font-weight: bold;
        color: #303133;
        margin-right: 20px;
      }
  
      .check-update-btn {
        margin-left: auto;
      }
    }
  
    .status-card {
      background: #fff;
      border-radius: 8px;
      padding:0 20px;  
      height: 60px;
      line-height: 60px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
      width:90%;
      margin:auto;
      margin-top:0;
      .status-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
  
      .status-text {
        font-size: 16px;
        color: #303133;
      }
  
      .status-icon {
        .icon {
          width: 24px;
          height: 24px;
          transition: all 0.3s;
          color: #f56c6c;
  
          &.success {
            color: #67c23a;
          }
        }
      }
    }
  }
  
  .updateDialog {
    .el-dialog__header {
      padding: 10px 24px;
      border-bottom: 1px solid #ebeef5;
      margin: 0;
      
      .el-dialog__title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
  
    .el-dialog__body {
      padding:10px 24px;
      max-height: 60vh;
    }
    .el-dialog__footer{
      padding-bottom:10px;   
      padding-top:0;   
    }
    .update-content {
      max-height: calc(74vh - 120px);
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: #909399;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-track {
        background-color: #f5f7fa;
      }
  
      .update-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
  
        .warning-icon {
          font-size: 22px;
          color: #e6a23c;
          margin-right: 12px;
        }
  
        .update-title {
          font-size: 15px;
          color: #303133;
          font-weight: 500;
        }
      }
  
      .update-info {
        .version-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          background: #f5f7fa;
          padding:8px 16px;
          border-radius: 8px;
  
          .current-version, .new-version {
            text-align: center;
            
            .label {
              display: block;
              font-size: 13px;
              color: #909399;
              margin-bottom: 4px;
            }
            
            .version {
              font-size: 15px;
              color: #303133;
              font-weight: 500;
            }
          }
  
          .arrow {
            margin: 0 20px;
            color: #909399;
            font-size: 20px;
          }
        }
  
        .update-notes {
          .notes-title {
            font-size: 14px;
            color: #606266;
            margin-bottom: 8px;
          }
  
          .notes-list {
            max-height: 300px;
            overflow-y: auto;
            background: #f5f7fa;
            border-radius: 8px;
            padding: 12px 16px;
  
            &::-webkit-scrollbar {
              width: 4px;
            }
            
            &::-webkit-scrollbar-thumb {
              background-color: #909399;
              border-radius: 2px;
            }
            
            &::-webkit-scrollbar-track {
              background-color: transparent;
            }
  
            .note-item {
              display: flex;
              align-items: flex-start;
              margin-bottom: 8px;
              font-size: 13px;
              color: #606266;
              line-height: 1.5;
  
              &:last-child {
                margin-bottom: 0;
              }
  
              i {
                color: #67c23a;
                margin-right: 8px;
                margin-top: 3px;
                flex-shrink: 0;
              }
  
              span {
                word-break: break-all;
              }
            }
          }
        }
      }
    }
  
    .update-progress {
      padding: 20px 0;
      text-align: center;
  
      .el-progress {
        margin-bottom: 16px;
      }
  
      .progress-text {
        color: #606266;
        font-size: 14px;
        margin: 0;
      }
    }
  
    .dialog-footer {
      padding: 16px 0;
      border-top: 1px solid #ebeef5;
      text-align: right;
      padding-bottom:0;
    }
  }
  </style>