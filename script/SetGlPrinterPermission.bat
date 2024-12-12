@echo off

:: 设置控制台为 UTF-8 编码
chcp 65001 >nul

:: 确保以管理员权限运行
whoami /groups | find "S-1-5-32-544" >nul || (
    echo 请以管理员权限运行此脚本。
    pause
    exit /b
)

:: 设置目标目录
set "TARGET_PATH=C:\Program Files\GlPrinter"

:: 检查目录是否存在，不存在则创建
if not exist "%TARGET_PATH%" (
    mkdir "%TARGET_PATH%"
    echo [%date% %time%] 已创建目录：%TARGET_PATH%
) else (
    echo [%date% %time%] 目录已存在：%TARGET_PATH%
)

:: 为目录添加Everybody完全控制权限
icacls "%TARGET_PATH%" /grant Everyone:(OI)(CI)F /T
if %errorlevel% equ 0 (
    echo [%date% %time%] 已成功为 %TARGET_PATH% 设置 Everybody 的完全控制权限。
) else (
    echo [%date% %time%] 设置权限时发生错误，请检查是否有足够的权限。
    pause
    exit /b
)

:: 创建完成标记文件
echo %date% %time% > "%TARGET_PATH%\gl_printer_permission_complete.txt"
echo [%date% %time%] 权限设置完成，已创建标记文件。

:: 保持命令行窗口打开，以便查看输出信息
pause


