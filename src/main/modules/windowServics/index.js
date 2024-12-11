import { BrowserWindow } from "electron";
import { browserWindowOptions, winURL } from "@/main/constants/browserWindow";

/**
 * 窗口服务
 * @returns {WindowService}
 */
const WindowService = () => {
  return {
    mainWindow: null,
    viewWins: new Map(), // 使用 Map 替代普通对象
    winItems: new Map(), // 使用 Map 替代普通对象

    /**
     * 创建浏览器窗口
     * @param {Object} params
     * @param {Object} params.option - 窗口配置选项
     * @param {string} params.url - 窗口URL
     * @returns {BrowserWindow}
     */
    /**
     * 创建浏览器窗口
     */
    createBrowserWindow({ option, url }) {
      try {
        const win = new BrowserWindow(option);
        win.setIcon(global.appLogoPath);

        // 修改这里：改进窗口关闭事件处理
        win.on("closed", () => {
          if (!win.isDestroyed()) {
            const windowId = win.id;
            this.deleteWindow(windowId);
          }
        });

        return win;
      } catch (error) {
        console.error("创建窗口失败:", error);
        throw error;
      }
    },

    /**
     * 创建主窗口
     * @returns {BrowserWindow}
     */
    createMainWin() {
      try {
        const option = browserWindowOptions.main;
        const url = this.getWebUrl();
        const mainWindow = this.createBrowserWindow({ option, url });

        require("@electron/remote/main").enable(mainWindow.webContents);
        require("@electron/remote/main").initialize();

        if (global.isDevMode) {
          mainWindow.webContents.openDevTools(true);
        }

        this.mainWindow = mainWindow;
        return this.mainWindow;
      } catch (error) {
        console.error("创建主窗口失败:", error);
        throw error;
      }
    },

    /**
     * 添加窗口项
     * @param {number} winId - 窗口ID
     * @param {BrowserWindow} win - 窗口实例
     */
    addWinItem(winId, win) {
      if (!winId || !win) {
        throw new Error("无效的窗口ID或窗口实例");
      }
      this.winItems.set(winId, win);
    },

    /**
     * 删除窗口
     */
    deleteWindow(winId) {
      try {
        if (this.winItems.has(winId)) {
          const win = this.winItems.get(winId);
          // 添加这里：移除所有事件监听器
          if (win && !win.isDestroyed()) {
            win.removeAllListeners();
          }
          this.winItems.delete(winId);
        }
      } catch (error) {
        console.error("删除窗口失败:", error);
      }
    },

    /**
     * 关闭窗口
     * @param {number} windowId - 窗口ID
     */
    closeWindow(windowId) {
      try {
        const win = this.winItems.get(windowId);
        if (!win) {
          console.warn(`窗口 ${windowId} 不存在`);
          return;
        }

        if (!win.isDestroyed()) {
          // 添加这里：移除所有事件监听器
          win.removeAllListeners();
          // 修改这里：使用 destroy 替代 close
          win.destroy();
        }
        this.deleteWindow(windowId);
      } catch (error) {
        console.error("关闭窗口失败:", error);
        throw error;
      }
    },

    /**
     * 获取web地址
     * @param routerPath
     * @returns
     */
    getWebUrl(routerPath = "") {
      return `${winURL}/#/${routerPath}`;
    },

    /**
     * 获取窗口实例
     * @param {number} windowId - 窗口ID
     * @returns {BrowserWindow|null}
     */
    getWindowById(windowId) {
      if (windowId === 1) {
        return this.mainWindow;
      }
      return this.winItems.get(windowId) || null;
    },
    closeAllWindows() {
      try {
        const windowIds = Array.from(this.winItems.keys());
        windowIds.forEach((windowId) => { 
          this.closeWindow(windowId);
        });
        this.winItems.clear();
        this.viewWins.clear();
        this.mainWindow = null;
      } catch (error) {
        console.error("关闭所有窗口失败:", error);
      }
    },
  };
};

// 创建单例
if (!global.$windowService) {
  global.$windowService = WindowService();
}

export default WindowService;
