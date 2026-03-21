// ============================================================
// post.js - Individual post page
// ============================================================

let allPosts = [];

document.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  setupDraggableWindow();
  maximizeWindow();
  await loadPost();
});

// ------------------------------------------------------------
// Load post from URL param ?id=post-id
// ------------------------------------------------------------

async function loadPost() {
  const params = new URLSearchParams(location.search);
  const postId = params.get('id');

  if (!postId) {
    showError('未指定文章 ID，请从<a href="index.html">首页</a>选择文章。');
    return;
  }

  setStatus('正在连接...');
  document.getElementById('address-input').value = decodeURIComponent(location.href);

  try {
    // Fetch the post content and all posts metadata in parallel
    const [rawMd, posts] = await Promise.all([
      fetch(`posts/${postId}.md`).then(r => {
        if (!r.ok) throw new Error(`文章文件 HTTP ${r.status}`);
        return r.text();
      }),
      fetchAllPostsMeta(),
    ]);

    allPosts = posts;
    const { frontmatter, body } = parseFrontmatter(rawMd);
    const currentMeta = allPosts.find(p => p.id === postId) || frontmatter;

    renderPost(currentMeta, body, postId);
    renderSidebar(currentMeta);
    renderToc();
    setStatus('完成');
  } catch (err) {
    showError(`无法加载文章。<br><small>${escapeHtml(err.message)}</small>`);
    setStatus('页面加载出错');
  }
}

async function fetchAllPostsMeta() {
  // Try index.json first (GitHub Pages compatible)
  try {
    const indexRes = await fetch('posts/index.json');
    if (indexRes.ok) {
      const posts = await indexRes.json();
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return posts;
    }
  } catch (_) {}

  // Fallback: directory listing (local Python HTTP server)
  const dirRes = await fetch('posts/');
  if (!dirRes.ok) return [];
  const html = await dirRes.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const filenames = [...doc.querySelectorAll('a[href]')]
    .map(a => decodeURIComponent(a.getAttribute('href')))
    .filter(href => href.endsWith('.md'));

  const posts = await Promise.all(filenames.map(async fname => {
    const id = fname.replace(/\.md$/, '');
    const dateMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
    const fallbackDate = dateMatch ? dateMatch[1] : '2000-01-01';
    const res = await fetch(`posts/${fname}`);
    const content = await res.text();
    const { frontmatter } = parseFrontmatter(content);
    return {
      id,
      title: frontmatter.title || id,
      date: normalizeDate(frontmatter.date) || fallbackDate,
      tags: frontmatter.tags || [],
    };
  }));

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// ------------------------------------------------------------
// Parse YAML-ish frontmatter
// ------------------------------------------------------------

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const metaStr = match[1];
  const body = match[2];
  const frontmatter = {};

  metaStr.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    // Handle array syntax: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      frontmatter[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      frontmatter[key] = val;
    }
  });

  return { frontmatter, body };
}

// ------------------------------------------------------------
// Render
// ------------------------------------------------------------

function renderPost(meta, body, postId) {
  const title = meta?.title || '无标题';
  const date = meta?.date ? formatDate(meta.date) : '';
  const tags = meta?.tags || [];

  // Update page title + window title
  document.title = `${title} - 三之的博客`;
  document.getElementById('window-title').textContent = `${title} - Windows Internet Explorer`;

  // Find prev/next
  const idx = allPosts.findIndex(p => p.id === postId);
  const prevPost = idx > 0 ? allPosts[idx - 1] : null;
  const nextPost = idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null;

  // Configure marked with highlight.js for syntax highlighting
  marked.use({
    breaks: true,
    gfm: true,
    renderer: {
      code(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(code, { language }).value;
        const escaped = code.replace(/`/g, '&#96;').replace(/\\/g, '\\\\');
        return `<div class="code-block-wrapper">
          <button class="copy-btn" onclick="copyCode(this)">复制</button>
          <pre><code class="hljs language-${language}">${highlighted}</code></pre>
        </div>`;
      },
    },
  });

  // Strip leading H1 from body — title is already shown in post-header
  const bodyWithoutTitle = body.replace(/^\s*#[^\n]*\n/, '');
  const htmlBody = marked.parse(bodyWithoutTitle);

  const navHtml = `
    <div class="post-nav">
      <a class="post-nav-btn" href="index.html">⬅ 返回列表</a>
      ${nextPost ? `<a class="post-nav-btn" href="post.html?id=${encodeURIComponent(nextPost.id)}">« 较旧: ${escapeHtml(nextPost.title.substring(0,20))}...</a>` : ''}
      ${prevPost ? `<a class="post-nav-btn" href="post.html?id=${encodeURIComponent(prevPost.id)}">较新: ${escapeHtml(prevPost.title.substring(0,20))}... »</a>` : ''}
    </div>`;

  document.getElementById('post-container').innerHTML = `
    <div class="post-header">
      <div class="post-title">${escapeHtml(title)}</div>
      <div class="post-meta">
        <span class="post-meta-item">📅 ${date}</span>
        ${tags.length ? `<span class="post-meta-item">🏷️ ${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</span>` : ''}
      </div>
    </div>
    <div class="post-content">${htmlBody}</div>
    ${navHtml}
  `;
}

function renderSidebar(currentMeta) {
  // Recent posts
  document.getElementById('recent-posts-nav').innerHTML = allPosts.slice(0, 6).map(p =>
    `<a class="xp-sidebar-link" href="post.html?id=${encodeURIComponent(p.id)}"
        style="${currentMeta && p.id === currentMeta.id ? 'font-weight:bold;color:#316ac5' : ''}">
       📄 ${escapeHtml(p.title)}
     </a>`
  ).join('');

  // Tags of current post
  const tags = currentMeta?.tags || [];
  if (tags.length) {
    document.getElementById('post-tags-panel').innerHTML =
      `<div style="padding:6px 10px;line-height:2.2">` +
      tags.map(t => `<span class="tag" style="display:inline-block;margin:2px">🏷️ ${escapeHtml(t)}</span>`).join('') +
      `</div>`;
  } else {
    document.getElementById('post-tags-panel').innerHTML =
      `<span class="xp-sidebar-link" style="color:#888">暂无标签</span>`;
  }
}

function renderToc() {
  const headings = [...document.querySelectorAll('#post-container h1, #post-container h2, #post-container h3')];
  if (headings.length < 2) return;

  // Assign anchor IDs
  headings.forEach((h, i) => { if (!h.id) h.id = 'heading-' + i; });

  const minLevel = Math.min(...headings.map(h => parseInt(h.tagName[1])));
  const items = headings.map(h => {
    const level = parseInt(h.tagName[1]);
    const indent = (level - minLevel) * 12;
    const fontSize = level === minLevel ? 13 : 12;
    return `<a class="xp-sidebar-link toc-link" href="#${h.id}"
               data-heading="${h.id}"
               style="padding-left:${8 + indent}px;font-size:${fontSize}px"
               onclick="scrollToHeading(event,'${h.id}')"
             >${escapeHtml(h.textContent)}</a>`;
  }).join('');

  document.getElementById('toc-content').innerHTML = items;
  document.getElementById('toc-panel').style.display = '';

  // Scroll spy
  const scrollEl = document.getElementById('scroll-container');
  scrollEl.addEventListener('scroll', () => {
    const scrollTop = scrollEl.scrollTop + 60;
    let active = headings[0].id;
    headings.forEach(h => { if (h.offsetTop <= scrollTop) active = h.id; });
    document.querySelectorAll('.toc-link').forEach(a => {
      a.classList.toggle('toc-active', a.dataset.heading === active);
    });
  });

  // Sidebar resizable
  const handle = document.getElementById('sidebar-resize-handle');
  const sidebar = document.querySelector('.xp-sidebar');
  if (handle && sidebar) {
    let startX, startW;
    handle.addEventListener('mousedown', e => {
      startX = e.clientX;
      startW = sidebar.offsetWidth;
      handle.classList.add('dragging');
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      e.preventDefault();
    });
    function onDrag(e) {
      const w = Math.max(120, Math.min(400, startW + e.clientX - startX));
      sidebar.style.width = w + 'px';
    }
    function stopDrag() {
      handle.classList.remove('dragging');
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
    }
  }
}

function scrollToHeading(e, id) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(msg) {
  document.getElementById('post-container').innerHTML =
    `<div class="xp-error">⚠️ ${msg}</div>`;
}

// ------------------------------------------------------------
// Window Chrome (same as app.js)
// ------------------------------------------------------------

let isMinimized = false;
let isMaximized = false;

function minimizeWindow() {
  const win = document.getElementById('main-window');
  isMinimized = !isMinimized;
  win.style.display = isMinimized ? 'none' : 'flex';
}

function restoreWindow() {
  const win = document.getElementById('main-window');
  isMinimized = false;
  win.style.display = 'flex';
}

function maximizeWindow() {
  const win = document.getElementById('main-window');
  const btn = document.getElementById('max-btn');
  isMaximized = !isMaximized;
  if (isMaximized) {
    win.style.position = '';
    win.style.left = '';
    win.style.top = '';
    win.style.margin = '';
  }
  win.classList.toggle('maximized', isMaximized);
  btn.innerHTML = isMaximized ? '&#10697;' : '&#9633;';
  btn.title = isMaximized ? '还原' : '最大化';
}

function closeWindow() {
  if (confirm('确定要关闭窗口吗？')) {
    document.getElementById('main-window').style.display = 'none';
  }
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeStartMenu() {
  document.getElementById('start-menu').style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.xp-start-btn') && !e.target.closest('.xp-start-menu')) {
    const menu = document.getElementById('start-menu');
    if (menu) menu.style.display = 'none';
  }
});

function setupDraggableWindow() {
  const win = document.getElementById('main-window');
  const titlebar = document.getElementById('titlebar');
  let isDragging = false, startX, startY, startLeft, startTop;

  titlebar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('xp-title-btn')) return;
    if (isMaximized) return;
    isDragging = true;
    const rect = win.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    win.style.position = 'fixed';
    win.style.left = startLeft + 'px';
    win.style.top = startTop + 'px';
    win.style.margin = '0';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    win.style.left = Math.max(0, startLeft + (e.clientX - startX)) + 'px';
    win.style.top = Math.max(0, startTop + (e.clientY - startY)) + 'px';
  });

  document.addEventListener('mouseup', () => { isDragging = false; });
}

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------

function updateClock() {
  const el = document.getElementById('taskbar-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function setStatus(text) {
  const el = document.getElementById('status-text');
  if (el) el.textContent = text;
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  return String(dateStr).replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');
}

function formatDate(dateStr) {
  const d = new Date(normalizeDate(dateStr));
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function copyCode(btn) {
  const code = btn.nextElementSibling.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '已复制!';
    setTimeout(() => { btn.textContent = '复制'; }, 2000);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
