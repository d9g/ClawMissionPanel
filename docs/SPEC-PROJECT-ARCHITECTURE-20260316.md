# 🏗️ ClawMissionPanel 项目目录架构设计

**创建时间**: 2026-03-16 20:00  
**最后更新**: 2026-03-16 20:00  
**状态**: ✅ 生效中

---

## 📋 文档目的

本文档记录 ClawMissionPanel 项目的完整目录结构、文件服务器架构和文档同步流程。

---

## 🎯 核心规则（第一规则）

**任何操作前必须**:
1. 写计划文档
2. 发布等用户确认
3. 收到确认后再执行
4. 执行后更新文档

---

## 📁 目录结构总览

### 1. 项目代码目录（开发用）

```
<workspace>/task-board/
├── src/                      # 后端源代码
│   ├── server.js            # 主服务
│   ├── dashboard-api.js     # Dashboard API
│   └── ...
├── public/                   # 前端静态文件
│   ├── index.html
│   ├── js/
│   └── css/
├── database/                 # SQLite 数据库
│   └── task-board.db
├── docs/                     # 项目文档（MD 源文件）
│   ├── SPEC-*.md            # 规范文档
│   ├── API-REFERENCE.md     # API 文档
│   └── ...
├── tasks/                    # 任务定义
└── package.json             # 项目配置
```

**用途**: 开发、编辑、版本控制  
**Git 管理**: ✅ 是  
**HTTP 访问**: ❌ 否

---

### 2. HTTP 服务目录（对外服务）

```
$HOME/fileserver/files/          # HTTP 服务根目录
├── task-board/                        # 任务公告板
│   ├── index.html                    # 首页
│   ├── blocked.html                  # 阻塞任务
│   ├── progress.html                 # 进行中任务
│   ├── pending.html                  # 等待中任务
│   ├── completed.html                # 已完成任务
│   ├── docs/                         # 文档（MD + HTML）
│   │   ├── *.md                      # Markdown 源文件
│   │   └── *.html                    # 渲染后的 HTML
│   ├── js/                           # JavaScript
│   └── css/                          # 样式表
│
├── docs/                             # 产品文档
│   ├── *.md                          # Markdown 源文件
│   └── *.html                        # 渲染后的 HTML
│
├── 20260316/                         # 日期目录（每日内容）
│   └── ...
└── articles/                         # 文章目录
    └── ...
```

**用途**: HTTP 服务、对外访问  
**Git 管理**: ❌ 否  
**HTTP 访问**: ✅ 是

---

### 3. 渲染引擎和缓存

```
$HOME/fileserver/
├── renderer.py                       # MD → HTML 渲染引擎
├── server.py                         # HTTP 服务
├── sync-task-board-docs.sh          # 文档同步脚本
├── content/                          # 内容源文件
│   └── *.md
├── cache/                            # 渲染缓存
│   └── html/
│       └── *.html
└── templates/                        # HTML 模板
    └── article.html
```

---

## 🌐 HTTP 服务架构

### Nginx 配置

**配置文件**: `/etc/nginx/conf.d/fileserver.conf`

```nginx
server {
    server_name yun.webyoung.cn;
    
    # 任务公告板 API（反向代理到 Node.js）
    location /task-board/api/ {
        proxy_pass http://localhost:3000/api/;
    }
    
    # 任务公告板静态文件
    location /task-board/ {
        alias /home/admin/fileserver/files/task-board/;
    }
    
    # 产品文档
    location /docs/ {
        alias /home/admin/fileserver/files/docs/;
    }
}
```

### 访问 URL

| 资源 | URL | 物理路径 |
|------|-----|----------|
| 任务板首页 | https://yun.webyoung.cn/task-board/ | `$HOME/fileserver/files/task-board/index.html` |
| 任务板文档 | https://yun.webyoung.cn/task-board/docs/ | `$HOME/fileserver/files/task-board/docs/` |
| 产品文档 | https://yun.webyoung.cn/docs/ | `$HOME/fileserver/files/docs/` |
| API 接口 | https://yun.webyoung.cn/task-board/api/ | `http://localhost:3000/api/` |

---

## 📝 文档同步流程

### 工作流程

```
1. 在 workspace/task-board/docs/ 创建/修改 MD 文档
   ↓
2. 运行渲染脚本（renderer.py 或 sync 脚本）
   ↓
3. 生成 HTML 到 fileserver/files/task-board/docs/
   ↓
4. 同时生成 HTML 到 fileserver/files/docs/（对外访问）
   ↓
5. 用户通过 HTTP 访问 HTML
```

### 同步脚本

**脚本 1**: `sync-task-board-docs.sh`
```bash
#!/bin/bash
SOURCE_DIR="$HOME/fileserver/files/task-board"
TARGET_DIR="/var/www/yun.webyoung.cn/task-board"

# 复制所有 HTML 文件
cp -v "$SOURCE_DIR"/*.html "$TARGET_DIR/"
```

**脚本 2**: `renderer.py` (MD → HTML 渲染)
```bash
# 渲染单个文件
python3 renderer.py render <md_file>

# 预生成所有
python3 renderer.py build-all
```

---

## 🔧 开发工作流

### 开发阶段

```bash
# 1. 在 workspace 开发
cd <workspace>/task-board
# 编辑代码和文档

# 2. 提交到 Git
git add .
git commit -m "feat: xxx"
git push origin master

# 3. 同步到 HTTP 目录
# 手动复制或使用同步脚本
cp docs/*.md $HOME/fileserver/files/task-board/docs/
cp docs/*.html $HOME/fileserver/files/task-board/docs/

# 4. 渲染 HTML
python3 $HOME/fileserver/renderer.py build-all
```

### 发布阶段

```bash
# 1. 确保所有文档已同步到 fileserver
# 2. 运行渲染引擎生成 HTML
# 3. 验证 HTTP 访问
# 4. 提交 Git 标签
```

---

## 📊 文件类型说明

### Markdown 源文件 (.md)

**位置**: 
- `workspace/task-board/docs/` (开发)
- `fileserver/files/task-board/docs/` (HTTP)
- `fileserver/files/docs/` (对外)

**用途**: 文档源文件、版本控制

### HTML 文件 (.html)

**位置**:
- `fileserver/files/task-board/` (HTTP 服务)
- `fileserver/files/task-board/docs/` (文档 HTML)
- `fileserver/files/docs/` (对外访问)

**用途**: HTTP 访问、浏览器渲染

### JavaScript/CSS

**位置**:
- `workspace/task-board/public/js/` (开发)
- `workspace/task-board/public/css/` (开发)
- `fileserver/files/task-board/js/` (HTTP)
- `fileserver/files/task-board/css/` (HTTP)

**用途**: 前端交互和样式

---

## 🎯 最佳实践

### 1. 文档创建流程

```
1. 在 workspace/task-board/docs/ 创建 .md 文件
   ↓
2. 提交 Git
   ↓
3. 复制到 fileserver/files/task-board/docs/
   ↓
4. 运行 renderer.py 生成 HTML
   ↓
5. 验证 HTTP 访问
```

### 2. 代码修改流程

```
1. 在 workspace/task-board/src/ 修改代码
   ↓
2. 测试验证
   ↓
3. 提交 Git
   ↓
4. 重启 Node.js 服务
   ↓
5. 验证 API
```

### 3. 前端修改流程

```
1. 在 workspace/task-board/public/ 修改
   ↓
2. 复制到 fileserver/files/task-board/
   ↓
3. 刷新浏览器验证
   ↓
4. 提交 Git
```

---

## 🚨 注意事项

### 禁止操作

- ❌ 直接修改 fileserver 目录的源文件
- ❌ 跳过 Git 直接发布
- ❌ 不渲染 HTML 直接上传 MD
- ❌ 修改 Nginx 配置不测试

### 必须操作

- ✅ 所有修改先过 Git
- ✅ MD 文档必须渲染成 HTML
- ✅ 发布前验证 HTTP 访问
- ✅ 定期备份 fileserver 目录

---

## 📁 目录清理规则

### 保留目录

- ✅ `workspace/task-board/` - 项目源码
- ✅ `fileserver/files/task-board/` - HTTP 服务
- ✅ `fileserver/files/docs/` - 对外文档
- ✅ `fileserver/cache/` - 渲染缓存

### 可清理目录

- ⚠️ `fileserver/cache/html/` - 可重新生成
- ⚠️ `fileserver/logs/` - 定期清理旧日志

---

## 🔗 相关文档

- [DOCUMENT-RULES.md](./DOCUMENT-RULES.md) - 文档管理规范
- [SPEC-COLLABORATION-RULES-20260316.md](./SPEC-COLLABORATION-RULES-20260316.md) - 协作规范

---

## 💡 架构优势

### 混合架构（推荐）

**优点**:
- ✅ 开发和服务分离
- ✅ 版本控制和 HTTP 服务独立
- ✅ MD 源文件 + HTML 缓存
- ✅ 性能和质量兼顾

**缺点**:
- ⚠️ 需要同步步骤
- ⚠️ 目录较多需管理

---

_目录清晰，协作顺畅！_ 📁☁️
