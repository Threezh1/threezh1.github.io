// ============================================================
// app.js - Blog homepage: article list + pagination
// ============================================================

const POSTS_PER_PAGE = 10;
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
let activeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  setupDraggableWindow();
  const addrInput = document.getElementById('address-input');
  if (addrInput) addrInput.value = location.href;
  await loadPosts();
});

// ------------------------------------------------------------
// Data Loading
// ------------------------------------------------------------

async function loadPosts() {
  setStatus('正在连接...');
  try {
    // 1. Fetch directory listing and extract .md filenames
    const dirRes = await fetch('posts/');
    if (!dirRes.ok) throw new Error(`HTTP ${dirRes.status}`);
    const html = await dirRes.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const filenames = [...doc.querySelectorAll('a[href]')]
      .map(a => decodeURIComponent(a.getAttribute('href')))
      .filter(href => href.endsWith('.md'));

    if (filenames.length === 0) throw new Error('posts/ 目录中未找到任何 .md 文件');

    // 2. Fetch all .md files in parallel and parse frontmatter
    allPosts = await Promise.all(filenames.map(fetchPostMeta));

    // Sort newest first
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    filteredPosts = allPosts;
    renderPosts(1);
    renderSidebar();
    setStatus('完成');
  } catch (err) {
    document.getElementById('blog-content').innerHTML =
      `<div class="xp-error">
        ⚠️ <strong>无法加载文章列表</strong><br><br>
        请通过本地 HTTP 服务器访问本博客，例如：<br>
        <code style="background:#fff;padding:2px 6px;border:1px solid #ccc">python3 -m http.server</code>
        <br><br><small>错误详情: ${escapeHtml(err.message)}</small>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    setStatus('页面加载出错');
  }
}

async function fetchPostMeta(filename) {
  const postId = filename.replace(/\.md$/, '');
  const dateMatch = postId.match(/^(\d{4}-\d{2}-\d{2})/);
  const fallbackDate = dateMatch ? dateMatch[1] : '2000-01-01';

  const res = await fetch(`posts/${filename}`);
  const content = await res.text();
  const fm = parsePostFrontmatter(content);

  return {
    id: postId,
    title: fm.title || postId,
    date: normalizeDate(fm.date) || fallbackDate,
    tags: fm.tags || [],
    summary: fm.summary || '',
  };
}

function parsePostFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      fm[key] = val;
    }
  });
  return fm;
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

function renderPosts(page) {
  currentPage = page;
  const start = (page - 1) * POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

  const container = document.getElementById('blog-content');

  if (pagePosts.length === 0) {
    container.innerHTML = '<div class="xp-loading">📭 暂无文章</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const filterBar = activeTag
    ? `<div style="margin-bottom:8px;font-size:12px;color:#444;padding:4px 0">
         🏷️ 标签: <strong>${escapeHtml(activeTag)}</strong>
         &nbsp;<a href="#" onclick="filterByTag(null);return false" style="color:#0000cc">[清除]</a>
       </div>`
    : '';

  const rows = pagePosts.map(post => {
    const tags = (post.tags || []).map(t =>
      `<span class="tag" onclick="event.preventDefault();filterByTag('${escapeHtml(t)}')" style="cursor:pointer">${escapeHtml(t)}</span>`
    ).join('');
    return `
    <a class="article-item" href="post.html?id=${encodeURIComponent(post.id)}">
      <div class="article-item-top">
        <span class="article-title-link">${escapeHtml(post.title)}</span>
        <span class="article-date">${formatDate(post.date)}</span>
      </div>
      ${post.summary ? `<div class="article-summary">${escapeHtml(post.summary)}</div>` : ''}
      ${tags ? `<div class="article-tags">${tags}</div>` : ''}
    </a>`;
  }).join('');

  container.innerHTML = filterBar + `<div class="article-list">${rows}</div>`;

  renderPagination(page);
}

function renderPagination(page) {
  const total = filteredPosts.length;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  const container = document.getElementById('pagination');

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';

  // Prev
  html += page > 1
    ? `<button class="xp-page-btn" onclick="changePage(${page - 1})">« 上一页</button>`
    : `<button class="xp-page-btn disabled">« 上一页</button>`;

  // Page numbers with ellipsis
  for (let i = 1; i <= totalPages; i++) {
    if (i === page) {
      html += `<button class="xp-page-btn current">${i}</button>`;
    } else if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="xp-page-btn" onclick="changePage(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<span style="padding:0 2px;color:#888">…</span>`;
    }
  }

  // Next
  html += page < totalPages
    ? `<button class="xp-page-btn" onclick="changePage(${page + 1})">下一页 »</button>`
    : `<button class="xp-page-btn disabled">下一页 »</button>`;

  html += `<span class="pagination-info">第 ${page} / ${totalPages} 页，共 ${total} 篇</span>`;
  container.innerHTML = html;
}

function renderSidebar() {
  // Recent posts
  const recent = allPosts.slice(0, 6);
  document.getElementById('recent-posts-nav').innerHTML = recent.map(p =>
    `<a class="xp-sidebar-link" href="post.html?id=${encodeURIComponent(p.id)}">📄 ${escapeHtml(p.title)}</a>`
  ).join('');

  // Tags cloud
  const tagCount = {};
  allPosts.forEach(p => (p.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));

  const tagsHtml = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) =>
      `<span class="tag" onclick="filterByTag('${escapeHtml(tag)}')"
             style="cursor:pointer;display:inline-block;margin:2px 3px">
         🏷️ ${escapeHtml(tag)}<sup style="font-size:9px;color:#888">${count}</sup>
       </span>`
    ).join('');
  document.getElementById('tags-cloud').innerHTML =
    `<div style="padding:6px 10px;line-height:2">${tagsHtml}</div>`;
}

// ------------------------------------------------------------
// Interactions
// ------------------------------------------------------------

function changePage(page) {
  renderPosts(page);
  document.getElementById('scroll-container').scrollTop = 0;
}

function filterByTag(tag) {
  activeTag = tag;
  filteredPosts = tag ? allPosts.filter(p => (p.tags || []).includes(tag)) : allPosts;
  renderPosts(1);
  document.getElementById('scroll-container').scrollTop = 0;
}

// ------------------------------------------------------------
// Window Chrome
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
  win.classList.toggle('maximized', isMaximized);
  btn.innerHTML = isMaximized ? '&#10697;' : '&#9633;';
  btn.title = isMaximized ? '还原' : '最大化';
}

function closeWindow() {
  if (confirm('确定要关闭浏览器吗？')) {
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

// ------------------------------------------------------------
// Draggable Window
// ------------------------------------------------------------

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
    const dx = e.clientX - startX, dy = e.clientY - startY;
    win.style.left = Math.max(0, startLeft + dx) + 'px';
    win.style.top = Math.max(0, startTop + dy) + 'px';
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

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
