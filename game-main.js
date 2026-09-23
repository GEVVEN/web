// 游戏页面主控 - 处理路由（纯 Canvas 游戏，无 iframe）
(function() {
    let currentGame = null;

    const urlParams = new URLSearchParams(window.location.search);
    const gameType = urlParams.get('game') || 'tetris';

    function init() {
        loadGamePage(gameType);
    }

    function loadGamePage(type) {
        const canvasArea = document.getElementById('gameCanvasArea');
        const iframeArea = document.getElementById('gameIframeArea');
        const startBtn = document.getElementById('gameStartBtn');
        const pauseBtn = document.getElementById('gamePauseBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const scoreEl = document.getElementById('gameScore');
        const highScoreEl = document.getElementById('gameHighScore');
        const iframe = document.getElementById('gameIframe');

        // 重置显示
        canvasArea.style.display = 'none';
        iframeArea.style.display = 'none';
        iframe.src = '';
        startBtn.style.display = '';
        pauseBtn.style.display = '';
        fullscreenBtn.style.display = 'none';
        scoreEl.style.display = '';
        highScoreEl.style.display = '';

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

        } else if (type === 'solitaire') {
            currentGame = 'solitaire';
            window.__activeGame = 'solitaire';
            document.getElementById('gameTitle').textContent = '🃏 纸牌接龙';
            document.getElementById('gameDesc').textContent = '经典 Klondike 纸牌接龙，将牌按花色从 A 到 K 整理到右上角';
            document.title = '纸牌接龙 - 小游戏';
            canvasArea.style.display = 'flex';
            document.getElementById('gameInstr').textContent = '点击纸牌选中 | 拖拽纸牌移动 | 点击左上牌堆发牌 | 点击"开始游戏"重新开始';
            setTimeout(() => { __initSolitaire(); }, 100);

        } else if (type === 'spider') {
            currentGame = 'spider';
            window.__activeGame = 'spider';
            document.getElementById('gameTitle').textContent = '🕷️ 蜘蛛纸牌';
            document.getElementById('gameDesc').textContent = '单色蜘蛛纸牌，K→A 同花色序列自动消除';
            document.title = '蜘蛛纸牌 - 小游戏';
            canvasArea.style.display = 'flex';
            document.getElementById('gameInstr').textContent = '点击并拖拽纸牌移动 | 点击左上牌堆发牌 | 完成 K→A 序列自动消除 | 点击"开始游戏"重新开始';
            setTimeout(() => { __initSpider(); }, 100);

        } else {
            document.getElementById('gameTitle').textContent = '❌ 游戏不存在';
            document.getElementById('gameDesc').textContent = '返回主页选择其他游戏';
        }
    }

    window.startGame = function() {
        if (window.__activeGame === 'tetris' && typeof startTetrisGame === 'function') startTetrisGame();
        else if (window.__activeGame === 'snake' && typeof startSnakeGame === 'function') startSnakeGame();
        else if (window.__activeGame === 'solitaire' && typeof __startSolitaire === 'function') __startSolitaire();
        else if (window.__activeGame === 'spider' && typeof __startSpider === 'function') __startSpider();
    };

    window.togglePause = function() {
        if (window.__activeGame === 'tetris' && typeof pauseTetrisGame === 'function') pauseTetrisGame();
        else if (window.__activeGame === 'snake' && typeof pauseSnakeGame === 'function') pauseSnakeGame();
        else if (window.__activeGame === 'solitaire' && typeof __pauseSolitaire === 'function') __pauseSolitaire();
        else if (window.__activeGame === 'spider' && typeof __pauseSpider === 'function') __pauseSpider();
    };

    window.toggleFullscreen = function() {
        const canvasArea = document.getElementById('gameCanvasArea');
        if (!document.fullscreenElement) {
            canvasArea.requestFullscreen().catch(err => console.error('全屏失败:', err));
        } else {
            document.exitFullscreen();
        }
    };

    window.goBack = function() {
        window.location.href = 'index.html';
    };

    window.addEventListener('load', init);
})();
