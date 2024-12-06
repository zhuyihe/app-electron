import electron from 'electron';
import fs from 'fs';
import path from 'path';
import log from '@/main/modules/logger';  // 导入日志模块
// 创建配置模块的日志记录器
const configLog = log()
const CONFIG_FILE = 'update_config.json';
const USER_DATA_PATH = electron.app.getPath('userData');
const DEFAULT_CONFIG_PATH = getConfigPath();
const USER_CONFIG_PATH = path.join(USER_DATA_PATH, CONFIG_FILE);

function getSystem() {
    //这是mac系统
    if (process.platform == "darwin") {
      return 1;
    }
    //这是windows系统
    if (process.platform == "win32") {
      return 2;
    }
    //这是linux系统
    if (process.platform == "linux") {
      return 3;
    }
  }

 function getExePath() {
    // return path.dirname("C:");
    return path.dirname(electron.app.getPath("exe"));
}

function getConfigPath() {
    if (process.env.NODE_ENV !== "development") {
        if (getSystem() === 1) {
        return getExePath() + "/config.json";
        } else {
        return getExePath() + "\\config.json";
        }
    } else {
        return path.resolve("./") + "/config.json";
    }
}
// 确保目录存在
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      configLog.info(`创建目录成功: ${dirPath}`);
      return true;
    } catch (error) {
      configLog.error(`创建目录失败: ${dirPath}, 错误: ${error.message}`);
      return false;
    }
  }
  return true;
};

export const readConfig = () => {
  try {
    configLog.info('开始读取配置文件');
    configLog.info(`用户数据路径: ${USER_DATA_PATH}`);
    configLog.info(`配置文件路径: ${USER_CONFIG_PATH}`);

    // 1. 确保用户数据目录存在
    if (!ensureDirectory(USER_DATA_PATH)) {
      throw new Error('无法创建用户数据目录');
    }

    // 2. 检查用户配置文件
    if (!fs.existsSync(USER_CONFIG_PATH)) {
      configLog.info('用户配置文件不存在，准备使用默认配置');

      // 3. 检查默认配置文件是否存在
      if (!fs.existsSync(DEFAULT_CONFIG_PATH)) {
        configLog.error(`默认配置文件不存在: ${DEFAULT_CONFIG_PATH}`);
        throw new Error('默认配置文件不存在');
      }
      
      // 4. 复制默认配置到用户目录
      const defaultConfig = fs.readFileSync(DEFAULT_CONFIG_PATH);
      fs.writeFileSync(USER_CONFIG_PATH, defaultConfig);
      configLog.info('已复制默认配置到用户目录');
    }
    
    // 5. 读取并解析配置
    const configData = fs.readFileSync(USER_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    configLog.info('配置文件读取成功');
    configLog.debug('当前配置:', config); // 仅在调试时记录具体配置
    
    return config;
  } catch (error) {
    configLog.error(`读取配置文件失败: ${error.message}`);
    if (error.stack) {
      configLog.debug('错误堆栈:', error.stack);
    }
    return null;
  }
};

export const saveConfig = (config) => {
  try {
    configLog.info('开始保存配置文件');

    // 1. 确保目录存在
    if (!ensureDirectory(USER_DATA_PATH)) {
      throw new Error('无法创建用户数据目录');
    }

    // 2. 保存配置
    fs.writeFileSync(
      USER_CONFIG_PATH, 
      JSON.stringify(config, null, 2),
      'utf8'
    );
    
    configLog.info('配置文件保存成功');
    configLog.debug('保存的配置:', config); // 仅在调试时记录具体配置
    
    return true;
  } catch (error) {
    configLog.error(`保存配置文件失败: ${error.message}`);
    if (error.stack) {
      configLog.debug('错误堆栈:', error.stack);
    }
    return false;
  }
};

// 导出路径配置，方便其他模块使用
export const configPaths = {
  userDataPath: USER_DATA_PATH,
  userConfigPath: USER_CONFIG_PATH,
  defaultConfigPath: DEFAULT_CONFIG_PATH
};