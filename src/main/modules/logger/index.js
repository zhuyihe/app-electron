import logger from 'electron-log';
import { app } from 'electron';

// 设置日志文件路径
const setLogFilePath = (moduleName) => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const basePath = app.getPath('userData') + '\\electron_log\\app\\';
  
  const fileName = moduleName ? `${moduleName}_${formattedDate}.log` : `${formattedDate}.log`;
  
  logger.transports.file.file = `${basePath}${fileName}`;
};

const initLogger = (moduleName = '') => {
  setLogFilePath(moduleName);
  logger.transports.file.level = 'info';
  logger.transports.file.maxSize = 1002430; // 10M
  logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
};

initLogger();

const log = (moduleName = '') => {
  if (moduleName) {
    initLogger(moduleName);
  }
  
  return {
    info(param) {
      logger.info(param);
    },
    warn(param) {
      logger.warn(param);
    },
    error(param) {
      logger.error(param);
    },
    debug(param) {
      logger.debug(param);
    },
    verbose(param) {
      logger.verbose(param);
    },
    silly(param) {
      logger.silly(param);
    }
  };
};

global.logs = log;
export default log;