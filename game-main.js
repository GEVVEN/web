// 游戏页面主控 - 处理路由
(function() {
    let currentGame = null;

    const urlParams = new URLSearchParams(window.location.search);
    const gameType = urlParams.get('game') || 'tetris';
    const gameUrl = urlParams.get('url');

    // 游戏对应的 iframe URL
    const GAME_IFRAME_URLS = {
        solitaire: 'https://www.zhizhuzhipai.cn/',
        spider: 'https://www.zhizhuzhipai.cn/spider.html'
    };

    function init() {
        loadGamePage(gameType, gameUrl);
    }

    function loadGamePage(type, customUrl) {
        const canvasArea = document.getElementById('gameCanvasArea');
        const iframeArea = document.getElementById('gameIframeArea');
        const iframe = document.getElementById('gameIframe');
        const startBtn = document.getElementById('gameStartBtn');
        const pauseBtn = document.getElementById('gamePauseBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const scoreEl = document.getElementById('gameScore');
        const highScoreEl = document.getElementById('gameHighScore');
        const fallback = document.getElementById('iframeFallback');
        const touchControls = document.getElementById('touchControls');
        const touchHint = document.getElementById('touchHint');
        const touchActionBtn = document.getElementById('touchActionBtn');

        // 重置
        canvasArea.style.display = 'none';
        iframeArea.style.display = 'none';
        iframe.src = '';
        startBtn.style.display = '';
        pauseBtn.style.display = '';
        fullscreenBtn.style.display = 'none';
        scoreEl.style.display = '';
        highScoreEl.style.display = '';
        touchControls.style.display = 'none';
        touchHint.style.display = 'none';
        touchActionBtn.style.display = 'none';
        fallback.style.display = 'none';

        // 判断是否手机
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);

        // 自定义 URL 游戏
        if (customUrl && customUrl.startsWith('http')) {
            currentGame = 'webgame';
            window.__activeGame = 'webgame';
            document.getElementById('gameTitle').textContent = '🌐 网页游戏';
            document.getElementById('gameDesc').textContent = '外部网页游戏';
            document.title = '网页游戏 - 小游戏';
            iframeArea.style.display = 'block';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            fullscreenBtn.style.display = '';
            scoreEl.style.display = 'none';
            highScoreEl.style.display = 'none';
            loadIframeGame(customUrl, customUrl, fallback);
            if (isMobile) showTouchHint();
            return;
        }

        // 俄罗斯方块
        if (type === 'tetris') {
            currentGame = 'tetris';
            window.__activeGame = 'tetris';
            document.getElementById('gameTitle').textContent = '🧩 俄罗斯方块';
            document.getElementById('gameDesc').textContent = '经典益智游戏';
            document.title = '俄罗斯方块 - 小游戏';
            canvasArea.style.display = 'flex';
            if (!isMobile) {
                document.getElementById('gameInstr').textContent = '← → 移动 | ↑ 旋转 | ↓ 加速 | 空格 硬降';
            }
            if (isMobile) showTouchControls();
            setTimeout(() => { initTetris(); }, 150);

        // 贪吃蛇
        } else if (type === 'snake') {
            currentGame = 'snake';
            window.__activeGame = 'snake';
            document.getElementById('gameTitle').textContent = '🐍 贪吃蛇';
            document.getElementById('gameDesc').textContent = '经典街机游戏';
            document.title = '贪吃蛇 - 小游戏';
            canvasArea.style.display = 'flex';
            if (!isMobile) {
                document.getElementById('gameInstr').textContent = '← → ↑ ↓ 控制方向';
            }
            if (isMobile) showTouchControls();
            setTimeout(() => { initSnake(); }, 150);

        // iframe 纸牌游戏
        } else if (type === 'solitaire' || type === 'spider') {
            currentGame = type;
            window.__activeGame = type;
            if (type === 'solitaire') {
                document.getElementById('gameTitle').textContent = '🃏 纸牌接龙';
                document.getElementById('gameDesc').textContent = '经典 Klondike 纸牌接龙';
                document.title = '纸牌接龙 - 小游戏';
            } else {
                document.getElementById('gameTitle').textContent = '🕷️ 蜘蛛纸牌';
                document.getElementById('gameDesc').textContent = '蜘蛛纸牌';
                document.title = '蜘蛛纸牌 - 小游戏';
            }
            iframeArea.style.display = 'block';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            fullscreenBtn.style.display = '';
            scoreEl.style.display = 'none';
            highScoreEl.style.display = 'none';
            loadIframeGame(GAME_IFRAME_URLS[type], GAME_IFRAME_URLS[type], fallback);
            if (isMobile) showTouchHint();

        } else {
            document.getElementById('gameTitle').textContent = '❌ 游戏不存在';
            document.getElementById('gameDesc').textContent = '返回主页选择其他游戏';
        }
    }

    function showTouchControls() {
        const touchControls = document.getElementById('touchControls');
        const touchHint = document.getElementById('touchHint');
        touchControls.style.display = 'flex';
        touchHint.style.display = 'block';
        // 俄罗斯方块需要旋转/硬降按钮
        if (currentGame === 'tetris') {
            document.getElementById('touchActionBtn').style.display = 'flex';
        }
    }

    function showTouchHint() {
        const touchHint = document.getElementById('touchHint');
        touchHint.style.display = 'block';
        touchHint.textContent = '点击"打开游戏"在新页面游玩';
    }

    // 触屏方向
    window.touchDir = function(dir) {
        if (currentGame === 'tetris') {
            if (dir === 'left') tetrisMove(-1, 0);
            else if (dir === 'right') tetrisMove(1, 0);
            else if (dir === 'down') tetrisMove(0, 1);
            else if (dir === 'up') tetrisRotate();
        } else if (currentGame === 'snake') {
            snakeChangeDir(dir);
        }
    };

    window.touchAction = function() {
        if (currentGame === 'tetris') {
            tetrisHardDrop();
        }
    };

    function loadIframeGame(url, fallbackUrl, fallback) {
        const iframe = document.getElementById('gameIframe');
        const iframeArea = document.getElementById('gameIframeArea');

        fallback.style.display = 'none';
        iframe.style.display = 'block';
        iframeArea.style.display = 'block';
        iframe.src = url;

        let loaded = false;
        let timer = null;

        iframe.onload = function() {
            loaded = true;
            if (timer) clearTimeout(timer);
            fallback.style.display = 'none';
        };

        timer = setTimeout(function() {
            if (!loaded) {
                try {
                    const doc = iframe.contentWindow && iframe.contentWindow.document;
                    if (doc && doc.body && doc.body.innerHTML.trim() !== '') {
                        loaded = true;
                        fallback.style.display = 'none';
                    } else {
                        showFallback(fallback, fallbackUrl);
                    }
                } catch(e) {
                    showFallback(fallback, fallbackUrl);
                }
            }
        }, 12000);
    }

    function showFallback(fallback, url) {
        fallback.style.display = 'flex';
        const link = fallback.querySelector('#fallbackLink');
        if (link) link.href = url;
    }

    // 打开游戏网页（替代全屏）
    window.openGameWeb = function() {
        const url = GAME_IFRAME_URLS[currentGame] || '';
        if (url) {
            window.open(url, '_blank');
        } else {
            const params = new URLSearchParams(window.location.search);
            window.open('game.html?' + params.toString(), '_blank');
        }
    };

    window.startGame = function() {
        if (window.__activeGame === 'tetris' && typeof startTetrisGame === 'function') startTetrisGame();
        else if (window.__activeGame === 'snake' && typeof startSnakeGame === 'function') startSnakeGame();
    };

    window.togglePause = function() {
        if (window.__activeGame === 'tetris' && typeof pauseTetrisGame === 'function') pauseTetrisGame();
        else if (window.__activeGame === 'snake' && typeof pauseSnakeGame === 'function') pauseSnakeGame();
    };

    window.goBack = function() {
        window.location.href = 'index.html';
    };

    window.addEventListener('load', init);
})();
