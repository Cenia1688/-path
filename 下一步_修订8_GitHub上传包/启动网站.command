#!/bin/zsh
set -eu
APP_DIRECTORY="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$APP_DIRECTORY"
if command -v node >/dev/null 2>&1; then
  CAREER_NODE="$(command -v node)"
elif [ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]; then
  CAREER_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
else
  print '请先安装 Node.js 24 LTS，然后重新打开本文件。'
  read '?按回车关闭'
  exit 1
fi
export PORT="${PORT:-3001}"
print "网站启动后，在浏览器打开 http://localhost:$PORT"
print '请保留此窗口；按 Control+C 可以停止服务。'
"$CAREER_NODE" --env-file-if-exists=.env server.mjs
