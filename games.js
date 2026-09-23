// 游戏逻辑 - 俄罗斯方块和贪吃蛇

// ========== 俄罗斯方块 ==========
let tetrisCanvas, tetrisCtx;
let tetrisBoard = [];
let tetrisPiece = null;
let tetrisGameInterval = null;
let tetrisScore = 0;
let tetrisLevel = 1;
let tetrisLines = 0;
let tetrisIsRunning = false;
let tetrisBlockSize = 30;
let tetrisKeyHandler = null;

const TETROMINOES = {
    I: { shape: [[1,1,1,1]], color: '#00f5ff' },
    O: { shape: [[1,1],[1,1]], color: '#ffd700' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#3b82f6' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#f97316' }
};

const PIECE_NAMES = Object.keys(TETROMINOES);

function initTetris() {
    tetrisCanvas = document.getElementById('gameCanvas');
    if (!tetrisCanvas) return;
    if (tetrisKeyHandler) {
        document.removeEventListener('keydown', tetrisKeyHandler);
    }

    tetrisCtx = tetrisCanvas.getContext('2d');


    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 200;

    tetrisBlockSize = Math.min(30, Math.floor(Math.min(maxWidth / 10, maxHeight / 20)));

    tetrisCanvas.width = tetrisBlockSize * 10;
    tetrisCanvas.height = tetrisBlockSize * 20;

    resetTetris();
    drawTetris();

    // 只在游戏运行中才监听方向键，且阻止页面滚动
    tetrisKeyHandler = function(e) {
        handleTetrisKey(e);
    };
    document.addEventListener('keydown', tetrisKeyHandler);
}

function resetTetris() {
    tetrisBoard = Array(20).fill(null).map(() => Array(10).fill(null));
    tetrisScore = 0;
    tetrisLevel = 1;
    tetrisLines = 0;
    tetrisIsRunning = false; // 初始状态为暂停，点击"开始游戏"后才运行
    if (tetrisGameInterval) clearInterval(tetrisGameInterval);
    tetrisGameInterval = null;
    spawnTetrisPiece();
    updateTetrisScore();
    drawTetris();
}

function startTetrisGame() {
    if (tetrisIsRunning) return;
    tetrisIsRunning = true;
    tetrisGameInterval = setInterval(tetrisTick, 800);
}

function pauseTetrisGame() {
    tetrisIsRunning = !tetrisIsRunning;
    if (tetrisIsRunning) {
        tetrisGameInterval = setInterval(tetrisTick, 800);
    } else {
        if (tetrisGameInterval) clearInterval(tetrisGameInterval);
        tetrisGameInterval = null;
        // 绘制暂停提示
        tetrisCtx.fillStyle = 'rgba(0,0,0,0.6)';
        tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        tetrisCtx.fillStyle = '#fff';
        tetrisCtx.font = 'bold 28px Arial';
        tetrisCtx.textAlign = 'center';
        tetrisCtx.fillText('已暂停', tetrisCanvas.width / 2, tetrisCanvas.height / 2);
    }
}

function spawnTetrisPiece() {
    const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const piece = TETROMINOES[name];
    tetrisPiece = {
        shape: piece.shape.map(row => [...row]),
        color: piece.color,
        x: 3,
        y: 0
    };

    if (checkCollision(tetrisPiece, 0, 0)) {
        gameOverTetris();
    }
}

function checkCollision(piece, dx, dy, newShape = null) {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;

                if (newX < 0 || newX >= 10 || newY >= 20) return true;
                if (newY >= 0 && tetrisBoard[newY][newX]) return true;
            }
        }
    }
    return false;
}

function rotatePiece() {
    if (!tetrisPiece) return;

    const rotated = tetrisPiece.shape[0].map((_, i) =>
        tetrisPiece.shape.map(row => row[i]).reverse()
    );

    if (!checkCollision(tetrisPiece, 0, 0, rotated)) {
        tetrisPiece.shape = rotated;
    }
}

function tetrisTick() {
    if (!tetrisIsRunning || !tetrisPiece) return;

    if (!checkCollision(tetrisPiece, 0, 1)) {
        tetrisPiece.y++;
    } else {
        lockPiece();
        clearLines();
        spawnTetrisPiece();
    }

    drawTetris();
}

function lockPiece() {
    if (!tetrisPiece) return;

    for (let y = 0; y < tetrisPiece.shape.length; y++) {
        for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
            if (tetrisPiece.shape[y][x]) {
                const boardY = tetrisPiece.y + y;
                const boardX = tetrisPiece.x + x;
                if (boardY >= 0) {
                    tetrisBoard[boardY][boardX] = tetrisPiece.color;
                }
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;

    for (let y = 19; y >= 0; y--) {
        if (tetrisBoard[y].every(cell => cell !== null)) {
            tetrisBoard.splice(y, 1);
            tetrisBoard.unshift(Array(10).fill(null));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        tetrisLines += linesCleared;
        tetrisScore += [0, 100, 300, 500, 800][linesCleared] * tetrisLevel;
        tetrisLevel = Math.floor(tetrisLines / 10) + 1;

        // 更新速度
        if (tetrisGameInterval) clearInterval(tetrisGameInterval);
        tetrisGameInterval = setInterval(tetrisTick, Math.max(100, 800 - (tetrisLevel - 1) * 50));
    }
}

function handleTetrisKey(e) {
    if (!tetrisIsRunning || !tetrisPiece) return;

    // 阻止方向键滚动页面
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowLeft':
            if (!checkCollision(tetrisPiece, -1, 0)) tetrisPiece.x--;
            break;
        case 'ArrowRight':
            if (!checkCollision(tetrisPiece, 1, 0)) tetrisPiece.x++;
            break;
        case 'ArrowDown':
            if (!checkCollision(tetrisPiece, 0, 1)) {
                tetrisPiece.y++;
                tetrisScore += 1;
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            // 硬降
            while (!checkCollision(tetrisPiece, 0, 1)) {
                tetrisPiece.y++;
                tetrisScore += 2;
            }
            lockPiece();
            clearLines();
            spawnTetrisPiece();
            break;
    }

    drawTetris();
    updateTetrisScore();
}

function updateTetrisScore() {
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = `分数: ${tetrisScore}`;
}

function drawTetris() {
    if (!tetrisCtx) return;

    // 清空画布
    tetrisCtx.fillStyle = '#0f172a';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

    // 绘制网格
    tetrisCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    tetrisCtx.lineWidth = 1;
    for (let x = 0; x <= 10; x++) {
        tetrisCtx.beginPath();
        tetrisCtx.moveTo(x * tetrisBlockSize, 0);
        tetrisCtx.lineTo(x * tetrisBlockSize, tetrisCanvas.height);
        tetrisCtx.stroke();
    }
    for (let y = 0; y <= 20; y++) {
        tetrisCtx.beginPath();
        tetrisCtx.moveTo(0, y * tetrisBlockSize);
        tetrisCtx.lineTo(tetrisCanvas.width, y * tetrisBlockSize);
        tetrisCtx.stroke();
    }

    // 绘制已锁定的方块
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            if (tetrisBoard[y][x]) {
                drawTetrisBlock(tetrisCtx, x, y, tetrisBoard[y][x]);
            }
        }
    }

    // 绘制当前方块
    if (tetrisPiece) {
        for (let y = 0; y < tetrisPiece.shape.length; y++) {
            for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
                if (tetrisPiece.shape[y][x]) {
                    drawTetrisBlock(tetrisCtx, tetrisPiece.x + x, tetrisPiece.y + y, tetrisPiece.color);
                }
            }
        }

        // 绘制幽灵方块
        let ghostY = tetrisPiece.y;
        while (!checkCollision(tetrisPiece, 0, ghostY - tetrisPiece.y + 1)) {
            ghostY++;
        }
        tetrisCtx.globalAlpha = 0.3;
        for (let y = 0; y < tetrisPiece.shape.length; y++) {
            for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
                if (tetrisPiece.shape[y][x]) {
                    drawTetrisBlock(tetrisCtx, tetrisPiece.x + x, ghostY + y, tetrisPiece.color);
                }
            }
        }
        tetrisCtx.globalAlpha = 1;
    }

    // 绘制分数信息
    tetrisCtx.fillStyle = '#fff';
    tetrisCtx.font = 'bold 16px Arial';
    tetrisCtx.textAlign = 'right';
    tetrisCtx.fillText(`分数: ${tetrisScore}`, tetrisCanvas.width - 10, 25);
    tetrisCtx.fillText(`等级: ${tetrisLevel}`, tetrisCanvas.width - 10, 45);
    tetrisCtx.fillText(`行数: ${tetrisLines}`, tetrisCanvas.width - 10, 65);
}

function drawTetrisBlock(ctx, x, y, color) {
    const padding = 2;
    ctx.fillStyle = color;
    ctx.fillRect(
        x * tetrisBlockSize + padding,
        y * tetrisBlockSize + padding,
        tetrisBlockSize - padding * 2,
        tetrisBlockSize - padding * 2
    );

    // 高光效果
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(
        x * tetrisBlockSize + padding,
        y * tetrisBlockSize + padding,
        tetrisBlockSize - padding * 2,
        (tetrisBlockSize - padding * 2) * 0.3
    );
}

function gameOverTetris() {
    tetrisIsRunning = false;
    if (tetrisGameInterval) clearInterval(tetrisGameInterval);
    tetrisGameInterval = null;

    // 移除事件监听，防止干扰
    if (tetrisKeyHandler) {
        document.removeEventListener('keydown', tetrisKeyHandler);
        tetrisKeyHandler = null;
    }

    // 点击画布重新开始
    tetrisCanvas.addEventListener('click', function restart() {
        tetrisCanvas.removeEventListener('click', restart);
        resetTetris();
        drawTetris();
        // 重新绑定键盘事件
        tetrisKeyHandler = function(e) { handleTetrisKey(e); };
        document.addEventListener('keydown', tetrisKeyHandler);
    });

    // 绘制游戏结束提示
    tetrisCtx.fillStyle = 'rgba(0,0,0,0.7)';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    tetrisCtx.fillStyle = '#fff';
    tetrisCtx.font = 'bold 30px Arial';
    tetrisCtx.textAlign = 'center';
    tetrisCtx.fillText('游戏结束', tetrisCanvas.width / 2, tetrisCanvas.height / 2 - 20);
    tetrisCtx.font = '18px Arial';
    tetrisCtx.fillText('点击重新开始', tetrisCanvas.width / 2, tetrisCanvas.height / 2 + 20);
}

// ========== 贪吃蛇 ==========
let snakeCanvas, snakeCtx;
let snake = [];
let snakeFood = null;
let snakeDirection = 'right';
let snakeNextDirection = 'right';
let snakeGameInterval = null;
let snakeScore = 0;
let snakeIsRunning = false;
let snakeSpeed = 150;
let snakeKeyHandler = null;

function initSnake() {
    snakeCanvas = document.getElementById('gameCanvas');
    if (!snakeCanvas) return;

    // 清除旧的事件监听器
    if (snakeKeyHandler) {
        document.removeEventListener('keydown', snakeKeyHandler);
    }

    snakeCtx = snakeCanvas.getContext('2d');

    // 设置画布大小
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 200;

    const gridSize = 20;
    snakeCanvas.width = Math.min(maxWidth, Math.floor(maxWidth / gridSize) * gridSize);
    snakeCanvas.height = Math.min(maxHeight, Math.floor(maxHeight / gridSize) * gridSize);

    resetSnake();
    drawSnake();

    // 只在游戏运行中才监听方向键
    snakeKeyHandler = function(e) {
        handleSnakeKey(e);
    };
    document.addEventListener('keydown', snakeKeyHandler);
}

function resetSnake() {
    const cols = snakeCanvas.width / 20;
    const rows = snakeCanvas.height / 20;

    snake = [
        { x: Math.floor(cols / 2), y: Math.floor(rows / 2) }
    ];
    snakeDirection = 'right';
    snakeNextDirection = 'right';
    snakeScore = 0;
    snakeIsRunning = false; // 初始状态为暂停
    snakeSpeed = 150;

    spawnSnakeFood();
    updateSnakeScore();
    drawSnake();
}

function startSnakeGame() {
    if (snakeIsRunning) return;
    snakeIsRunning = true;
    snakeGameInterval = setInterval(snakeTick, snakeSpeed);
}

function pauseSnakeGame() {
    snakeIsRunning = !snakeIsRunning;
    if (snakeIsRunning) {
        snakeGameInterval = setInterval(snakeTick, snakeSpeed);
    } else {
        if (snakeGameInterval) clearInterval(snakeGameInterval);
        snakeGameInterval = null;
        // 绘制暂停提示
        snakeCtx.fillStyle = 'rgba(0,0,0,0.6)';
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
        snakeCtx.fillStyle = '#fff';
        snakeCtx.font = 'bold 28px Arial';
        snakeCtx.textAlign = 'center';
        snakeCtx.fillText('已暂停', snakeCanvas.width / 2, snakeCanvas.height / 2);
    }
}

function spawnSnakeFood() {
    const cols = snakeCanvas.width / 20;
    const rows = snakeCanvas.height / 20;

    do {
        snakeFood = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    } while (snake.some(segment => segment.x === snakeFood.x && segment.y === snakeFood.y));
}

function snakeTick() {
    if (!snakeIsRunning) return;

    snakeDirection = snakeNextDirection;

    const head = { ...snake[0] };
    const cols = snakeCanvas.width / 20;
    const rows = snakeCanvas.height / 20;

    switch(snakeDirection) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // 碰撞检测
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOverSnake();
        return;
    }

    snake.unshift(head);

    // 吃食物
    if (head.x === snakeFood.x && head.y === snakeFood.y) {
        snakeScore += 10;
        spawnSnakeFood();

        // 加速
        if (snakeSpeed > 50) {
            snakeSpeed -= 2;
            if (snakeGameInterval) clearInterval(snakeGameInterval);
            snakeGameInterval = setInterval(snakeTick, snakeSpeed);
        }
    } else {
        snake.pop();
    }

    drawSnake();
    updateSnakeScore();
}

function handleSnakeKey(e) {
    if (!snakeIsRunning) return;

    // 阻止方向键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp':
            if (snakeDirection !== 'down') snakeNextDirection = 'up';
            break;
        case 'ArrowDown':
            if (snakeDirection !== 'up') snakeNextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (snakeDirection !== 'right') snakeNextDirection = 'left';
            break;
        case 'ArrowRight':
            if (snakeDirection !== 'left') snakeNextDirection = 'right';
            break;
    }
}

function updateSnakeScore() {
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = `分数: ${snakeScore}`;
}

function drawSnake() {
    if (!snakeCtx) return;

    // 清空画布
    snakeCtx.fillStyle = '#0f172a';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // 绘制网格
    snakeCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    snakeCtx.lineWidth = 1;
    for (let x = 0; x <= snakeCanvas.width; x += 20) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(x, 0);
        snakeCtx.lineTo(x, snakeCanvas.height);
        snakeCtx.stroke();
    }
    for (let y = 0; y <= snakeCanvas.height; y += 20) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(0, y);
        snakeCtx.lineTo(snakeCanvas.width, y);
        snakeCtx.stroke();
    }

    // 绘制食物
    if (snakeFood) {
        snakeCtx.fillStyle = '#ef4444';
        snakeCtx.beginPath();
        snakeCtx.arc(
            snakeFood.x * 20 + 10,
            snakeFood.y * 20 + 10,
            8, 0, Math.PI * 2
        );
        snakeCtx.fill();

        // 食物光晕
        snakeCtx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        snakeCtx.beginPath();
        snakeCtx.arc(
            snakeFood.x * 20 + 10,
            snakeFood.y * 20 + 10,
            12, 0, Math.PI * 2
        );
        snakeCtx.fill();
    }

    // 绘制蛇身
    snake.forEach((segment, index) => {
        const alpha = 1 - (index / snake.length) * 0.5;
        snakeCtx.fillStyle = index === 0 ? '#22c55e' : `rgba(34, 197, 94, ${alpha})`;
        snakeCtx.fillRect(
            segment.x * 20 + 2,
            segment.y * 20 + 2,
            16, 16
        );

        // 蛇头眼睛
        if (index === 0) {
            snakeCtx.fillStyle = '#fff';
            snakeCtx.beginPath();
            snakeCtx.arc(segment.x * 20 + 7, segment.y * 20 + 7, 3, 0, Math.PI * 2);
            snakeCtx.arc(segment.x * 20 + 13, segment.y * 20 + 7, 3, 0, Math.PI * 2);
            snakeCtx.fill();
        }
    });

    // 绘制分数
    snakeCtx.fillStyle = '#fff';
    snakeCtx.font = 'bold 18px Arial';
    snakeCtx.textAlign = 'right';
    snakeCtx.fillText(`分数: ${snakeScore}`, snakeCanvas.width - 10, 30);
}

function gameOverSnake() {
    snakeIsRunning = false;
    if (snakeGameInterval) clearInterval(snakeGameInterval);
    snakeGameInterval = null;

    // 移除事件监听
    if (snakeKeyHandler) {
        document.removeEventListener('keydown', snakeKeyHandler);
        snakeKeyHandler = null;
    }

    // 点击画布重新开始
    snakeCanvas.addEventListener('click', function restart() {
        snakeCanvas.removeEventListener('click', restart);
        resetSnake();
        drawSnake();
        // 重新绑定键盘事件
        snakeKeyHandler = function(e) { handleSnakeKey(e); };
        document.addEventListener('keydown', snakeKeyHandler);
    });

    snakeCtx.fillStyle = 'rgba(0,0,0,0.7)';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    snakeCtx.fillStyle = '#fff';
    snakeCtx.font = 'bold 30px Arial';
    snakeCtx.textAlign = 'center';
    snakeCtx.fillText('游戏结束', snakeCanvas.width / 2, snakeCanvas.height / 2 - 20);
    snakeCtx.font = '18px Arial';
    snakeCtx.fillText(`最终分数: ${snakeScore}`, snakeCanvas.width / 2, snakeCanvas.height / 2 + 10);
    snakeCtx.fillText('点击重新开始', snakeCanvas.width / 2, snakeCanvas.height / 2 + 40);
}

// ========== 统一的游戏控制接口（供 game.html 调用）==========
window.gameStart = function() {
    if (window.__activeGame === 'tetris') startTetrisGame();
    else if (window.__activeGame === 'snake') startSnakeGame();
};

window.gamePause = function() {
    if (window.__activeGame === 'tetris') pauseTetrisGame();
    else if (window.__activeGame === 'snake') pauseSnakeGame();
};
