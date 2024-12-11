import { app, ipcMain } from "electron";
import { readConfig } from "@/main/utils/getConfig.js";
const admZip = require("adm-zip");
const request = require("request");
const https = require("https");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");

const baseUrl = path.resolve("./") + "/";
// 加载默认的 .env 文件
const downLoadZip = `${baseUrl}resources.zip`;
const getUpadteJson = async () => {
  const curEnv = await readConfig();
  const fileUrlObj = {
    hostname: curEnv.VUE_APP_HOST_NAME,
    port: 443,
    path: curEnv.VUE_APP_PATH_YML_NAME,
    method: "GET",
  };
  
  setTimeout(() => {
    global.logs.info(`当前配置参数${JSON.stringify(curEnv)}`);
  }, 3000);
  return { fileUrlObj, curEnv };
};

/**
 * 更新
 */
const downLoad = (updateMsg, curEnv) => {
  return new Promise((resolve, reject) => {
    // 创建一个可以写入的流，
    const stream = fs.createWriteStream(downLoadZip);
    const url = `https://${curEnv.VUE_APP_HOST_NAME}/${curEnv.VUE_APP_UPDATE_ZIP_PATH_NAME}`;
    const req = request({
      url,
      rejectUnauthorized: false,
    }).pipe(stream);
    req.on("finish", function (response) {
      console.log("finish");
    });
    req.on("close", function () {
      console.log("close");
      sendUpdateMessage("UpdatePartMsg", updateMsg);
      resolve(true);
    });
  });
};
const emptyDir = (path, type) => {
  if (type) {
    // fs.unlinkSync(path)
    fs.unlink(path, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        global.logs.info(`删除${path}文件成功`);
        console.log(`删除${path}文件成功`);
      }
    });
  } else {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const filePath = `${path}/${file}`;
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        emptyDir(filePath);
      } else {
        fs.unlinkSync(filePath);
        global.logs.info(`删除${file}文件成功`);
        console.log(`删除${file}文件成功`);
      }
    });
  }
};
const checkForUpdates =async (type) => {
  const { fileUrlObj, curEnv } =await getUpadteJson();
  return new Promise((resolve, reject) => {
    const options = {
      rejectUnauthorized: false,
      ...fileUrlObj,
    };
    console.log(options, "options");
    global.logs.info(`下载更新地址${JSON.stringify(options)}`);
    const req = https.request(options, function (res) {
      const data = [];
      res.on("data", function (d) {
        //   process.stdout.write(d);
        data.push(d);
      });
      res.on("end", function (d) {
        const body = Buffer.concat(data).toString();
        var doc = yaml.load(body);
        const json = JSON.parse(JSON.stringify(doc, null, 2));
        const { version, releaseNotes } = json;

        console.log(version, releaseNotes, "releaseNotes");

        if (version) {
          /**
           * app.getVersion() 返回开发中的 Electron 版本号
           */
          const packageVersion = app.getVersion();
          console.log(
            compareVersions(version, packageVersion),
            version,
            packageVersion
          );
          const flag =
            compareVersions(version, packageVersion) > 0 ? true : false;
          if (flag) {
            const updateMsg = { flag, releaseNotes, updateVersion: version };
            //判断是否存在resources.zip
            fs.stat(downLoadZip, async (err, stats) => {
              console.log(err, stats, "err");
              if (stats) {
                global.$windows.webContents.on("did-finish-load", () => {
                  console.log("webContents加载完了");
                  global.logs.info(`存在更新包，直接更新`);
                  global.logs.info(JSON.stringify(stats));
                  sendUpdateMessage("UpdatePartMsg", updateMsg);
                });
              } else {
                checkIfFileExists(updateMsg, curEnv);
                // global.$notification.create("消息提示", "更新包正在下载中,请稍等...");
                // global.logs.info(`更新包正在下载中,请稍等...`);
                // await downLoad(updateMsg, curEnv);
              }
            });
          } else {
            type && global.$notification.create("消息提示", "暂无更新...");
            global.logs.info(`暂无更新`);
          }
        }

        ipcMain.on("Sure", (event, message) => {
          const unzip = new admZip(downLoadZip); //下载压缩更新包
          unzip.extractAllTo(`${baseUrl}`, true); //解压替换本地文件
          setTimeout(() => {
            global.forceQuit = true;
            emptyDir(downLoadZip, "zip");
            global.logs.info(`安装更新,重启项目`);
            app.exit();
            app.relaunch();
          }, 2000);
        });
      });
      res.on("error", (err) => {
        reject(err);
      });
    });
    req.end();
    req.on("error", function (e) {
      console.log(e,'error')
      const { code } = e,
        map = {
          ETIMEDOUT: {
            title: "更新超时提醒",
            content: "请检查网络是否正常",
          },
        };
        console.log(map[code],code,'map[code]')
      map[code] &&
        global.$notification.create(map[code].title, map[code].content);
      // throw 'Failed to update the version number, please contact the administrator'
    });
  });
};
function sendUpdateMessage(type, data, winshow) {
  const win = global.$windows;
  win.show();
  console.log(global.$windows.webContents.send, type);
  win.webContents.send(type, data);
}

function compareVersions(version1, version2) {
  // 将版本号字符串拆分成数组
  const arr1 = version1.split(".");
  const arr2 = version2.split(".");

  // 比较每个部分的大小
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    if (arr1[i] === undefined) {
      return -1;
    }
    if (arr2[i] === undefined) {
      return 1;
    }

    if (parseInt(arr1[i]) > parseInt(arr2[i])) {
      return 1;
    } else if (parseInt(arr1[i]) < parseInt(arr2[i])) {
      return -1;
    }
  }

  // 如果所有部分都相等，则版本号相等
  return 0;
}
async function checkIfFileExists(updateMsg) {
  const { curEnv } = getUpadteJson();
  const options = {
    rejectUnauthorized: false,
    hostname: curEnv.VUE_APP_HOST_NAME,
    port: 443,
    path: curEnv.VUE_APP_UPDATE_ZIP_PATH_NAME,
    method: "GET",
  };
  const req = https.request(options, async function (res) {
    console.log(res, res.statusCode, "res");
    if (res.statusCode == "200") {
      global.$notification.create("消息提示", "更新包正在下载中,请稍等...");
      global.logs.info(`更新包正在下载中,请稍等...`);
      await downLoad(updateMsg, curEnv);
    } else {
      global.$notification.create("消息提示", "更新地址配置有误，请检查！");
    }
    res.on("error", (err) => {
      console.log("qqqqqq", err);
    });
  });
  req.end();
}

export { downLoad, checkForUpdates };
