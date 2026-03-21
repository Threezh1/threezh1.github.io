document.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  setupDraggableWindow();
  maximizeWindow();
  document.getElementById('address-input').value = decodeURIComponent(location.href);

  marked.use({
    breaks: true,
    gfm: true,
    renderer: {
      code(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(code, { language }).value;
        return `<div class="code-block-wrapper">
          <button class="copy-btn" onclick="copyCode(this)">复制</button>
          <pre><code class="hljs language-${language}">${highlighted}</code></pre>
        </div>`;
      },
    },
  });

  try {
    const res = await fetch('about.md');
    if (!res.ok) throw new Error('about.md 未找到');
    const md = await res.text();
    const html = marked.parse(md);
    document.getElementById('about-container').innerHTML =
      `<div class="post-header">
         <div class="post-title">👤 关于三之</div>
       </div>
       <div class="post-content" style="max-width:860px;margin:0 auto">${html}</div>`;
    document.getElementById('status-text').textContent = '完成';
  } catch (err) {
    document.getElementById('about-container').innerHTML =
      `<div class="xp-error">⚠️ 无法加载 about.md<br><small>${err.message}</small></div>`;
    document.getElementById('status-text').textContent = '页面加载出错';
  }
});

// ---- Window Chrome ----
let isMinimized = false, isMaximized = false;

function minimizeWindow() {
  const win = document.getElementById('main-window');
  isMinimized = !isMinimized;
  win.style.display = isMinimized ? 'none' : 'flex';
}
function restoreWindow() {
  document.getElementById('main-window').style.display = 'flex';
  isMinimized = false;
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
  const m = document.getElementById('start-menu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function closeStartMenu() {
  document.getElementById('start-menu').style.display = 'none';
}
document.addEventListener('click', e => {
  if (!e.target.closest('.xp-start-btn') && !e.target.closest('.xp-start-menu')) {
    const m = document.getElementById('start-menu');
    if (m) m.style.display = 'none';
  }
});

function setupDraggableWindow() {
  const win = document.getElementById('main-window');
  const titlebar = document.getElementById('titlebar');
  let isDragging = false, startX, startY, startLeft, startTop;
  titlebar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('xp-title-btn') || isMaximized) return;
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
    win.style.left = Math.max(0, startLeft + e.clientX - startX) + 'px';
    win.style.top = Math.max(0, startTop + e.clientY - startY) + 'px';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });
}

function updateClock() {
  const el = document.getElementById('taskbar-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function copyCode(btn) {
  const code = btn.nextElementSibling.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '已复制!';
    setTimeout(() => { btn.textContent = '复制'; }, 2000);
  });
}
