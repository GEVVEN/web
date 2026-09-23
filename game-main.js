// 游戏页面主控 - 处理路由
(function() {
    let currentGame = null;

    const urlParams = new URLSearchParams(window.location.search);
    const gameType = urlParams.get('game') || 'tetris';
    const gameUrl = urlParams.get('url'); // 支持自定义URL参数

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

        // 重置显示
        canvasArea.style.display = 'none';
        iframeArea.style.display = 'none';
        iframe.src = '';
        startBtn.style.display = '';
        pauseBtn.style.display = '';
        fullscreenBtn.style.display = 'none';
        scoreEl.style.display = '';
        highScoreEl.style.display = '';

        // 处理自定义 URL（后台添加的网页游戏）
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
            document.getElementById('gameInstr').textContent = '在游戏画面内直接操作 | 点击上方全屏按钮可全屏游玩';
            loadIframeGame(customUrl, '网页游戏', fallback);
            return;
        }

        if (type === 'tetris') {
            currentGame = 'tetris';
            window.__activeGame = 'tetris';
            document.getElementById('gameTitle').textContent = '🧩 俄罗斯方块';
            document.getElementById('gameDesc').textContent = '经典益智游戏，按方向键移动方块';
            document.title = '俄罗斯方块 - 小游戏';
            canvasArea.style.display = 'flex';
            document.getElementById('gameInstr').textContent = '← → 移动 | ↑ 旋转 | ↓ 加速下落 | 空格 硬降 | 点击"开始游戏"启动';
            setTimeout(() => { initTetris(); }, 100);

        } else if (type === 'snake') {
            currentGame = 'snake';
            window.__activeGame = 'snake';
            document.getElementById('gameTitle').textContent = '🐍 贪吃蛇';
            document.getElementById('gameDesc').textContent = '经典街机游戏，控制蛇吃食物变长';
            document.title = '贪吃蛇 - 小游戏';
            canvasArea.style.display = 'flex';
            document.getElementById('gameInstr').textContent = '← → ↑ ↓ 控制方向 | 点击"开始游戏"启动';
            setTimeout(() => { initSnake(); }, 100);

        } else if (type === 'solitaire' || type === 'spider') {
            // iframe 网页游戏：隐藏控制按钮，显示全屏按钮
            currentGame = type;
            window.__activeGame = type;
            if (type === 'solitaire') {
                document.getElementById('gameTitle').textContent = '🃏 纸牌接龙';
                document.getElementById('gameDesc').textContent = '经典 Klondike 纸牌接龙';
                document.title = '纸牌接龙 - 小游戏';
            } else {
                document.getElementById('gameTitle').textContent = '🕷️ 蜘蛛纸牌';
                document.getElementById('gameDesc').textContent = '蜘蛛纸牌，K→A 同花色序列自动消除';
                document.title = '蜘蛛纸牌 - 小游戏';
            }
            iframeArea.style.display = 'block';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            fullscreenBtn.style.display = '';
            scoreEl.style.display = 'none';
            highScoreEl.style.display = 'none';
            document.getElementById('gameInstr').textContent = '在游戏画面内直接操作 | 点击上方全屏按钮可全屏游玩';

            if (type === 'solitaire') {
                loadSolitaireIframe(fallback);
            } else {
                loadSpiderIframe(fallback);
            }

        } else {
            document.getElementById('gameTitle').textContent = '❌ 游戏不存在';
            document.getElementById('gameDesc').textContent = '返回主页选择其他游戏';
        }
    }

    function loadSolitaireIframe(fallback) {
        const iframe = document.getElementById('gameIframe');
        const iframeArea = document.getElementById('gameIframeArea');
        const urls = [
            'https://www.zhizhuzhipai.cn/',
            'https://solitaire.parade.com/'
        ];
        let idx = 0;

        function tryLoad() {
            if (idx >= urls.length) {
                showFallback(fallback, urls[urls.length - 1], '纸牌接龙');
                return;
            }
            fallback.style.display = 'none';
            iframeArea.style.display = 'block';
            iframe.style.display = 'block';
            iframe.src = urls[idx];
            idx++;

            let loaded = false;
            iframe.onload = function() { loaded = true; fallback.style.display = 'none'; };

            setTimeout(function() {
                if (!loaded) {
                    try {
                        const doc = iframe.contentWindow && iframe.contentWindow.document;
                        if (doc && doc.body && doc.body.innerHTML.trim() !== '') {
                            loaded = true;
                            fallback.style.display = 'none';
                        } else {
                            tryLoad();
                        }
                    } catch(e) {
                        tryLoad();
                    }
                }
            }, 8000);
        }
        tryLoad();
    }

    function loadSpiderIframe(fallback) {
        const iframe = document.getElementById('gameIframe');
        const iframeArea = document.getElementById('gameIframeArea');
        const urls = [
            'https://www.zhizhuzhipai.cn/spider.html',
            'https://zh.spidersolitaire.cn/'
        ];
        let idx = 0;

        function tryLoad() {
            if (idx >= urls.length) {
                showFallback(fallback, urls[urls.length - 1], '蜘蛛纸牌');
                return;
            }
            fallback.style.display = 'none';
            iframeArea.style.display = 'block';
            iframe.style.display = 'block';
            iframe.src = urls[idx];
            idx++;

            let loaded = false;
            iframe.onload = function() { loaded = true; fallback.style.display = 'none'; };

            setTimeout(function() {
                if (!loaded) {
                    try {
                        const doc = iframe.contentWindow && iframe.contentWindow.document;
                        if (doc && doc.body && doc.body.innerHTML.trim() !== '') {
                            loaded = true;
                            fallback.style.display = 'none';
                        } else {
                            tryLoad(); // 尝试下一个
                        }
                    } catch(e) {
                        tryLoad();
                    }
                }
            }, 8000);
        }
        tryLoad();
    }

    function loadIframeGame(url, gameName, fallback) {
        const iframe = document.getElementById('gameIframe');
        const iframeArea = document.getElementById('gameIframeArea');

        // 先隐藏 fallback，显示 iframe
        fallback.style.display = 'none';
        iframe.style.display = 'block';
        iframeArea.style.display = 'block';
        iframe.src = url;

        // 超时检测：15秒后如果还空白则显示 fallback
        let loaded = false;
        let loadTimer = null;

        iframe.onload = function() {
            loaded = true;
            if (loadTimer) clearTimeout(loadTimer);
            fallback.style.display = 'none';
        };

        loadTimer = setTimeout(function() {
            if (!loaded) {
                // 尝试检测 iframe 内容是否可访问
                try {
                    const win = iframe.contentWindow;
                    const doc = win && win.document;
                    if (doc && (!doc.body || doc.body.innerHTML.trim() === '')) {
                        showFallback(fallback, url, gameName);
                    } else if (doc && doc.title && doc.title.trim() !== '') {
                        // 有内容，正常显示
                        loaded = true;
                        fallback.style.display = 'none';
                    } else {
                        // 跨域或空白
                        showFallback(fallback, url, gameName);
                    }
                } catch(e) {
                    // 跨域无法访问内容，但页面可能已加载
                    showFallback(fallback, url, gameName);
                }
            }
        }, 12000);
    }

    function showFallback(fallback, url, gameName) {
        fallback.style.display = 'flex';
        const link = fallback.querySelector('a');
        if (link) link.href = url;
        const desc = fallback.querySelector('div:nth-child(2)');
        if (desc) desc.textContent = gameName + ' 页面加载失败';
        const hint = fallback.querySelector('div:nth-child(3)');
        if (hint) hint.textContent = '点击下方按钮直接访问游戏网站';
    }

    window.startGame = function() {
        if (window.__activeGame === 'tetris' && typeof startTetrisGame === 'function') startTetrisGame();
        else if (window.__activeGame === 'snake' && typeof startSnakeGame === 'function') startSnakeGame();
    };

    window.togglePause = function() {
        if (window.__activeGame === 'tetris' && typeof pauseTetrisGame === 'function') pauseTetrisGame();
        else if (window.__activeGame === 'snake' && typeof pauseSnakeGame === 'function') pauseSnakeGame();
    };

    window.toggleFullscreen = function() {
        const iframeArea = document.getElementById('gameIframeArea');
        const canvasArea = document.getElementById('gameCanvasArea');

        if (currentGame === 'solitaire' || currentGame === 'spider' || currentGame === 'webgame') {
            // iframe 游戏全屏
            if (!document.fullscreenElement) {
                iframeArea.requestFullscreen().catch(err => {
                    console.error('全屏失败:', err);
                    // 降级：在新标签页打开
                    if (gameUrl) {
                        window.open(gameUrl, '_blank');
                    } else {
                        const params = new URLSearchParams(window.location.search);
                        params.set('game', currentGame);
                        window.open('game.html?' + params.toString(), '_blank');
                    }
                });
            } else {
                document.exitFullscreen();
            }
        } else {
            // canvas 游戏全屏
            canvasArea.requestFullscreen().catch(err => console.error('全屏失败:', err));
        }
    };

    window.goBack = function() {
        window.location.href = 'index.html';
    };

    window.addEventListener('load', init);
})();
