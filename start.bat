@echo off
echo ========================================
echo   DSH模型搜索插件 - 启动和测试脚本
echo ========================================
echo.

echo 请选择要执行的操作：
echo 1. 打开插件测试页面
echo 2. 打开示例页面
echo 3. 构建插件
echo 4. 查看使用文档
echo 5. 查看安装指南
echo 6. 退出
echo.

set /p choice="请输入选项 (1-6): "

if "%choice%"=="1" (
    echo 正在打开插件测试页面...
    start test.html
    goto :end
)

if "%choice%"=="2" (
    echo 正在打开示例页面...
    start example/index.html
    goto :end
)

if "%choice%"=="3" (
    echo 正在构建插件...
    node scripts/build-plugin.js
    echo.
    pause
    goto :end
)

if "%choice%"=="4" (
    echo 正在打开使用文档...
    start USAGE.md
    goto :end
)

if "%choice%"=="5" (
    echo 正在打开安装指南...
    start install.md
    goto :end
)

if "%choice%"=="6" (
    echo 退出...
    goto :end
)

echo 无效选项，请重新运行脚本。
pause

:end
echo.
echo 脚本执行完成！
echo 插件文件位置:
echo   - lib/client.js   (DSH __ModuleLoader__ 格式)
echo   - dist/dsh-model-search-plugin.js (独立脚本，可通过 script 标签加载)
echo.
pause