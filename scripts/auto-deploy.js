#!/usr/bin/env node
/**
 * 任务板自动部署脚本
 * 
 * 功能：将开发目录的文件自动同步到 HTTP 可访问目录
 * 触发时机：文件修改后自动调用
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  srcDir: '/home/admin/.openclaw/workspace/task-board/public',
  destDir: '/home/admin/fileserver/files/task-board',
  watchPatterns: ['*.html', 'js/*.js', 'css/*.css']
};

/**
 * 复制文件
 */
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`✅ ${path.relative(CONFIG.srcDir, src)} → ${path.relative(CONFIG.destDir, dest)}`);
    return true;
  } catch (error) {
    console.error(`❌ 复制失败 ${src}:`, error.message);
    return false;
  }
}

/**
 * 复制目录
 */
function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * 部署所有文件
 */
function deploy() {
  console.log('🚀 开始部署任务板文件...\n');
  
  let deployed = 0;
  let failed = 0;
  
  // 复制 HTML 文件
  const htmlFiles = fs.readdirSync(CONFIG.srcDir).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const result = copyFile(
      path.join(CONFIG.srcDir, file),
      path.join(CONFIG.destDir, file)
    );
    if (result) deployed++;
    else failed++;
  }
  
  // 复制 JS 文件
  const jsDir = path.join(CONFIG.srcDir, 'js');
  const jsDestDir = path.join(CONFIG.destDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    for (const file of jsFiles) {
      const result = copyFile(
        path.join(jsDir, file),
        path.join(jsDestDir, file)
      );
      if (result) deployed++;
      else failed++;
    }
  }
  
  // 复制 CSS 文件
  const cssDir = path.join(CONFIG.srcDir, 'css');
  const cssDestDir = path.join(CONFIG.destDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    for (const file of cssFiles) {
      const result = copyFile(
        path.join(cssDir, file),
        path.join(cssDestDir, file)
      );
      if (result) deployed++;
      else failed++;
    }
  }
  
  console.log(`\n📊 部署完成：${deployed} 个文件成功，${failed} 个文件失败`);
}

/**
 * 监听文件变化并自动部署
 */
function watch() {
  const chokidar = require('chokidar');
  
  console.log('👀 开始监听文件变化...\n');
  
  const watcher = chokidar.watch(CONFIG.srcDir, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });
  
  watcher
    .on('add', filePath => {
      console.log(`📄 新文件：${path.relative(CONFIG.srcDir, filePath)}`);
      deployFile(filePath);
    })
    .on('change', filePath => {
      console.log(`📝 文件更新：${path.relative(CONFIG.srcDir, filePath)}`);
      deployFile(filePath);
    })
    .on('unlink', filePath => {
      console.log(`🗑️ 文件删除：${path.relative(CONFIG.srcDir, filePath)}`);
      // 可以选择删除目标文件
    });
  
  return watcher;
}

/**
 * 部署单个文件
 */
function deployFile(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  const destPath = path.join(CONFIG.destDir, relativePath);
  
  // 确保目标目录存在
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  copyFile(filePath, destPath);
}

// 命令行调用
if (process.argv[2] === '--watch') {
  deploy(); // 先部署一次
  watch();
  console.log('\n✅ 监听服务已启动，按 Ctrl+C 停止\n');
} else {
  deploy();
}

module.exports = { deploy, deployFile };
