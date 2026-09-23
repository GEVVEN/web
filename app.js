﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿// ===== 全局状态 =====
let currentUser = null;
let __content = [];
let __users = {};
let __games = [];
let __announcements = [];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEvents();
    renderContent();
    // 每5秒自动刷新内容（实时显示通过审核的投稿）
    setInterval(() => {
        const saved = localStorage.getItem('content');
        if (saved) {
            const newContent = JSON.parse(saved);
            if (JSON.stringify(newContent) !== JSON.stringify(__content)) {
                __content = newContent;
                renderContent();
            }
        }
        // 刷新公告
        const savedAnn = localStorage.getItem('announcements');
        if (savedAnn) {
            __announcements = JSON.parse(savedAnn);
            renderAnnouncements();
        }
    }, 5000);
});

// ===== 数据加载 =====
function loadData() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) __users = JSON.parse(savedUsers);

    const savedContent = localStorage.getItem('content');
    if (savedContent) __content = JSON.parse(savedContent);

    const savedGames = localStorage.getItem('customGames');
    if (savedGames) __games = JSON.parse(savedGames);

    const savedAnn = localStorage.getItem('announcements');
    if (savedAnn) __announcements = JSON.parse(savedAnn);

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) currentUser = JSON.parse(savedUser);

    // 加载首页配置
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        if (cfg.navTitle) document.title = cfg.navTitle;
        const logo = document.querySelector('.nav-logo');
        if (logo) logo.textContent = cfg.navTitle || '✨ 欢迎来到这里';
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle && cfg.heroTitle) heroTitle.textContent = cfg.heroTitle;
        const heroSub = document.querySelector('.hero-subtitle-main');
        if (heroSub && cfg.homeSubtitle) heroSub.textContent = cfg.homeSubtitle;
        const heroDesc = document.querySelector('.hero-desc');
        if (heroDesc && cfg.homeDesc) heroDesc.textContent = cfg.homeDesc;
    }
}

// ===== 事件初始化 =====
function initEvents() {
    setupDropZone('dropZoneImg', 'fileInputImg', 'filePreviewImg');

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.modal') && !e.target.closest('.toast')) {
            createFirework(e.clientX, e.clientY);
        }
    });

    // 公告栏：向下滚动时隐藏，回到顶部时显示
    let __annScrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!__annScrollTicking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 60) {
                    hideAnnouncementBar();
                } else {
                    showAnnouncementBar();
                }
                __annScrollTicking = false;
            });
            __annScrollTicking = true;
        }
    });

    // 点击导航锚点时，回到顶部后恢复公告栏
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                const navH = document.querySelector('.navbar').offsetHeight + 12;
                const top = target.offsetTop - navH;
                window.scrollTo({ top, behavior: 'smooth' });
                // 导航到新板块后隐藏公告，回到顶部再恢复
                setTimeout(hideAnnouncementBar, 400);
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s ease-out';
        observer.observe(section);
    });
}

// ===== 渲染内容 =====
function renderContent() {
    const websites = __content.filter(item => item.type === 'website' && item.status === 'approved');
    renderContentGrid('resources-websites', websites, 'website');

    const wallpapers = __content.filter(item => item.type === 'wallpaper' && item.status === 'approved');
    renderContentGrid('resources-wallpapers', wallpapers, 'wallpaper');

    const tutorials = __content.filter(item => item.type === 'tutorial' && item.status === 'approved');
    renderTutorials(tutorials);

    const tools = __content.filter(item => item.type === 'tool' && item.status === 'approved');
    renderTools(tools);

    renderGames();
    renderAnnouncements();
}

function renderContentGrid(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        const emptyText = type === 'website' ? '暂无网页分享' : '暂无壁纸分享';
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p class="empty-text">${emptyText}</p></div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="content-card" onclick="openDetail(${item.id})" style="cursor:pointer;">
            ${item.coverImage ? `<img src="${escapeHtml(item.coverImage)}" class="content-card-image" alt="${escapeHtml(item.title)}">` :
              (item.images && item.images.length > 0 ? `<img src="${escapeHtml(item.images[0])}" class="content-card-image" alt="${escapeHtml(item.title)}">` : '')}
            <div class="content-card-body">
                <h4 class="content-card-title">${escapeHtml(item.title)}</h4>
                <p class="content-card-desc">${escapeHtml((item.description || '').substring(0, 80))}${(item.description || '').length > 80 ? '...' : ''}</p>
                ${type === 'website' && item.link ? `<span class="glass-btn" style="display:inline-block;text-decoration:none;font-size:12px;padding:4px 10px;">🔗 点击访问</span>` : ''}
                ${type === 'tool' && item.downloadLink ? `<a href="${escapeHtml(item.downloadLink)}" download class="glass-btn primary-btn" style="text-decoration:none;display:inline-block;margin-top:6px;font-size:12px;">📥 下载软件</a>` : ''}
            </div>
        </div>
    `).join('');
}

function renderTutorials(items) {
    const container = document.getElementById('tutorials-content');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📖</div><p class="empty-text">暂无教程</p><p class="empty-subtext">点击右上角投稿按钮分享你的优质教程</p></div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="content-card" onclick="openDetail(${item.id})" style="cursor:pointer;margin-bottom:20px;">
            ${item.coverImage ? `<img src="${escapeHtml(item.coverImage)}" class="content-card-image" alt="${escapeHtml(item.title)}">` :
              (item.images && item.images.length > 0 ? `<img src="${escapeHtml(item.images[0])}" class="content-card-image" alt="${escapeHtml(item.title)}">` : '')}
            <div class="content-card-body">
                <h4 class="content-card-title">${escapeHtml(item.title)}</h4>
                <p class="content-card-desc">${escapeHtml((item.content || item.description || '').substring(0, 100))}${((item.content || item.description || '')).length > 100 ? '...' : ''}</p>
                <p class="empty-subtext">投稿人: ${escapeHtml(item.author)} · ${new Date(item.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
        </div>
    `).join('');
}

function renderTools(items) {
    const container = document.getElementById('tools-content');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><p class="empty-text">暂无工具</p><p class="empty-subtext">点击右上角投稿按钮分享你的实用工具</p></div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="content-card" onclick="openDetail(${item.id})" style="cursor:pointer;">
            ${item.coverImage ? `<img src="${escapeHtml(item.coverImage)}" class="content-card-image" alt="${escapeHtml(item.title)}">` :
              (item.images && item.images.length > 0 ? `<img src="${escapeHtml(item.images[0])}" class="content-card-image" alt="${escapeHtml(item.title)}">` : '')}
            <div class="content-card-body">
                <h4 class="content-card-title">${escapeHtml(item.title)}</h4>
                <p class="content-card-desc">${escapeHtml((item.description || '').substring(0, 80))}${(item.description || '').length > 80 ? '...' : ''}</p>
                ${item.downloadLink ? `<a href="${escapeHtml(item.downloadLink)}" download class="glass-btn primary-btn" style="text-decoration:none;display:inline-block;margin-top:6px;font-size:12px;">📥 下载软件</a>` : ''}
            </div>
        </div>
    `).join('');
}

function renderGames() {
    const container = document.getElementById('gamesContainer');
    if (!container) return;

    const defaultGames = [
        { id: 'tetris', name: '俄罗斯方块', emoji: '🧩', desc: '经典益智游戏', tag: '益智', url: 'game.html?game=tetris' },
        { id: 'snake', name: '贪吃蛇', emoji: '🐍', desc: '经典街机游戏', tag: '街机', url: 'game.html?game=snake' },
        { id: 'solitaire', name: '纸牌接龙', emoji: '🃏', desc: '经典 Klondike 接龙', tag: '棋牌', url: 'game.html?game=solitaire' },
        { id: 'spider', name: '蜘蛛纸牌', emoji: '🕷️', desc: '单色蜘蛛接龙', tag: '棋牌', url: 'game.html?game=spider' }
    ];

    const customGames = __games.filter(g => g.status === 'approved');
    const allGames = [...defaultGames, ...customGames];

    container.innerHTML = allGames.map(game => {
        let href = 'game.html';
        if (game.url && game.url.startsWith('http')) {
            href += '?url=' + encodeURIComponent(game.url);
        } else {
            href += '?game=' + escapeHtml(game.id || game.name);
        }
        return `
        <a href="${href}" class="game-card">
            <div class="game-card-icon">${escapeHtml(game.emoji || '🎮')}</div>
            <h3 class="game-card-title">${escapeHtml(game.name)}</h3>
            <p class="game-card-desc">${escapeHtml(game.desc || game.description || '')}</p>
            <span class="game-card-tag">${escapeHtml(game.tag || '游戏')}</span>
        </a>`;
    }).join('');
}

// ===== 详情页弹窗 =====
function openDetail(id) {
    const item = __content.find(c => c.id === id);
    if (!item) return;

    const overlay = document.getElementById('detailOverlay');
    if (!overlay) return;

    let mediaHtml = '';
    if (item.coverImage) {
        mediaHtml = `<img src="${escapeHtml(item.coverImage)}" style="max-width:100%;max-height:300px;border-radius:12px;margin-bottom:12px;">`;
    } else if (item.images && item.images.length > 0) {
        mediaHtml = item.images.map(img => `<img src="${escapeHtml(img)}" style="max-width:100%;max-height:250px;border-radius:12px;margin-bottom:8px;">`).join('');
    }

    let videoHtml = '';
    const videos = (item.videos || []);
    if (videos.length > 0) {
        videoHtml = `<div style="margin:12px 0;"><video src="${escapeHtml(videos[0])}" controls style="max-width:100%;border-radius:12px;"></video></div>`;
    }

    let filesHtml = '';
    if (item.files && item.files.length > 0) {
        filesHtml = item.files.map(f => `
            <div style="padding:8px 12px;background:rgba(255,255,255,0.3);border-radius:8px;margin-bottom:6px;font-size:13px;">
                📎 ${escapeHtml(f.name)}
                ${f.url ? `<a href="${escapeHtml(f.url)}" download class="glass-btn" style="margin-left:8px;font-size:11px;padding:2px 8px;text-decoration:none;">下载</a>` : ''}
            </div>
        `).join('');
    }

    const date = new Date(item.createdAt).toLocaleString('zh-CN');

    overlay.querySelector('#detailTitle').textContent = item.title;
    overlay.querySelector('#detailAuthor').textContent = `投稿人: ${escapeHtml(item.author)} · ${date}`;
    overlay.querySelector('#detailMedia').innerHTML = mediaHtml + videoHtml;
    overlay.querySelector('#detailDesc').textContent = item.description || '';
    overlay.querySelector('#detailContent').textContent = item.content || '';
    overlay.querySelector('#detailLink').innerHTML = item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener" class="glass-btn primary-btn" style="text-decoration:none;display:inline-block;">🔗 访问网站</a>` : '';
    overlay.querySelector('#detailFiles').innerHTML = filesHtml;
    overlay.classList.add('active');
}

function closeDetail() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.remove('active');
}

// ===== 公告栏 =====
let __annScrolling = false;
let __annHideTimer = null;

function renderAnnouncements() {
    const container = document.getElementById('announcementBar');
    if (!container) return;

    const active = __announcements.filter(a => a.status === 'active');
    if (active.length === 0) {
        container.style.display = 'none';
        document.body.classList.remove('announcement-active');
        __annScrolling = false;
        return;
    }

    const text = active.map(a => escapeHtml(a.content)).join('　|　');
    const textLen = text.length;

    if (container.innerHTML === '' && active.length > 0) {
        // 初次渲染：添加淡入动画
        container.classList.remove('fading-out', 'scrolling');
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 400);
    } else if (container.classList.contains('fading-out')) {
        // 正在隐藏中，不重建内容
        return;
    }

    // 判断是否需要滚动（超过一定长度）
    const needScroll = textLen > 40;
    if (needScroll !== __annScrolling) {
        __annScrolling = needScroll;
        container.classList.toggle('scrolling', needScroll);
    }

    container.style.display = 'flex';
    container.innerHTML = `<span class="ann-scroller">📢 ${text}</span>`;
    container.classList.remove('fading-out');

    document.body.classList.add('announcement-active');
}

function hideAnnouncementBar() {
    const container = document.getElementById('announcementBar');
    if (!container || container.style.display === 'none') return;
    container.classList.remove('fade-in', 'scrolling');
    container.classList.add('fading-out');
    document.body.classList.remove('announcement-active');
    clearTimeout(__annHideTimer);
    __annHideTimer = setTimeout(() => {
        container.style.display = 'none';
        container.classList.remove('fading-out');
    }, 450);
}

function showAnnouncementBar() {
    const container = document.getElementById('announcementBar');
    if (!container) return;
    clearTimeout(__annHideTimer);
    if (container.classList.contains('fading-out')) {
        container.classList.remove('fading-out');
    }
    if (__announcements.some(a => a.status === 'active')) {
        renderAnnouncements();
    }
}

// ===== 投稿系统 =====
let __selectedType = '';

function openSubmitModal(fromSection) {
    if (!currentUser) {
        showToast('请先登录后再投稿', 'error');
        openSignInModal();
        return;
    }

    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.classList.add('active');

        if (fromSection === 'resources') {
            document.getElementById('submitStep1').style.display = 'block';
            document.getElementById('submitStep2').style.display = 'none';
            document.getElementById('backBtnRow').classList.add('hidden');
            document.getElementById('modalTitle').textContent = '📤 投稿资源';
        } else if (fromSection === 'tutorials') {
            __selectedType = 'tutorial';
            document.getElementById('submitStep1').style.display = 'none';
            document.getElementById('submitStep2').style.display = 'block';
            document.getElementById('backBtnRow').classList.add('hidden');
            document.getElementById('modalTitle').textContent = '📚 投稿教程';
            showTutorialFields();
        } else if (fromSection === 'tools') {
            __selectedType = 'tool';
            document.getElementById('submitStep1').style.display = 'none';
            document.getElementById('submitStep2').style.display = 'block';
            document.getElementById('backBtnRow').classList.add('hidden');
            document.getElementById('modalTitle').textContent = '🛠️ 投稿工具';
            showToolFields();
        } else {
            document.getElementById('submitStep1').style.display = 'block';
            document.getElementById('submitStep2').style.display = 'none';
            document.getElementById('backBtnRow').classList.add('hidden');
            document.getElementById('modalTitle').textContent = '📤 投稿';
        }
    }
}

function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    if (modal) modal.classList.remove('active');
    resetSubmitForm();
}

function selectSubmitType(type) {
    __selectedType = type;
    document.getElementById('submitStep1').style.display = 'none';
    document.getElementById('submitStep2').style.display = 'block';
    document.getElementById('backBtnRow').style.display = 'flex';

    const titles = { website: '🌐 网页分享', wallpaper: '🖼️ 图片分享' };
    document.getElementById('submitStep2Title').textContent = titles[type] || '';

    if (type === 'website') showWebsiteFields();
    else if (type === 'wallpaper') showWallpaperFields();
}

function showWebsiteFields() {
    document.getElementById('websiteFields').style.display = 'block';
    document.getElementById('wallpaperFields').style.display = 'none';
    document.getElementById('tutorialFields').style.display = 'none';
    document.getElementById('toolFields').style.display = 'none';
    document.getElementById('labelName').textContent = '网站名称 *';
    document.getElementById('dropHint').textContent = '支持图片展示网站效果（可选，建议上传封面图）';
    document.getElementById('fileHint').textContent = '';
}

function showWallpaperFields() {
    document.getElementById('websiteFields').style.display = 'none';
    document.getElementById('wallpaperFields').style.display = 'block';
    document.getElementById('tutorialFields').style.display = 'none';
    document.getElementById('toolFields').style.display = 'none';
    document.getElementById('labelName').textContent = '图片名称 *';
    document.getElementById('dropHint').textContent = '图片 * 请上传高清壁纸/美图';
    document.getElementById('fileHint').textContent = '* 必传';
}

function showTutorialFields() {
    document.getElementById('websiteFields').style.display = 'none';
    document.getElementById('wallpaperFields').style.display = 'none';
    document.getElementById('tutorialFields').style.display = 'block';
    document.getElementById('toolFields').style.display = 'none';
    document.getElementById('labelName').textContent = '教程名称 *';
    document.getElementById('dropHint').textContent = '支持图片 + 视频（可多选）';
    document.getElementById('fileHint').textContent = '';
}

function showToolFields() {
    document.getElementById('websiteFields').style.display = 'none';
    document.getElementById('wallpaperFields').style.display = 'none';
    document.getElementById('tutorialFields').style.display = 'none';
    document.getElementById('toolFields').style.display = 'block';
    document.getElementById('labelName').textContent = '软件名称 *';
    document.getElementById('dropHint').textContent = '支持图片 + 安装包 (.exe/.apk)';
    document.getElementById('fileHint').textContent = '';
}

function goBackToStep1() {
    document.getElementById('submitStep1').style.display = 'block';
    document.getElementById('submitStep2').style.display = 'none';
    document.getElementById('backBtnRow').classList.add('hidden');
}

function resetSubmitForm() {
    __selectedType = '';
    document.getElementById('submitTitle').value = '';
    document.getElementById('submitDescWebsite').value = '';
    document.getElementById('submitDescWallpaper').value = '';
    document.getElementById('submitDescTutorial').value = '';
    document.getElementById('submitDescTool').value = '';
    document.getElementById('submitLink').value = '';
    document.getElementById('submitContent').value = '';
    document.getElementById('filePreviewImg').innerHTML = '';
    document.getElementById('fileInputImg').value = '';
    document.getElementById('websiteFields').style.display = 'none';
    document.getElementById('wallpaperFields').style.display = 'none';
    document.getElementById('tutorialFields').style.display = 'none';
    document.getElementById('toolFields').style.display = 'none';
    document.getElementById('backBtnRow').classList.add('hidden');
}

function submitContent() {
    if (!currentUser) {
        showToast('请先登录', 'error');
        openSignInModal();
        return;
    }

    const type = __selectedType;
    const title = document.getElementById('submitTitle').value.trim();

    let description = '';
    if (type === 'website') description = (document.getElementById('submitDescWebsite')?.value || '').trim();
    else if (type === 'wallpaper') description = (document.getElementById('submitDescWallpaper')?.value || '').trim();
    else if (type === 'tutorial') description = (document.getElementById('submitDescTutorial')?.value || '').trim();
    else if (type === 'tool') description = (document.getElementById('submitDescTool')?.value || '').trim();

    const link = document.getElementById('submitLink')?.value.trim() || '';
    const content = document.getElementById('submitContent').value.trim();

    if (!title) { showToast('请填写名称', 'error'); return; }
    if (type === 'website' && (!description || !link)) { showToast('请填写简介和链接', 'error'); return; }
    if (type === 'tool' && !description) { showToast('请填写软件简介', 'error'); return; }
    if (type === 'tutorial' && !description) { showToast('请填写教程描述', 'error'); return; }

    // 收集文件信息
    const imgPreviews = document.getElementById('filePreviewImg')?.children || [];
    const images = [];
    const videos = [];
    const files = [];

    Array.from(imgPreviews).forEach(el => {
        const imgSrc = el.querySelector('img')?.src;
        const vidSrc = el.querySelector('video')?.src || el.querySelector('source')?.src;
        const name = el.dataset?.name || '';
        if (imgSrc) images.push(imgSrc);
        if (vidSrc) videos.push(vidSrc);
        if (name) files.push({ name, url: imgSrc || vidSrc });
    });

    const newItem = {
        id: Date.now(),
        type,
        title,
        description,
        images,
        videos,
        files,
        link: type === 'website' ? link : '',
        downloadLink: '',
        content,
        coverImage: images[0] || '',
        author: currentUser.nickname,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    __content.push(newItem);
    localStorage.setItem('content', JSON.stringify(__content));

    showToast('提交成功，等待审核', 'success');
    closeSubmitModal();
    renderContent();
}

// ===== 用户系统 =====
function openSignInModal() {
    const modal = document.getElementById('signinModal');
    if (!modal) return;

    if (currentUser) {
        document.getElementById('signinTitle').textContent = `${currentUser.nickname} 已登录`;
        document.getElementById('signinLoggedInView').style.display = 'block';
        document.getElementById('signinWelcomeMsg').textContent = `欢迎回来，${currentUser.nickname}！`;
        document.getElementById('signinLoginView').style.display = 'none';
        document.getElementById('signinRegisterView').style.display = 'none';
    } else {
        document.getElementById('signinTitle').textContent = 'SIGN IN';
        document.getElementById('signinLoggedInView').style.display = 'none';
        document.getElementById('signinLoginView').style.display = 'block';
        document.getElementById('signinRegisterView').style.display = 'none';
        document.getElementById('signinLoginNickname').value = '';
        document.getElementById('signinLoginPassword').value = '';
        const errorDiv = document.getElementById('signinLoginError');
        if (errorDiv) errorDiv.style.display = 'none';
    }

    modal.classList.add('active');
}

function openLoginView() {
    document.getElementById('signinLoginView').style.display = 'block';
    document.getElementById('signinRegisterView').style.display = 'none';
    document.getElementById('signinTitle').textContent = 'SIGN IN';
}

function openRegisterView() {
    document.getElementById('signinLoginView').style.display = 'none';
    document.getElementById('signinRegisterView').style.display = 'block';
    document.getElementById('signinTitle').textContent = '注册账号';
    document.getElementById('registerNickname').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
    document.getElementById('registerError').style.display = 'none';
}

function closeSignInModal() {
    const modal = document.getElementById('signinModal');
    if (modal) modal.classList.remove('active');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateSigninButton();
    closeSignInModal();
    showToast('已退出登录', 'info');
}

function updateSigninButton() {
    const btn = document.querySelector('.signin-btn');
    if (btn) {
        btn.textContent = currentUser ? `👤 ${currentUser.nickname}` : '🔐 SIGN IN';
    }
}

function doLogin() {
    const nickname = document.getElementById('signinLoginNickname').value.trim();
    const password = document.getElementById('signinLoginPassword').value;
    const errorDiv = document.getElementById('signinLoginError');

    if (!nickname || !password) { showToast('请填写完整信息', 'error'); return; }
    if (!__users[nickname]) {
        if (errorDiv) { errorDiv.textContent = '用户不存在，请先注册'; errorDiv.style.display = 'block'; }
        return;
    }
    if (atob(__users[nickname].password) !== password) {
        if (errorDiv) { errorDiv.textContent = '密码错误'; errorDiv.style.display = 'block'; }
        return;
    }

    currentUser = { nickname, password };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showToast('登录成功！', 'success');
    closeSignInModal();
    updateSigninButton();
}

function doRegister() {
    const nickname = document.getElementById('registerNickname').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorDiv = document.getElementById('registerError');

    if (!nickname || !password || !confirmPassword) {
        if (errorDiv) { errorDiv.textContent = '请填写完整信息'; errorDiv.style.display = 'block'; }
        return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
        if (errorDiv) { errorDiv.textContent = '昵称长度需在2-20字符之间'; errorDiv.style.display = 'block'; }
        return;
    }
    if (password.length < 4) {
        if (errorDiv) { errorDiv.textContent = '密码至少需要4位'; errorDiv.style.display = 'block'; }
        return;
    }
    if (password !== confirmPassword) {
        if (errorDiv) { errorDiv.textContent = '两次输入的密码不一致'; errorDiv.style.display = 'block'; }
        return;
    }
    if (__users[nickname]) {
        if (errorDiv) { errorDiv.textContent = '该昵称已被使用'; errorDiv.style.display = 'block'; }
        return;
    }

    __users[nickname] = { password: btoa(password) };
    localStorage.setItem('users', JSON.stringify(__users));

    currentUser = { nickname, password };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showToast('注册成功！', 'success');
    updateSigninButton();
    closeSignInModal();
}

// ===== 拖拽上传 =====
function setupDropZone(dropZoneId, inputId, previewId) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files, inputId, previewId);
    });
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files, inputId, previewId));
}

function handleFileSelect(files, inputId, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    Array.from(files).forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.dataset.name = file.name;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                item.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><button class="file-del-btn" title="删除">×</button>`;
                item.querySelector('.file-del-btn').addEventListener('click', () => item.remove());
                preview.appendChild(item);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                item.innerHTML = `<video src="${e.target.result}" controls style="max-height:80px;"></video><button class="file-del-btn" title="删除">×</button>`;
                item.querySelector('.file-del-btn').addEventListener('click', () => item.remove());
                preview.appendChild(item);
            };
            reader.readAsDataURL(file);
        } else {
            item.innerHTML = `<div class="file-preview-item__pkg">📦 ${file.name}</div><button class="file-del-btn" title="删除">×</button>`;
            item.querySelector('.file-del-btn').addEventListener('click', () => item.remove());
            preview.appendChild(item);
        }
    });
}

// ===== 烟花效果 =====
function createFirework(x, y) {
    const container = document.getElementById('fireworkContainer');
    if (!container) return;
    const colors = ['#667eea', '#764ba2', '#f093fb', '#48bb78', '#f6ad55', '#fc8181'];
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        const angle = (i / 15) * Math.PI * 2;
        const distance = 60 + Math.random() * 60;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);
    }
}

// ===== 工具函数 =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

// ===== 点击遮罩关闭 =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
});
