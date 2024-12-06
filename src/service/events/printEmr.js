const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { resStatus } = require("../events/resStatus");

const printEmr = (req, res) => {
  console.log(global.$notification);
  global.$notification.create("打印消息", "病历打印中...");
  let { FileStream, showHtml,type } = req.body;
  const fontWeight =
    "font-weight: bold;text-shadow:0.15pt 0px 0px black, 0.25pt 0px 0px black, 0.35pt 0px 0px black, -0.25pt 0px 0px black, 0px 0.25pt 0px black, 0px -0.25pt 0px black;";
  // FileStream = FileStream.replace(/\SimSun/g, 'FangSong')
  const fontNormal = "font-weight: normal;text-shadow: 0 0 black;";
  FileStream = FileStream.replaceAll("font-weight: bold;", fontWeight);
  FileStream = FileStream.replaceAll("font-weight: normal;", fontNormal);
  FileStream = FileStream.replaceAll("<b>", `<b style="${fontWeight}">`);
  // console.log(FileStream,'FileStream')
  let emrConfig = {
    ...req.body,
    FileStream,
  };
  global.$electronStore.set("emrConfig", emrConfig);

  if (showHtml) {
    global.$windows.webContents.send("printHtml", emrConfig);
  } else {
    loadHtml(emrConfig, res,type);
  }
};
const loadHtml = (emrConfig, res,type) => {
  const staticPath =type?path.join(__static, "printHtml/printEmr.html"): path.join(__static, "print.html");
  const option = {
    show: global.isDevMode ? true : false,
    webPreferences: {
      enableRemoteModule: true, // 启用remote
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      webviewTag: true,
      contextIsolation: false,
    },
  };
  const id = uuidv4();
  const win = global.$windowService.createWinItem(id, option, staticPath);
  win.loadURL(staticPath);
  printSilent(win, emrConfig, res, id);
};
const printSilent = (win, emrConfig, res, id) => {
  const { PrintSettings } = emrConfig;
  let { PrintName, PrintNum, Duplex } = PrintSettings,
    duplexMode = "";
  switch (Duplex) {
    case "Simplex":
      duplexMode = "";
      break;
    case "Vertical":
      duplexMode = "longEdge";
      break;
    case "Horizontal":
      duplexMode = "shortEdge";
      break;
  }
  win.webContents.once("dom-ready", () => {
    if (global.isDevMode) {
      win.show();
      win.webContents.openDevTools(true);
    }

    // 向print.htm发送打印数据
    win.webContents.send("webview-print-render", {
      content: emrConfig.FileStream,
      parent: "win",
    });
  });
  win.webContents.on("ipc-message", (event, channel) => {
    let printerConfig = {
      silent: true,
      printBackground: false,
      deviceName: PrintName || "Microsoft Print to PDF", 
      copies: parseInt(PrintNum) || 1,
      duplexMode,
    };

    // 调用打印方法
    win.webContents.print(printerConfig, (data) => {
      let msg = "";
      if (!data) {
        msg = "打印失败，请检查打印机";
        resStatus(res, false, msg);
      } else {
        msg = "打印成功";
        resStatus(res, true, msg);
      }
      printerConfig.msg = msg;
      global.logs.info(`print ${data}==>${JSON.stringify(printerConfig)}`);
      global.$notification.create("打印消息", msg);
      console.log(data, global.isDevMode, "打印结果");
      if (!global.isDevMode) global.$windowService.closeWindow(id)
    });
  });
};
module.exports = printEmr;
