#!/usr/bin/env node
/**
 * Markdown 转 HTML 生成器
 * 将 docs 目录下的 MD 文件转换为美观的 HTML 页面
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = '/home/admin/fileserver/files/docs';

// 简化的 Markdown 转 HTML 函数
function markdownToHtml(md) {
  let html = md;
  
  // 第一步：将 Markdown 中的绝对 URL 转换为相对路径 (在代码块之前处理)
  html = html.replace(/https?:\/\/yun\.webyoung\.cn/g, '');
  
  // 代码块 ```code``` → <pre><code>code</code></pre>
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 行内代码 `code` → <code>code</code>
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 标题 # → <h1>
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  
  // 粗体 **text** → <strong>text</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 斜体 *text* → <em>text</em>
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 链接 [text](url) → <a href="url">text</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // 将绝对 URL 转换为相对路径
    let relativeUrl = url
      .replace(/https?:\/\/yun\.webyoung\.cn/g, '')
      .replace(/https?:\/\/[\w.-]+/g, ''); // 通用替换任何域名
    return `<a href="${relativeUrl}" target="_blank">${text}</a>`;
  });
  
  // 图片 ![alt](url) → <img src="url" alt="alt">
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  
  // 无序列表 - item → <li>item</li>
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
  
  // 有序列表 1. item → <li>item</li>
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // 引用 > text → <blockquote>text</blockquote>
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // 表格处理 (必须在段落处理之前！)
  const lines = html.split('\n');
  const processedLines = [];
  let inTable = false;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 检测表格行 (以 | 开头和结尾，且包含至少一个 | 在中间)
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.indexOf('|', 1) < trimmedLine.length - 1) {
      // 跳过分隔行 (|---|---| 或 | :---: | 等)
      if (!trimmedLine.match(/^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|$/)) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        const cells = trimmedLine.slice(1, -1).split('|');
        const cellType = tableRows.length === 0 ? 'th' : 'td';
        const rowCells = cells.map(cell => {
          const content = cell.trim();
          // 处理粗体
          const processed = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          return `<${cellType}>${processed}</${cellType}>`;
        }).join('');
        tableRows.push(`<tr>${rowCells}</tr>`);
      }
    } else {
      // 非表格行，输出之前的表格 (如果有)
      if (inTable && tableRows.length > 0) {
        processedLines.push('<table>' + tableRows.join('') + '</table>');
        inTable = false;
        tableRows = [];
      }
      processedLines.push(line);
    }
  }
  
  // 处理末尾的表格
  if (inTable && tableRows.length > 0) {
    processedLines.push('<table>' + tableRows.join('') + '</table>');
  }
  
  html = processedLines.join('\n');
  
  // 段落处理 (在表格处理之后)
  html = html.replace(/\n\n+/g, '</p><p>');
  
  // 最后处理：将代码块和文本中的绝对 URL 转换为相对路径
  // 但保留代码块内的内容不变 (已经 escape 过了)
  html = html.replace(/(href="|src=")https?:\/\/[\w.-]+/g, (match, attr) => {
    return match.replace(/https?:\/\/[\w.-]+/, '');
  });
  
  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHtmlPage(title, content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 60px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 20px; font-size: 2.5em; }
        h2 { color: #5568d3; margin: 40px 0 20px; font-size: 1.8em; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h3 { color: #444; margin: 30px 0 15px; font-size: 1.4em; }
        h4 { color: #555; margin: 25px 0 10px; font-size: 1.2em; }
        p { margin: 15px 0; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f6f8fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 20px 0;
            color: #555;
            background: #f9f9f9;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
        }
        ul, ol { margin: 15px 0 15px 30px; }
        li { margin: 8px 0; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #667eea;
            color: white;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 30px 0;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #667eea;
            text-decoration: none;
            padding: 8px 16px;
            background: #f0f0f0;
            border-radius: 8px;
        }
        .back-link:hover {
            background: #e0e0e0;
            text-decoration: none;
        }
        .meta {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
            border-radius: 8px;
        }
        strong {
            color: #333;
            font-weight: 600;
        }
        em {
            color: #555;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/docs/" class="back-link">← 返回文档中心</a>
        <div class="content">
            ${content}
        </div>
    </div>
</body>
</html>`;
}

// 主函数
function main() {
  console.log('📚 开始生成 HTML 文档...\n');
  
  const files = fs.readdirSync(DOCS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  let converted = 0;
  let errors = 0;
  
  mdFiles.forEach(file => {
    const mdPath = path.join(DOCS_DIR, file);
    const baseName = path.basename(file, '.md');
    const htmlPath = path.join(DOCS_DIR, `${baseName}.html`);
    
    try {
      const mdContent = fs.readFileSync(mdPath, 'utf-8');
      
      // 提取标题 (第一个 # 标题)
      const titleMatch = mdContent.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : baseName;
      
      // 转换 Markdown 到 HTML
      const htmlContent = markdownToHtml(mdContent);
      
      // 生成完整 HTML 页面
      const htmlPage = generateHtmlPage(title, htmlContent);
      
      // 写入文件
      fs.writeFileSync(htmlPath, htmlPage, 'utf-8');
      
      console.log(`✅ ${file} → ${baseName}.html`);
      converted++;
    } catch (error) {
      console.error(`❌ ${file} 转换失败：${error.message}`);
      errors++;
    }
  });
  
  console.log(`\n📊 转换完成:`);
  console.log(`  成功：${converted} 个`);
  console.log(`  失败：${errors} 个`);
  console.log(`\n🔗 访问地址：https://yun.webyoung.cn/docs/`);
}

main();
