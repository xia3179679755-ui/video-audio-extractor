# 音轨提取器

一个在浏览器本地从视频中提取音频的静态网页工具，支持 MP3、WAV 与 AAC 导出。

## GitHub Pages 发布

将本目录推送到 GitHub 仓库的默认分支后，在仓库 **Settings → Pages** 中选择 **Deploy from a branch**，并将分支设为 `main`、文件夹设为 `/(root)`。保存后，GitHub 会提供公开访问链接。

FFmpeg 转码组件已随项目保存，转换时不需要网络；视频文件也不会上传。请通过本地 HTTP 服务或 GitHub Pages 打开页面，不能直接双击 `index.html`。

## Windows 便携版

运行 `build-windows-app.ps1` 后会生成 `dist/AudioExtractor.exe`。双击该文件会启动本地离线服务并自动打开工具页面；关闭启动器窗口则停止服务。
