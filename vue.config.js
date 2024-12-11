// const CopyPlugin = require("copy-webpack-plugin");
const version = new Date().getTime();
const red = require("./package.json").version;
module.exports = {
  lintOnSave: false,
  productionSourceMap: false,
  devServer: {
    hot: true,
    port: 8384,
  },
  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: {
      // 修改打包后css文件名   // css打包文件，添加时间戳
      filename: `css/[name].${version}.css`,
      chunkFilename: `css/[name].${version}.css`,
    },
  },
  configureWebpack: {
    output: {
      // 输出重构  打包编译后的 文件名称  【模块名称.版本号.时间戳】
      filename: `js/[name].[hash].${version}.js`,
      chunkFilename: `js/[id].[hash].${version}.js`,
    },
  },
  pluginOptions: {
    CopyPlugin: {},
    electronBuilder: {
      nodeIntegration: true,
      preload: "src/preload.js",
      builderOptions: {
        appId: "com.GlPrinter.app",
        productName: "GlPrinter", //项目名，也是生成的安装文件名
        copyright: "高灵智腾", //版权信息
        directories: {
          output: "./dist", //输出文件路径
        },
        publish: [
          {
            provider: "generic",
            url: "https://10.102.11.76/printsoftware",
          },
        ],
        releaseInfo: {
          releaseNotesFile: `releaseNote/release-${red}.md`,
        },
        compression: "store",
        win: {
          asar: false,
          target: [
            {
              target: "nsis", //利用nsis制作安装程序,打包文件的后缀为exe
              arch: [
                "x64", //64位
                "ia32", //32位
              ],
            },
          ],
          // extraResources: ["./public/*.exe", "./public/update.json"],
          extraResources: [
            "./public/*.exe",
            "./public/pdf/*.pdf",
            {
              from: "./config.json",
              to: "../",
            },
          ],
          //win相关配置
          icon: "./public/logo.png", //图标，当前图标在根目录下，注意这里有两个坑
        },
        nsis: {
          oneClick: false, //一键安装
          language: "2052", //安装语言
          perMachine: true, //应用所有用户
          allowToChangeInstallationDirectory: true, //用户可以选择路径
          // 安装图标
          installerIcon: "./public/favicon.ico",
          // 卸载图标
          uninstallerIcon: "./public/favicon.ico",
          // 安装时头部图标
          installerHeaderIcon: "./public/favicon.ico",
          // 创建桌面图标
          createDesktopShortcut: true,
          // 创建开始菜单图标
          createStartMenuShortcut: true,
          // 图标名称
          shortcutName: "GlPrinter",
        },
      },
    },
  },
};
