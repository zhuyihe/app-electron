const path = require("path");
const fs = require("fs");
const electron = require("electron");

export function getSystem() {
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
/**
 *
 * @returns 获取安装路径
 */
export function getExePath() {
  // return path.dirname("C:");
  return path.dirname(electron.app.getPath("exe"));
}
/**
 *
 * @returns 获取配置文件路径
 */
export function getConfigPath() {
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
/**
 * 读取配置文件
 */
export function readConfig() {
  return new Promise((res, rej) => {
    fs.readFile(getConfigPath(), "utf-8", (err, data) => {
      let config = "";
      if (data) {
        //有值
        config = JSON.parse(data);
      }
      res(config);
    });
  });
}
