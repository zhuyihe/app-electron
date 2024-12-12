import { initializeScriptFolder } from '@/main/utils/getScriptPath';
import log from '@/main/modules/logger';

const scriptLog = log();

export default function initScript() {
    try {
        scriptLog.info('开始初始化脚本文件夹');
        const scriptPath = initializeScriptFolder();
        if (scriptPath) {
            scriptLog.info(`脚本文件夹初始化成功: ${scriptPath}`);
            // 可以将脚本路径保存到全局变量中，方便其他模块使用
            global.$scriptPath = scriptPath;
        } else {
            scriptLog.error('脚本文件夹初始化失败');
        }
    } catch (error) {
        scriptLog.error(`脚本初始化错误: ${error.message}`);
        if (error.stack) {
            scriptLog.debug('错误堆栈:', error.stack);
        }
    }
}
