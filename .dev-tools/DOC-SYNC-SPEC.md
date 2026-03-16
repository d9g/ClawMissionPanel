# 文档同步规范

**版本**: v1.0  
**创建时间**: 2026-03-14

---

## 📋 文档位置

| 位置 | 路径 | 用途 | HTTP 访问 |
|------|------|------|----------|
| **源目录** | `/home/admin/.openclaw/workspace/task-board/docs/` | 工作区，编辑和保存 | ❌ 不可访问 |
| **发布目录** | `/home/admin/fileserver/files/docs/` | HTTP 服务，对外发布 | ✅ 可访问 |

---

## 🔄 同步流程

### 手动同步

```bash
# 1. 同步 MD 文件并生成 HTML
/home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh

# 2. 生成 HTML 版本
node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

### 自动同步（推荐）

**每次保存新文档后自动执行**:

```bash
# 在保存文档的脚本或工具中添加
source /home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh && node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

---

## 📝 最佳实践

### 1. 文档命名规范

- ✅ 使用大写字母和连字符：`TEAM-MANAGEMENT-SPEC.md`
- ✅ 包含日期：`BUG-FIX-20260313-1620.md`
- ❌ 避免空格和特殊字符

### 2. 文档保存位置

**始终保存到源目录**:
```
/home/admin/.openclaw/workspace/task-board/docs/YOUR-DOC.md
```

**不要直接保存到发布目录**（会被覆盖）

### 3. 访问文档

**MD 版本** (原始格式):
```
https://yun.webyoung.cn/docs/YOUR-DOC.md
```

**HTML 版本** (推荐，美观易读):
```
https://yun.webyoung.cn/docs/YOUR-DOC.html
```

**文档中心首页**:
```
https://yun.webyoung.cn/docs/
```

---

## 🔧 故障排查

### 问题 1: 新文档无法访问

**症状**: 保存文档后，HTTP 无法访问

**解决**:
```bash
# 检查文件是否在源目录
ls -la /home/admin/.openclaw/workspace/task-board/docs/YOUR-DOC.md

# 手动同步
/home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh

# 生成 HTML
node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

### 问题 2: HTML 页面显示异常

**症状**: HTML 页面格式错乱或内容为空

**解决**:
```bash
# 检查 MD 文件是否有效
cat /home/admin/fileserver/files/docs/YOUR-DOC.md

# 重新生成 HTML
node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

### 问题 3: 文档索引未更新

**症状**: 文档中心首页看不到新文档

**解决**:
1. 更新 `/home/admin/fileserver/files/docs/index.html`
2. 在 `docs` 数组中添加新文档条目
3. 强制刷新浏览器 (Ctrl+F5)

---

## 📊 当前统计

| 类型 | 数量 |
|------|------|
| MD 文件 | 52 |
| HTML 文件 | 52 |
| 索引文档 | 15 |

---

## 🎯 自动化建议

### 方案 1: Git Hook (推荐)

在 workspace 目录创建 `.git/hooks/post-commit`:

```bash
#!/bin/bash
/home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh
node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

### 方案 2: 文件监控

使用 `inotifywait` 监控文件变化:

```bash
while inotifywait -e modify,create /home/admin/.openclaw/workspace/task-board/docs/*.md; do
    /home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh
    node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
done
```

### 方案 3: 定时任务

每 5 分钟检查并同步:

```bash
*/5 * * * * /home/admin/.openclaw/workspace/task-board/scripts/sync-docs-to-http.sh && node /home/admin/.openclaw/workspace/task-board/scripts/md-to-html.js
```

---

## ✅ 检查清单

保存新文档后:

- [ ] 文档已保存到源目录 (`/home/admin/.openclaw/workspace/task-board/docs/`)
- [ ] 执行同步脚本 (`sync-docs-to-http.sh`)
- [ ] 生成 HTML 版本 (`md-to-html.js`)
- [ ] 验证 HTTP 访问 (`https://yun.webyoung.cn/docs/YOUR-DOC.html`)
- [ ] 更新文档索引 (`index.html`)

---

_让文档管理自动化，专注于内容创作。_ 📚
