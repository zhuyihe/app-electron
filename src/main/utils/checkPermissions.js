import fs from 'fs';
import path from 'path';
import {
    exec,
    spawn
} from 'child_process';
import {
    promisify
} from 'util';
import electron from 'electron';

const permissionLog = global.logs('permission-log');
const execAsync = promisify(exec);
const USER_DATA_PATH = electron.app.getPath('userData');
const SCRIPT_FOLDER = 'script';
const USER_SCRIPT_PATH = path.join(USER_DATA_PATH, SCRIPT_FOLDER);

const MAX_RETRIES = 3;
const SCRIPT_TIMEOUT = 30000; // 30 seconds

/**
 * 检查目录的所有必要权限
 * @param {string} dirPath 需要检查的目录路径
 * @returns {Promise<{hasPermission: boolean, details: Object}>} 权限检查结果
 */
export const checkDirectoryPermissions = async (dirPath) => {
    const result = {
        hasPermission: false,
        details: {
            read: false,
            write: false,
            execute: false,
            permissionFile: false,
            error: null
        }
    };

    try {
        // 检查权限标记文件
        const permissionFilePath = path.join(dirPath, 'gl_printer_permission_complete.txt');
        console.log(permissionFilePath,permissionFilePath,'permissionFilePath')
        if (fs.existsSync(permissionFilePath)) {
            result.details.permissionFile = true;
            result.hasPermission = true;
            return result;
        }

        // 如果没有权限文件，继续检查其他权限但保持 hasPermission 为 false
        if (!fs.existsSync(dirPath)) {
            result.details.error = '目录不存在';
            return result;
        }

        // 检查读取权限
        try {
            await fs.promises.access(dirPath, fs.constants.R_OK);
            result.details.read = true;
        } catch (error) {
            permissionLog.warn(`目录 ${dirPath} 缺少读取权限`);
        }

        // 检查写入权限
        try {
            const testFile = path.join(dirPath, '.permission_test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            result.details.write = true;
        } catch (error) {
            permissionLog.warn(`目录 ${dirPath} 缺少写入权限`);
        }

        // 检查执行权限
        try {
            await fs.promises.access(dirPath, fs.constants.X_OK);
            result.details.execute = true;
        } catch (error) {
            permissionLog.warn(`目录 ${dirPath} 缺少执行权限`);
        }

        // 即使有所有基本权限，没有权限文件也返回 false
        result.hasPermission = false;
        if (result.details.read && result.details.write && result.details.execute) {
            permissionLog.info(`目录 ${dirPath} 有基本权限，直接通过`);
            result.hasPermission = true;
        } else {
            permissionLog.warn(`目录 ${dirPath} 权限检查未通过，缺少必要权限`);
        }

    } catch (error) {
        result.details.error = error.message;
        permissionLog.error(`权限检查过程出错: ${error.message}`);
    }

    return result;
};

/**
 * 执行权限获取脚本
 * @param {string} installDir 安装目录路径
 * @returns {Promise<boolean>} 是否成功获取权限
 */

export const executePermissionScript = async (installDir) => {
    const scriptPath = path.join(USER_SCRIPT_PATH, "SetGlPrinterPermission.bat");
    console.log(scriptPath, 'scriptPath');
    
    if (!fs.existsSync(scriptPath)) {
        permissionLog.error(`权限获取脚本不存在: ${scriptPath}`);
        return false;
    }

    permissionLog.info(`开始执行权限获取脚本`);

    // 使用 PowerShell 提权并运行批处理文件
    const powershellCommand = `Start-Process cmd -ArgumentList '/c "${scriptPath}"' -Verb runAs`;

    return new Promise((resolve, reject) => {
        const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellCommand], {
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: false
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', data => {
            stdout += data.toString();
            permissionLog.info(`脚本输出: ${data.toString()}`);
        });

        child.stderr.on('data', data => {
            stderr += data.toString();
            permissionLog.warn(`脚本错误: ${data.toString()}`);
        });

        child.on('error', error => {
            permissionLog.error(`启动 PowerShell 进程时出错: ${error.message}`);
            reject(error);
        });

        child.on('close', async (code) => {
            console.log(`脚本执行完成，退出代码: ${code}`);
            if (code !== 0) {
                reject(new Error(`脚本执行失败，退出代码: ${code}`));
                return;
            }

            // 定义完成标记文件路径
            const completeFilePath = path.join(installDir, 'gl_printer_permission_complete.txt');
            const parentDir = path.dirname(completeFilePath);

            permissionLog.info(`开始监听权限文件: ${completeFilePath}`);
            permissionLog.info(`监听目录: ${parentDir}`);

            // 设置10秒超时
            let timeoutHandle;

            // 使用fs.watch监听文件变化
            const watcher = fs.watch(parentDir, (eventType, filename) => {
                permissionLog.info(`检测到文件变化: ${filename}, 事件类型: ${eventType}`);
                if (filename === 'gl_printer_permission_complete.txt' && eventType === 'rename') {
                    // 检查文件是否真的存在（避免删除事件的触发）
                    if (fs.existsSync(completeFilePath)) {
                        permissionLog.info('权限标记文件已创建');
                        clearTimeout(timeoutHandle);
                        watcher.close();
                        resolve(true);
                    } else {
                        permissionLog.warn('检测到文件变化但文件不存在');
                    }
                }
            });

            // 如果文件已经存在，直接返回成功
            if (fs.existsSync(completeFilePath)) {
                permissionLog.info('权限标记文件已存在');
                watcher.close();
                resolve(true);
                return;
            }

            // 设置超时处理
            timeoutHandle = setTimeout(() => {
                watcher.close();
                reject(new Error('等待权限文件超时'));
            }, 10000);

            // 确保在所有情况下都能清除超时和关闭监听器
            const cleanup = () => {
                clearTimeout(timeoutHandle);
                watcher.close();
            };

            // 添加异常处理以确保清理资源
            process.on('exit', cleanup);
            process.on('SIGINT', cleanup);
            process.on('uncaughtException', cleanup);
        });
    });
};