<template>
  <div class="check-status-container">
    <!-- 状态卡片区域 -->
    <div class="status-cards">
      <!-- 版本信息卡片 -->
      <div class="status-card version-card">
        <div class="card-icon">
          <i class="el-icon-info"></i>
        </div>
        <div class="card-content">
          <div class="card-title">版本信息</div>
          <div class="version-info">
            <span class="version-number">{{ version }}</span>
          </div>
        </div>
      </div>

      <!-- 打印机状态卡片 -->
      <div class="status-card printer-card" :class="{ 'is-success': printerStutas.type }">
        <div class="card-icon">
          <i :class="printerStutas.type ? 'el-icon-success' : 'el-icon-error'"></i>
        </div>
        <div class="card-content">
          <div class="card-title">打印机状态</div>
          <div class="printer-status">{{ printerStutas.msg }}</div>
        </div>
      </div>
    </div>

    <!-- 更新对话框 -->
    <el-dialog
      :visible.sync="dartdialogVisible"
      width="480px"
      :show-close="false"
      :close-on-click-modal="false"
      custom-class="update-dialog"
    >
      <template slot="title">
        <div class="dialog-title">
          <i class="el-icon-news"></i>
          <span>{{ isPartUpdatte ? '正在更新' : '发现新版本' }}</span>
        </div>
      </template>
      <div v-if="!isPartUpdatte" class="update-content">
        <!-- 版本对比 -->
        <div class="version-compare">
          <div class="version-box current">
            <div class="version-label">当前版本</div>
            <div class="version-value">{{ version }}</div>
          </div>
          <div class="version-arrow">
            <i class="el-icon-arrow-right"></i>
          </div>
          <div class="version-box new">
            <div class="version-label">最新版本</div>
            <div class="version-value highlight">{{ updateVersion }}</div>
          </div>
        </div>

        <!-- 更新内容 -->
        <div class="update-notes">
          <div class="notes-title">更新内容：</div>
          <div class="notes-list">
            <div v-for="(note, index) in filteredReleaseNotes" 
                 :key="index" 
                 class="note-item">
              <i class="el-icon-check"></i>
              <span>{{ note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 更新进度 -->
      <div v-else class="progress-content">
        <div class="progress-icon">
          <i :class="[
            progressStatus === 'success' ? 'el-icon-success' : 'el-icon-loading',
            'status-icon'
          ]"></i>
        </div>
        <div class="progress-title">{{ progressStep }}</div>
        <div class="progress-text">{{ progressMessage }}</div>
        <el-progress 
          :percentage="updateProgress"
          :status="progressStatus"
          :stroke-width="8"
          class="update-progress"
        ></el-progress>
        <div class="progress-tip">{{ loadingText }}</div>
      </div>

      <div slot="footer" class="dialog-footer" v-if="!isPartUpdatte">
        <el-button @click="dartdialogVisible = false">稍后更新</el-button>
        <el-button type="primary" @click="confirmpartUpdate">立即更新</el-button>
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
        type: false,
      },
    };
  },

  computed: {
    filteredReleaseNotes() {
      return this.releaseNotes.filter(note => note);
    },
    progressStatus() {
      return this.updateProgress >= 100 ? "success" : "warning";
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
            msg: "打印服务异常,请检查打印机是否可用",
            type: false,
          };
        } else {
          this.printerStutas = {
            msg: "打印功能准备就绪",
            type: true,
          };
        }
    },

    // 组件销毁前移除监听器
    beforeDestroy() {
      ipcRenderer.removeAllListeners('UpdatePartMsg');
      ipcRenderer.removeAllListeners('InstallProgress');
    }
  },
};
</script>

<style lang="scss">
.check-status-container {
  padding: 24px;
  min-height: 95vh;
  background: #f5f7fa;
  padding-bottom:0 ;

  .status-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .status-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #ecf5ff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        i {
          font-size: 24px;
          color: #409eff;
        }
      }

      .card-content {
        flex: 1;

        .card-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .version-info, .printer-status {
          font-size: 16px;
          color: #303133;
          font-weight: 500;
        }
      }

      &.printer-card {
        &.is-success {
          .card-icon {
            background: #f0f9eb;
            i {
              color: #67c23a;
            }
          }
        }

        &:not(.is-success) {
          .card-icon {
            background: #fef0f0;
            i {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
}

.update-dialog {
  .el-dialog__footer{
    padding: 5px 20px 5px;
  }
  .el-dialog__header {
    padding: 10px;
    border-bottom: 1px solid #ebeef5;
    margin: 0;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .el-dialog__body {
    padding: 15px;
    padding-bottom: 0;
  }

  .update-content {
    .version-compare {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      padding: 8px;
      background: #f5f7fa;
      border-radius: 8px;

      .version-box {
        text-align: center;
        flex: 1;

        .version-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 4px;
        }

        .version-value {
          font-size: 18px;
          font-weight: 500;
          color: #303133;

          &.highlight {
            color: #409eff;
          }
        }
      }

      .version-arrow {
        padding: 0 15px;
        color: #909399;
        font-size: 20px;
      }
    }

    .update-notes {
      .notes-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 10px;
        font-weight: 500;
      }

      .notes-list {
        max-height: 182px;
        min-height:100px;
        overflow-y: auto;
        padding-right: 5px;

        &::-webkit-scrollbar {
          width: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c0c4cc;
          border-radius: 2px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f7fa;
        }

        .note-item {
          display: flex;
          align-items: flex-start;
          padding: 4px 0;
          font-size: 13px;
          color: #606266;

          i {
            color: #67c23a;
            margin-right: 6px;
            margin-top: 2px;
          }
        }
      }
    }
  }

  .progress-content {
    padding: 10px 0;
    text-align: center;

    .progress-icon {
      font-size: 40px;
      margin-bottom: 10px;
      color: #409eff;
    }

    .progress-title {
      font-size: 16px;
      color: #303133;
      margin-bottom: 15px;
    }

    .progress-text {
      font-size: 13px;
      color: #909399;
      margin: 8px 0;
    }

    .el-progress {
      .el-progress-bar__outer {
        background-color: #ebeef5;
        border-radius: 100px;
      }

      .el-progress-bar__inner {
        border-radius: 100px;
        background-color: #409eff;
        transition: width 0.3s ease;
      }

      .el-progress__text {
        font-size: 13px !important;
        color: #606266;
      }
    }

    .progress-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 8px;
      font-style: italic;
    }
  }

  .dialog-footer {
    padding: 10px 0 5px;
    border-top: 1px solid #ebeef5;
    text-align: right;

    .el-button {
      padding: 8px 15px;
      font-size: 13px;
    }
  }

  .dialog-title {
    display: flex;
    align-items: center;

    i {
      font-size: 18px;
      margin-right: 8px;
      color: #409eff;
    }

    span {
      font-size: 16px;
      font-weight: 500;
    }
  }
}
</style>