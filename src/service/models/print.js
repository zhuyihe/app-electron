/* eslint-disable no-unused-vars */
const { body, validationResult } = require("express-validator");
// const boom = require('boom')
const path = require("path");
const { executePrint } = require("../events/printpdf");
const printEmr = require("../events/printEmr");
const { resStatus } = require("../events/resStatus");
// const request = require('request')
// const fs = require('fs')
// const printer = require('pdf-to-printer')
// const remote = require('electron').remote
// console.log(remote, 'remote')
// const electronStore = remote.getGlobal('electronStore')
// console.log(global, 'global')
const getEmrContent = (req, res, next) => {
  const err = validationResult(req);

  if (!err.isEmpty()) {
    const { msg } = err.errors[0];
    global.logs.error(JSON.stringify(err));
    resStatus(res, false, msg);
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回
    // next(boom.badRequest(msg))
    // return res.status(200).json({
    //     code: 200,
    //     data: {
    //         success: false,
    //         message: err.array()[0].msg
    //     }
    // })
  } else {
    printEmr(req, res);
  }
};

const printPdf = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const { msg } = err.errors[0];
    resStatus(res, false, msg);
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回
    // next(boom.badRequest(msg))
  } else {
    executePrint( req, res);
  }
};
const getPrinters = async (req, res, next) => {
  const printers = await global.$windows.webContents.getPrinters();
  console.log(printers, "printers");
  res.status(200).json({
    success: true,
    message: "打印机获取成功",
    data: {
      printers,
    },
  });
};

const getPrinterStatred = (req, res, next) => {
  res.status(200).json({
    code: 200,
    data: {
      success: true,
      message: "Glprinter启动状态获取成功",
    },
  });
};
module.exports = {
  getEmrContent,
  printPdf,
  getPrinters,
  getPrinterStatred
};
