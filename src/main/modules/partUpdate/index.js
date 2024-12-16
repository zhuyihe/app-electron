import { app, ipcMain } from "electron";
import { readConfig } from "@/main/utils/getConfig.js";
import axios from "axios";
import https from 'https';
const admZip = require("adm-zip");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const crypto=require('crypto')
import { checkDirectoryPermissions, executePermissionScript } from "@/main/utils/checkPermissions.js";
// 创建更新模块的日志记录器
const updateLog = global.logs('app_update');

// 修改基础配置
const baseUrl = app.getPath('userData') + "/"; // 使用 electron 的用户数据目录
console.log(baseUrl,'baseUrl')
const tempDir = path.join(baseUrl, 'temp/');   // 临时下载目录
const backupDir = path.join(baseUrl, 'backup/'); // 备份目录
const installDir = path.resolve("./")
updateLog.info(`==================更新日志开始${new Date().toLocaleString()}================`);
// 确保必要的目录存在
const initDirs = () => {
  try {
    [tempDir, backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }); // 添加 recursive 选项
      }
    });
    updateLog.info('目录初始化成功');
  } catch (error) {
    updateLog.error(`目录初始化失败: ${error.message}`);
    throw new UpdateError('目录初始化失败', 'INIT_DIR_ERROR');
  }
};

// 初始化目录
initDirs();

// 文件路径配置
const paths = {
  temp: {
    zip: `${tempDir}resources.zip`,
    yml: `${tempDir}latest.yml`
  },
//   current: {
//     zip: `${resourcesDir}resources.zip`,
//     yml: `${resourcesDir}latest.yml`
//   }
};

// 自定义错误类
class UpdateError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'UpdateError';
  }
}

const parseUrl = (hostName) => {
  try {
    hostName = hostName.replace(/\/$/, '');
    const isHttps = hostName.startsWith('https://');
    const isHttp = hostName.startsWith('http://');
    
    if (!isHttp && !isHttps) {
      throw new Error('不支持的协议');
    }

    const pureHostName = hostName.replace(/^https?:\/\//, '');
    
    return {
      protocol: isHttps ? 'https' : 'http',
      hostName: pureHostName,
      fullUrl: hostName
    };
  } catch (error) {
    updateLog.error(`URL解析失败: ${error.message}`);
    throw new UpdateError('URL格式错误', 'URL_PARSE_ERROR');
  }
};

// 统一错误处理
const handleError = (error) => {
  const errorMap = {
    ETIMEDOUT: { title: "更新超时提醒", content: "请检查网络是否正常" },
    ENOTFOUND: { title: "连接失败", content: "无法连接到更新服务器" },
    ECONNREFUSED: { title: "提示信息", content: "服务器拒绝连接" },
    CHECKSUM_FAILED: { title: "更新包损坏", content: "请重新下载" },
    NO_BACKUP: { title: "回滚失败", content: "没有可用的备份" },
    NETWORK_ERROR: { title: "网络错误", content: "请检查网络连接" },
    CONFIG_ERROR: { title: "配置错误", content: "更新配置不完整" },
    URL_PARSE_ERROR: { title: "配置错误", content: "服务器地址格式不正确" },
    FILE_NOT_FOUND: { title: "文件不存在", content: "更新文件不存在" },
    DOWNLOAD_ERROR: { title: "更新文件下载失败", content: "更新文件下载失败" },
    PERMISSION_ERROR: { title: "权限错误", content: "无法获取安装目录权限" }
  };

  const errorInfo = errorMap[error.code] || { 
    title: "更新失败", 
    content: error.message || "请稍后重试" 
  };

  updateLog.error(`更新失败: ${error.message}`);
  global.$notification.create(errorInfo.title, errorInfo.content);
};

// 文件清理
const emptyDir = (dirPath) => {
    try {
        // 检查目录是否存在
        if (!fs.existsSync(dirPath)) {
            updateLog.info(`目录不存在: ${dirPath}`);
            return;
        }

        // 读取目录内容
        const files = fs.readdirSync(dirPath);
        // updateLog.info(`准备清理目录: ${dirPath}, 文件数量: ${files.length}`);

        for (const file of files) {
            const curPath = path.join(dirPath, file);
            
            try {
                const stats = fs.lstatSync(curPath);
                
                if (stats.isDirectory()) {
                    // 递归清空子文件夹
                    emptyDir(curPath);
                    // 删除空的子文件夹
                    fs.rmdirSync(curPath);
                    // updateLog.info(`删除文件夹成功: ${curPath}`);
                } else {
                    // 删除文件
                    fs.unlinkSync(curPath);
                    // updateLog.info(`删除文件成功: ${curPath}`);
                }
            } catch (fileError) {
                updateLog.error(`删除文件失败: ${curPath}, 错误: ${fileError.message}`);
                // 继续处理其他文件，而不是直接抛出错误
            }
        }
    } catch (error) {
        updateLog.error(`清理目录失败: ${dirPath}, 错误: ${error.message}`);
        throw new UpdateError('清理目录失败', 'CLEANUP_ERROR');
    }
};

// 获取更新配置
const getUpdateConfig = async () => {
  try {
    const curEnv = await readConfig();
    updateLog.info(`当前配置参数: ${JSON.stringify(curEnv)}`);
    return { curEnv };
  } catch (error) {
    console.log(error,'error')
    throw new UpdateError('获取配置失败', 'CONFIG_ERROR');
  }
};

// 版本比较
const compareVersions = (version1, version2) => {
  const normalize = v => v.split('.').map(Number);
  const v1 = normalize(version1);
  const v2 = normalize(version2);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 !== num2) return num1 > num2 ? 1 : -1;
  }
  return 0;
};

// 文件校验
const verifyChecksum = async (filePath, expectedHash) => {
    try {
      // 使用流式读取，可能对大文件更友好
      const stream = fs.createReadStream(filePath);
      const hash = crypto.createHash('sha512');
  
      return new Promise((resolve, reject) => {
        stream.on('data', chunk => {
          hash.update(chunk);
        });
  
        stream.on('end', () => {
          const actualHash = hash.digest('base64');
          updateLog.info('计算得到的哈希值:', actualHash);
          updateLog.info('预期的哈希值:', expectedHash);
          resolve(actualHash === expectedHash);
        });
  
        stream.on('error', error => {
          updateLog.error(`读取文件流失败: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      updateLog.error(`校验文件失败: ${error.message}`);
      throw new UpdateError('文件校验失败', 'CHECKSUM_FAILED');
    }
  };

// 下载文件
const downloadFile = async (curEnv, filePath, fileName, updateMsg = null) => {
  try {
    const { protocol, fullUrl } = parseUrl(curEnv.VUE_APP_HOST_NAME);
    const url = `${fullUrl}${filePath}`;

    updateLog.info(`==================下载文件开始==================`);
    updateLog.info(`下载URL: ${url}`);
    updateLog.info(`目标文件: ${fileName}`);
    updateLog.info(`使用协议: ${protocol}`);

    const axiosConfig = {
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 60000,
      onDownloadProgress: (progressEvent) => {
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
      }
    };

    if (protocol === 'https') {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
      updateLog.info('已配置HTTPS代理，禁用证书验证');
    }

    updateLog.info('开始发送下载请求...');
    const response = await axios(axiosConfig);
    updateLog.info('收到服务器响应');
    
    // 检查是否有 Content-Length 头
    const contentLength = response.headers['content-length'];
    if (!contentLength) {
      updateLog.error('服务器响应中没有Content-Length头信息');
      throw new UpdateError('无法获取文件大小信息', 'DOWNLOAD_ERROR');
    }
    const fileSizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
    updateLog.info(`预期文件大小: ${fileSizeMB}MB`);

    // 创建临时文件名
    const tempFileName = `${fileName}.downloading`;
    updateLog.info(`创建临时文件: ${tempFileName}`);
    const writer = fs.createWriteStream(tempFileName);
    
    let downloadedSize = 0;
    response.data.on('data', (chunk) => {
      downloadedSize += chunk.length;
      if (downloadedSize % (1024 * 1024) === 0) {
        const downloadedSizeMB = (downloadedSize / (1024 * 1024)).toFixed(2);
        updateLog.info(`已下载: ${downloadedSizeMB}MB`);
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        try {
          updateLog.info('文件写入完成，开始验证...');
          
          // 验证文件大小
          const stats = fs.statSync(tempFileName);
          const actualSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          updateLog.info(`实际下载大小: ${actualSizeMB}MB`);
          
          if (stats.size !== parseInt(contentLength)) {
            updateLog.error(`文件大小不匹配! 预期: ${fileSizeMB}MB, 实际: ${actualSizeMB}MB`);
            fs.unlinkSync(tempFileName);
            throw new UpdateError('更新文件下载失败', 'DOWNLOAD_ERROR');
          }
          updateLog.info('文件大小验证通过');

          // 如果是zip文件，验证zip格式
          if (fileName.endsWith('.zip')) {
            updateLog.info('开始验证ZIP文件格式...');
            try {
              const zip = new admZip(tempFileName);
              const entries = zip.getEntries();
              updateLog.info(`ZIP格式验证通过，包含 ${entries.length} 个文件`);
              // 输出zip内文件列表
              entries.forEach(entry => {
                const entrySizeMB = (entry.header.size / (1024 * 1024)).toFixed(2);
                // updateLog.info(`- ${entry.entryName} (${entrySizeMB}MB)`);
              });
            } catch (error) {
              updateLog.error(`ZIP格式验证失败: ${error.message}`);
              fs.unlinkSync(tempFileName);
              throw new UpdateError('无效的ZIP文件格式', 'INVALID_ZIP_FORMAT');
            }
          } else if (fileName.endsWith('.yml')) {
            updateLog.info('开始验证YML文件格式...');
            try {
              const ymlContent = fs.readFileSync(tempFileName, 'utf8');
              const doc = yaml.load(ymlContent);
              console.log(doc,'doc22112')
              if (!doc || typeof doc !== 'object') {
                throw new Error('无效的YAML格式');
              }
              updateLog.info('YML格式验证通过');
            } catch (error) {
              updateLog.error(`YML格式验证失败: ${error.message}`);
              fs.unlinkSync(tempFileName);
              throw new UpdateError('无效的YML文件格式', 'INVALID_YML_FORMAT');
            }
          }

          // 验证成功，重命名文件
          updateLog.info('所有验证通过，准备重命名文件...');
          if (fs.existsSync(fileName)) {
            updateLog.info(`删除已存在的文件: ${fileName}`);
            fs.unlinkSync(fileName);
          }
          fs.renameSync(tempFileName, fileName);
          updateLog.info(`文件重命名成功: ${tempFileName} -> ${fileName}`);

          if(updateMsg) {
            sendUpdateMessage("UpdatePartMsg", updateMsg);
            updateLog.info('已发送更新消息通知');
          }
          updateLog.info(`==================下载文件完成==================`);
          resolve(true);
        } catch (error) {
          updateLog.error(`验证过程出错: ${error.message}`);
          if (fs.existsSync(tempFileName)) {
            updateLog.info(`清理临时文件: ${tempFileName}`);
            fs.unlinkSync(tempFileName);
          }
          reject(error);
        }
      });

      writer.on('error', (err) => {
        updateLog.error(`文件写入错误: ${err.message}`);
        if (fs.existsSync(tempFileName)) {
          updateLog.info(`清理临时文件: ${tempFileName}`);
          fs.unlinkSync(tempFileName);
        }
        reject(new UpdateError('下载文件失败', 'DOWNLOAD_ERROR'));
      });

      response.data.on('error', (err) => {
        updateLog.error(`数据传输错误: ${err.message}`);
        if (fs.existsSync(tempFileName)) {
          updateLog.info(`清理临时文件: ${tempFileName}`);
          fs.unlinkSync(tempFileName);
        }
        reject(new UpdateError('数据传输失败', 'DOWNLOAD_ERROR'));
      });
    });
  } catch (error) {
    updateLog.error(`下载过程出错: ${error.message}`);
    updateLog.error(`错误堆栈: ${error.stack}`);
    const errorCode = error.code || 'DOWNLOAD_ERROR';
    // throw new UpdateError(error.message || '下载文件失败', errorCode);
  }
};

// 创建备份
const createBackup = async () => {
    try {
      const timestamp = Date.now();
      const backupFolder = `${backupDir}backup_${timestamp}/`;
      
      // 1. 确保备份目录存在
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      
      // 2. 创建时间戳子文件夹
      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
      }

      // 3. 复制当前使用的文件到备份目录
    const filesToBackup = [
        { 
          src: paths.temp.zip,  // 从临时目录备份
          dest: `${backupFolder}resources.zip` 
        },
        { 
          src: paths.temp.yml,  // 从临时目录备份
          dest: `${backupFolder}latest.yml` 
        }
      ];

      let backupCount = 0;
      for (const file of filesToBackup) {
        if (fs.existsSync(file.src)) {
          fs.copyFileSync(file.src, file.dest);
          backupCount++;
          updateLog.info(`备份文件成功: ${file.src}`);
        } else {
          updateLog.warn(`文件不存在，跳过备份: ${file.src}`);
        }
      }

      // 4. 检查备份结果
      if (backupCount === 0) {
        fs.rmdirSync(backupFolder);
        updateLog.warn('没有文件需要备份，删除空文件夹');
        return null;
      }

      updateLog.info(`备份完成，共备份 ${backupCount} 个文件，备份目录: ${backupFolder}`);
      return timestamp;
    } catch (error) {
      updateLog.error(`创建备份失败: ${error.message}`);
      throw new UpdateError('创建备份失败', 'BACKUP_ERROR');
    }
  };
  

// 清理旧备份
const cleanOldBackups = (keepCount = 5) => {
    try {
      const minKeepCount = 3; // 设置最小保留数量
      const actualKeepCount = Math.max(keepCount, minKeepCount);

      if (!fs.existsSync(backupDir)) {
        updateLog.info('备份目录不存在，无需清理');
        return;
      }

      const backups = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup_'))
        .sort((a, b) => b.localeCompare(a)); // 降序排序，最新的在前

      if (backups.length <= actualKeepCount) {
        updateLog.info(`当前备份数量(${backups.length})小于等于保留数量(${actualKeepCount})，无需清理`);
        return;
      }

      // 删除多余的备份
      backups.slice(actualKeepCount).forEach(backup => {
        try {
          const backupPath = `${backupDir}${backup}`;
          emptyDir(backupPath);
          fs.rmdirSync(backupPath);
          updateLog.info(`成功清理旧备份: ${backup}`);
        } catch (err) {
          updateLog.error(`清理备份${backup}失败: ${err.message}`);
        }
      });

      updateLog.info(`备份清理完成，保留了${actualKeepCount}个最新备份`);
    } catch (error) {
      updateLog.error(`清理旧备份过程出错: ${error.message}`);
    }
  };

// 回滚
const rollback = async (timestamp) => {
  try {
    const backupFolder = `${backupDir}backup_${timestamp}/`;
    
    if (!fs.existsSync(backupFolder)) {
      throw new UpdateError('没有可用的备份', 'NO_BACKUP');
    }

    // 从备份恢复文件
    if (fs.existsSync(`${backupFolder}resources.zip`)) {
      fs.copyFileSync(`${backupFolder}resources.zip`, paths.current.zip);
      updateLog.info(`回滚resources.zip成功`);
    }

    if (fs.existsSync(`${backupFolder}latest.yml`)) {
      fs.copyFileSync(`${backupFolder}latest.yml`, paths.current.yml);
      updateLog.info(`回滚latest.yml成功`);
    }
  } catch (error) {
    throw new UpdateError('回滚失败', 'ROLLBACK_ERROR');
  }
};

// 获取最新版本信息
const getLatestVersion = async (curEnv, currentVersion) => {
  try {
    let latestVersion = {
      version: currentVersion,
      releaseNotes: '',
      source: 'current'
    };

    // 检查本地临时文件
    if (fs.existsSync(paths.temp.yml) && fs.existsSync(paths.temp.zip)) {
      try {
        updateLog.info('检查本地临时文件版本...');
        const localYmlContent = fs.readFileSync(paths.temp.yml, 'utf8');
        const localDoc = yaml.load(localYmlContent);
        const { version: localVersion, releaseNotes: localNotes } = localDoc;

        if (localVersion && compareVersions(localVersion, latestVersion.version) > 0) {
          updateLog.info(`发现更高版本的本地临时文件: v${localVersion}`);
          latestVersion = {
            version: localVersion,
            releaseNotes: localNotes,
            source: 'local'
          };
        }
      } catch (error) {
        updateLog.error(`读取本地临时文件失败: ${error.message}`);
        // 删除损坏的文件
        fs.unlinkSync(paths.temp.zip);
        fs.unlinkSync(paths.temp.yml);
      }
    }

    // 检查远程版本
    updateLog.info('检查远程版本...');
    const remoteYmlPath = path.join(tempDir, `remote_${Date.now()}.yml`);
    await downloadFile(
      curEnv,
      curEnv.VUE_APP_PATH_YML_NAME,
      remoteYmlPath
    );

    try {
      const remoteYmlContent = fs.readFileSync(remoteYmlPath, 'utf8');
      const remoteDoc = yaml.load(remoteYmlContent);
      const { version: remoteVersion, releaseNotes } = remoteDoc;

      if (remoteVersion && compareVersions(remoteVersion, latestVersion.version) > 0) {
        updateLog.info(`发现更高版本的远程更新: v${remoteVersion}`);
        latestVersion = {
          version: remoteVersion,
          releaseNotes,
          source: 'remote',
          ymlPath: remoteYmlPath
        };
      } else {
        // 远程版本不是最新的，删除下载的远程yml
        fs.unlinkSync(remoteYmlPath);
      }
    } catch (error) {
      updateLog.error(`读取远程版本文件失败: ${error.message}`);
      if (fs.existsSync(remoteYmlPath)) {
        fs.unlinkSync(remoteYmlPath);
      }
    }

    return latestVersion;
  } catch (error) {
    updateLog.error(`获取最新版本信息失败: ${error.message}`);
    throw error;
  }
};

// 检查更新
const checkForUpdates = async (type) => {
  try {
    updateLog.info('==================开始检查更新==================');
    const { curEnv } = await getUpdateConfig();
    updateLog.info('已获取更新配置');
    
    if (!curEnv.VUE_APP_HOST_NAME || 
        !curEnv.VUE_APP_PATH_YML_NAME || 
        !curEnv.VUE_APP_UPDATE_ZIP_PATH_NAME) {
      updateLog.error('更新配置不完整');
      throw new UpdateError('更新配置不完整', 'CONFIG_ERROR');
    }

    parseUrl(curEnv.VUE_APP_HOST_NAME);
    const currentVersion = app.getVersion();
    updateLog.info(`当前版本: v${currentVersion}`);

    // 获取最新版本信息
    const latestVersion = await getLatestVersion(curEnv, currentVersion);
    updateLog.info(`最新版本: v${latestVersion.version} (来源: ${latestVersion.source})`);

    if (latestVersion.source === 'current') {
      if (type) {
        global.$notification.create("消息提示", "暂无更新");
        updateLog.info("当前已是最新版本");
      }
      updateLog.info('==================更新检查完成==================');
      return false;
    }

    // 处理本地临时文件更新
    if (latestVersion.source === 'local') {
      updateLog.info('使用本地临时文件更新...');
      sendUpdateMessage("UpdatePartMsg", {
        flag: true,
        releaseNotes: latestVersion.releaseNotes,
        updateVersion: latestVersion.version
      });
      return true;
    }

    // 处理远程更新
    if (latestVersion.source === 'remote') {
      updateLog.info('开始下载远程更新...');
      global.$notification.create("消息提示", "更新包正在下载中,请稍等...");

      // 移动远程yml文件到临时文件位置
      fs.renameSync(latestVersion.ymlPath, paths.temp.yml);

      const updateMsg = {
        flag: true,
        releaseNotes: latestVersion.releaseNotes,
        updateVersion: latestVersion.version
      };

      await downloadFile(
        curEnv,
        curEnv.VUE_APP_UPDATE_ZIP_PATH_NAME,
        paths.temp.zip,
        updateMsg
      );
      return true;
    }

    return false;
  } catch (error) {
    updateLog.error(`检查更新失败: ${error.message}`);
    handleError(error);
    return false;
  }
};

// 在开始安装更新前,设置窗口为不可关闭状态
const startInstallUpdate = async () => {
  try {
    const win = global.$windows;
    if (!win) {
      updateLog.error('窗口未创建');
      return;
    }

    // 禁用窗口关闭按钮
    win.setClosable(false);
    
    // 添加关闭事件处理
    win.on('close', (e) => {
      if (!global.forceQuit) {
        e.preventDefault();
        global.$notification.create("提示", "更新过程中请勿关闭窗口");
      }
    });
    await installUpdate();
  } catch (error) {
    // 发生错误时恢复窗口可关闭状态
    const win = global.$windows;
    if (win) {
      win.setClosable(true);
    }
    handleError(error);
  }
};

// 修改 ipcMain 事件监听
ipcMain.on("Sure", async () => {
  await startInstallUpdate();
});

// 在 installUpdate 函数完成时设置 forceQuit
const installUpdate = async () => {
  try {
    updateLog.info('==================开始安装==================');
    // 0. 检查安装目录权限
    const permissionCheck = await checkDirectoryPermissions(installDir);
    console.log(permissionCheck, 'permissionCheck')
    if (!permissionCheck.hasPermission) {
      updateLog.info('需要获取目录权限，执行权限获取脚本');
      updateLog.info('权限检查详情:', permissionCheck.details);
      
      let message = '请在弹出的窗口中授予权限...\n';
      // 如果权限文件不存在，说明需要重新获取权限
      if (!permissionCheck.details.permissionFile) {
        message += '\n需要获取程序安装目录的访问权限';
      }
      
      sendUpdateMessage("InstallProgress", { 
        step: "正在获取必要权限", 
        progress: 0,
        message
      });

      try {
        await executePermissionScript(installDir);
      } catch (error) {
        updateLog.error('获取权限失败:', error);
        throw new UpdateError('无法获取必要的目录权限，请以管理员身份运行程序', 'PERMISSION_ERROR');
      }
      updateLog.info('成功获取目录权限');
    }

    // 1. 解压更新包
    const tempExtractDir = path.join(tempDir, 'extract_temp');
    !fs.existsSync(tempExtractDir) && fs.mkdirSync(tempExtractDir, { recursive: true });

    const unzip = new admZip(paths.temp.zip);
    updateLog.info(`解压更新包到临时目录: ${tempExtractDir}`);

    // 发送安装进度消息 - 开始解压
    sendUpdateMessage("InstallProgress", { 
      step: "正在解压新版本文件", 
      progress: 10,
      message: "请耐心等待，不要关闭程序..."
    });

    // 使用 Promise 包装解压操作，避免阻塞
    await new Promise((resolve, reject) => {
      setImmediate(() => {
        try {
          unzip.extractAllTo(tempExtractDir, true);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    // 2. 备份新安装的版本
    const backupTimestamp = await createBackup();
    if (backupTimestamp) {
      updateLog.info(`新版本备份完成: ${backupTimestamp}`);
    }

    // 发送安装进度消息 - 备份完成
    sendUpdateMessage("InstallProgress", { 
      step: "正在备份重要文件", 
      progress: 30,
      message: "确保您的数据安全..."
    });

    // 3. 清理旧备份
    cleanOldBackups(5);

    // 发送安装进度消息 - 准备更新
    sendUpdateMessage("InstallProgress", { 
      step: "准备更新文件", 
      progress: 50,
      message: "即将完成更新..."
    });

    // 4. 关闭所有窗口
    if (global.$windowService) {
      global.$windowService.closeAllWindows();
    }

    sendUpdateMessage("InstallProgress", { 
      step: "正在更新文件", 
      progress: 80,
      message: "更新即将完成..."
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 先发送100%的进度
    sendUpdateMessage("InstallProgress", { 
      step: "更新完成", 
      progress: 100,
      message: "正在完成最后的处理..."
    });

    // 等待一小段时间确保进度消息被处理
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. 复制文件
    const copyRecursive = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();

      if (isDirectory) {
        !fs.existsSync(dest) && fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    // 复制文件
    const resourcesParentDir = path.join(installDir+"/resources");
    console.log(resourcesParentDir, 'resourcesParentDir')
    copyRecursive(path.join(tempExtractDir, 'resources'), resourcesParentDir);
    
    // 6. 清理临时文件
    emptyDir(tempExtractDir);
    fs.rmdirSync(tempExtractDir);
    emptyDir(tempDir);

    // 7. 重启应用
    global.forceQuit = true;
    updateLog.info("更新完成，准备重启");

    // 确保在下一个事件循环中执行重启
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 2000);

  } catch (error) {
    // 发生错误时恢复窗口可关闭状态
    const win = global.$windows;
    if (win) {
      win.setClosable(true);
    }
    updateLog.error(`更新安装失败: ${error.message}`);
    throw new UpdateError('安装更新失败', 'INSTALL_ERROR');
  }
};

// 消息发送函数
const sendUpdateMessage = (type, data) => {
    const win = global.$windows;
    if (!win) {
      updateLog.error('窗口未创建，无法发送消息');
      return;
    }
  
    // 检查窗口是否已加载完成
    if (win.webContents.isLoading()) {
      updateLog.info('窗口正在加载，等待加载完成后发送消息');
      win.webContents.once('did-finish-load', () => {
        win.show();
        win.webContents.send(type, data);
        updateLog.info(`消息已发送 - 类型: ${type}, 数据:`, data);
      });
    } else {
      win.show();
      win.webContents.send(type, data);
      updateLog.info(`消息已发送 - 类型: ${type}, 数据:`, data);
    }
  };

export { checkForUpdates };