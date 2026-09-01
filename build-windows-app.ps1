$ErrorActionPreference = 'Stop'

$toolPath = Join-Path $PSScriptRoot '.build-tools'
$env:PYTHONPATH = $toolPath

$arguments = @(
  '--noconfirm',
  '--clean',
  '--onefile',
  '--noconsole',
  '--name', 'AudioExtractor',
  '--add-data', 'index.html;.',
  '--add-data', 'styles.css;.',
  '--add-data', 'app.js;.',
  '--add-data', 'ffmpeg;ffmpeg',
  'launcher.py'
)

& py (Join-Path $toolPath 'PyInstaller\__main__.py') @arguments
