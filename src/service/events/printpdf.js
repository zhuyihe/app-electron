const path = require('path')
const https = require('https')
const fs = require('fs')
const cp = require('child_process')
const { console } = require('inspector')
const staticPath = './public'
// const printer = require('pdf-to-printer')
// let pdfPath = path.join(__static, 'pdf/' + url.slice(url.lastIndexOf('/') + 1))
// const isPrdEnv = process.env.NODE_ENV === 'production'
const executePrint = (req, res) => {
    console.log(req, res,'req, res')
    let { FileStream, showHtml } = req.body;
    console.log(FileStream, showHtml,'FileStream, showHtml')
    global.$windows.webContents.on('did-finish-load', async () => {
        const pdfPath = path.join(__dirname, 'output.pdf');

        try {
            // 生成 PDF
            const pdf = await global.$windows.webContents.printToPDF({});
            fs.writeFileSync(pdfPath, pdf);
            console.log(`PDF saved to ${pdfPath}`);

            // 使用 SumatraPDF 静默打印
            // exec(`"C:\\Program Files\\SumatraPDF\\SumatraPDF.exe" -print-to-default "${pdfPath}"`, (error) => {
            //     if (error) {
            //         console.error('Print error:', error);
            //         return;
            //     }

            //     console.log('Print job sent successfully.');

            //     // 打印成功后删除 PDF 文件
            //     fs.unlink(pdfPath, (err) => {
            //         if (err) {
            //             console.error('Failed to delete PDF:', err);
            //         } else {
            //             console.log('PDF deleted successfully.');
            //         }
            //     });
            // });
        } catch (error) {
            console.error('Failed to create PDF:', error);
        }
    });
    // return new Promise((resolve, reject) => {
    //     cp.exec(
    //         `SumatraPDF.exe -print-to "${deviceName}"  "${pdfPath}"  -print-settings "paper=A4,landscape,fit" `,
    //         {
    //             windowsHide: true,
    //             cwd: path.resolve(__static, '')
    //         },
    //         e => {
    //             if (e) {
    //                 reject(`在${deviceName}上打印失败`)
    //             } else {
    //                 resolve(true)
    //             }
    //             /* 打印完成后删除创建的临时文件 */
    //             // fs.unlink(pdfPath, Function.prototype)
    //         }
    //     )
    // })
}

module.exports = { executePrint }
