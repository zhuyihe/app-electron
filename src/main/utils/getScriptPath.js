import electron from 'electron';
import fs from 'fs';
import path from 'path';
import log from '@/main/modules/logger';

// 创建脚本模块的日志记录器
const scriptLog = log();
const SCRIPT_FOLDER = 'script';
const USER_DATA_PATH = electron.app.getPath('userData');
const DEFAULT_SCRIPT_PATH = getDefaultScriptPath();
const USER_SCRIPT_PATH = path.join(USER_DATA_PATH, SCRIPT_FOLDER);

function getSystem() {
  if (process.platform === "darwin") return 1;
  if (process.platform === "win32") return 2;
  if (process.platform === "linux") return 3;
}

function getExePath() {
  return path.dirname(electron.app.getPath("exe"));
}

function getDefaultScriptPath() {
  if (process.env.NODE_ENV !== "development") {
    if (getSystem() === 1) {
      return path.join(getExePath(), SCRIPT_FOLDER);
    } else {
      return path.join(getExePath(), SCRIPT_FOLDER);
    }
  } else {
    return path.resolve("./", SCRIPT_FOLDER);
  }
}

// 确保目录存在
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      scriptLog.info(`创建目录成功: ${dirPath}`);
      return true;
    } catch (error) {
      scriptLog.error(`创建目录失败: ${dirPath}, 错误: ${error.message}`);
      return false;
    }
  }
  return true;
};

// 复制文件夹及其内容
const copyDirectory = (source, target) => {
  try {
    // 如果目标目录不存在，创建它
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    // 读取源目录
    const files = fs.readdirSync(source);

    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      if (fs.statSync(sourcePath).isDirectory()) {
        // 如果是目录，递归复制
        copyDirectory(sourcePath, targetPath);
      } else {
        // 如果是文件，直接复制
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
    scriptLog.info(`复制目录成功: ${source} -> ${target}`);
    return true;
  } catch (error) {
    scriptLog.error(`复制目录失败: ${error.message}`);
    return false;
  }
};

export const initializeScriptFolder = () => {
  try {
    scriptLog.info('开始初始化脚本文件夹');
    scriptLog.info(`用户数据路径: ${USER_DATA_PATH}`);
    scriptLog.info(`脚本文件夹路径: ${USER_SCRIPT_PATH}`);

    // 1. 确保用户数据目录存在
    if (!ensureDirectory(USER_DATA_PATH)) {
      throw new Error('无法创建用户数据目录');
    }

    // 2. 检查用户脚本文件夹
    if (!fs.existsSync(USER_SCRIPT_PATH)) {
      scriptLog.info('用户脚本文件夹不存在，准备使用默认脚本');

      // 3. 检查默认脚本文件夹是否存在
      if (!fs.existsSync(DEFAULT_SCRIPT_PATH)) {
        scriptLog.error(`默认脚本文件夹不存在: ${DEFAULT_SCRIPT_PATH}`);
        throw new Error('默认脚本文件夹不存在');
      }
      
      // 4. 复制默认脚本到用户目录
      if (!copyDirectory(DEFAULT_SCRIPT_PATH, USER_SCRIPT_PATH)) {
        throw new Error('复制脚本文件夹失败');
      }
      scriptLog.info('已复制默认脚本到用户目录');
    }
    
    scriptLog.info('脚本文件夹初始化成功');
    return USER_SCRIPT_PATH;
  } catch (error) {
    scriptLog.error(`初始化脚本文件夹失败: ${error.message}`);
    if (error.stack) {
      scriptLog.debug('错误堆栈:', error.stack);
    }
    return null;
  }
};

// 导出路径配置
export const scriptPaths = {
  userDataPath: USER_DATA_PATH,
  userScriptPath: USER_SCRIPT_PATH,
  defaultScriptPath: DEFAULT_SCRIPT_PATH
};
