// ========== 纸牌接龙 (Klondike Solitaire) ==========
let solCanvas, solCtx;
let solDeck = [];         // draw pile
let solStock = [];        // remaining stock
let solWaste = [];        // waste pile top
let solFoundations = [[], [], [], []]; // Ace~King
let solTables = [[], [], [], [], [], [], []]; // tableau
let solDragging = null;   // {cards, startX, startY, srcCol}
let solSelected = null;   // {type, colIdx, cardIdx}
let solScore = 0;
let solMoves = 0;
let solIsRunning = false;
let solCardW = 62;
let solCardH = 88;
let solGapX = 70;
let solGapY = 22;
let solOffsetX = 10;
let solOffsetY = 10;
let solKeyHandler = null;

const SUITS = ['♠','♥','♦','♣'];
const COLORS = {'♠':'#1e293b','♣':'#1e293b','♥':'#dc2626','♦':'#dc2626'};
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function solSuitColor(suit) {
    return COLORS[suit] || '#1e293b';
}

function solNewDeck() {
    let deck = [];
    for (let s of SUITS) {
        for (let i = 0; i < 13; i++) {
            deck.push({ suit, rank: RANKS[i], faceUp: false });
        }
    }
    return deck;
}

function solShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function solInit() {
    solDeck = solNewDeck();
    solShuffle(solDeck);
    solStock = [...solDeck];
    solWaste = [];
    solFoundations = [[], [], [], []];
    solTables = [[], [], [], [], [], [], []];
    solScore = 0;
    solMoves = 0;
    solIsRunning = false;
    solDragging = null;
    solSelected = null;

    // Deal tableau
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = solStock.pop();
            card.faceUp = (row === col);
            solTables[col].push(card);
        }
    }
    solDrawPileUpdate();
    solDraw();
    solUpdateScore();
}

function solDrawPileUpdate() {
    // stock is already separate, waste removed from it on click
}

function solStartGame() {
    if (solIsRunning) return;
    solInit();
    solIsRunning = true;
    solSetupInput();
}

function solSetupInput() {
    if (solKeyHandler) {
        solCanvas.removeEventListener('mousedown', solKeyHandler);
        solCanvas.removeEventListener('touchstart', solKeyHandler, {passive: false});
    }
    solKeyHandler = function(e) {
        e.preventDefault();
        const rect = solCanvas.getBoundingClientRect();
        const scale = solCanvas.width / rect.width;
        let mx, my;
        if (e.type === 'touchstart') {
            mx = (e.touches[0].clientX - rect.left) * scale;
            my = (e.touches[0].clientY - rect.top) * scale;
        } else {
            mx = (e.clientX - rect.left) * scale;
            my = (e.clientY - rect.top) * scale;
        }
        solHandleClick(mx, my, e.type === 'touchstart');
    };
    solCanvas.addEventListener('mousedown', solKeyHandler);
    solCanvas.addEventListener('touchstart', solKeyHandler, {passive: false});
}

function solHandleClick(mx, my, isTouch) {
    if (!solIsRunning) return;
    const W = solCanvas.width, H = solCanvas.height;
    const CY = solOffsetY + solCardH;

    // Stock pile
    const sx = solOffsetX, sy = solOffsetY;
    if (mx >= sx && mx <= sx + solCardW && my >= sy && my <= sy + solCardH) {
        solStockDraw();
        return;
    }
    // Foundation empty area
    for (let i = 0; i < 4; i++) {
        const fx = sx + solCardW + 10 + i * (solCardW + 8);
        if (mx >= fx && mx <= fx + solCardW && my >= sy && my <= sy + solCardH) {
            // Clicked foundation empty slot
            solTryMoveToFoundation(null, i, mx, my);
            return;
        }
    }
    // Foundations with cards
    for (let i = 0; i < 4; i++) {
        const fc = solFoundations[i];
        if (fc.length > 0) {
            const fx = sx + solCardW + 10 + i * (solCardW + 8);
            const fy = sy;
            if (mx >= fx && mx <= fx + solCardW && my >= fy && my <= fy + solCardH) {
                solSelected = { type: 'foundation', idx: i };
                solDraw();
                return;
            }
        }
    }
    // Waste
    if (solWaste.length > 0) {
        const wx = sx + solCardW + 10;
        const wy = sy;
        if (mx >= wx && mx <= wx + solCardW && my >= wy && my <= wy + solCardH) {
            solSelected = { type: 'waste' };
            solDraw();
            return;
        }
    }
    // Tableau
    const tx = solOffsetX;
    for (let col = 0; col < 7; col++) {
        const topY = CY + col * solGapY;
        // Check all face-up cards in this column
        for (let i = solTables[col].length - 1; i >= 0; i--) {
            const card = solTables[col][i];
            if (!card.faceUp) continue;
            const cy = topY + i * solGapY;
            if (mx >= tx && mx <= tx + solCardW && my >= cy && my <= cy + solCardH) {
                // Start drag from this card or below
                const selectedCards = solTables[col].slice(i);
                solDragging = { cards: selectedCards, startX: mx, startY: my, srcCol: col, srcIdx: i };
                solDraw();
                solSetupDrag();
                return;
            }
        }
        // Check empty column area
        if (solTables[col].length === 0) {
            const cy = topY;
            if (mx >= tx && mx <= tx + solCardW && my >= cy && my <= cy + solCardH) {
                solSelected = { type: 'empty-tableau', col };
                solDraw();
                return;
            }
        }
    }
    // Deselect
    solSelected = null;
    solDraw();
}

function solSetupDrag() {
    const onMove = (e) => {
        e.preventDefault();
        if (!solDragging) return;
        const rect = solCanvas.getBoundingClientRect();
        const scale = solCanvas.width / rect.width;
        let mx, my;
        if (e.type === 'touchmove') {
            mx = (e.touches[0].clientX - rect.left) * scale;
            my = (e.touches[0].clientY - rect.top) * scale;
        } else {
            mx = (e.clientX - rect.left) * scale;
            my = (e.clientY - rect.top) * scale;
        }
        solDragging.curX = mx;
        solDragging.curY = my;
        solDraw();
    };
    const onEnd = (e) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        if (!solDragging) return;
        const endX = solDragging.curX ?? solDragging.startX;
        const endY = solDragging.curY ?? solDragging.startY;
        solDropDrag(endX, endY);
        solDragging = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, {passive: false});
    document.addEventListener('touchend', onEnd);
}

function solDropDrag(mx, my) {
    if (!solDragging) return;
    const cards = solDragging.cards;
    const srcCol = solDragging.srcCol;
    const tx = solOffsetX;
    // Check drop on tableau columns
    for (let col = 0; col < 7; col++) {
        if (col === srcCol) continue;
        const topY = solOffsetY + solCardH + col * solGapY;
        const targetCards = solTables[col];
        const dropY = targetCards.length > 0 ? topY + (targetCards.length - 1) * solGapY : topY;
        // Check if mouse is near the target column area
        if (mx >= tx - 20 && mx <= tx + solCardW + 20) {
            // Try to place
            if (targetCards.length === 0) {
                // Can only place King on empty column
                if (cards[0].rank === 'K') {
                    solDoMoveTableau(srcCol, solDragging.srcIdx, col);
                    return;
                }
            } else {
                const bottom = targetCards[targetCards.length - 1];
                const top = cards[0];
                if (bottom.suit !== top.suit && solSuitColor(bottom.suit) !== solSuitColor(top.suit)) {
                    const bottomRankIdx = RANKS.indexOf(bottom.rank);
                    const topRankIdx = RANKS.indexOf(top.rank);
                    if (topRankIdx === bottomRankIdx - 1) {
                        solDoMoveTableau(srcCol, solDragging.srcIdx, col);
                        return;
                    }
                }
            }
        }
    }
    // Check drop on foundation
    const sy = solOffsetY;
    for (let i = 0; i < 4; i++) {
        const fx = tx + solCardW + 10 + i * (solCardW + 8);
        if (mx >= fx - 10 && mx <= fx + solCardW + 10 && my >= sy - 20 && my <= sy + solCardH + 20) {
            if (cards.length === 1) {
                solTryMoveToFoundation(i, null, mx, my);
                return;
            }
        }
    }
    solDraw();
}

function solTryMoveToFoundation(foundationIdx, emptyCol, mx, my) {
    let card = null;
    let srcType = null, srcCol = -1;

    if (solSelected && solSelected.type === 'waste') {
        card = solWaste[solWaste.length - 1];
        srcType = 'waste';
    } else if (solSelected && solSelected.type === 'foundation') {
        const fc = solFoundations[solSelected.idx];
        if (fc.length > 0) card = fc[fc.length - 1];
        srcType = 'foundation';
        srcCol = solSelected.idx;
    }

    if (!card) return;

    // Determine target foundation
    let target = foundationIdx;
    if (target === null) {
        // Try to find matching foundation
        const color = solSuitColor(card.suit);
        for (let i = 0; i < 4; i++) {
            const fc = solFoundations[i];
            if (fc.length === 0) {
                // Accept any suit on empty foundation? No, should match visible card suit
                continue;
            }
            const top = fc[fc.length - 1];
            if (solSuitColor(top.suit) === color) {
                target = i;
                break;
            }
        }
        if (target === null) {
            // Allow placing on any empty foundation
            for (let i = 0; i < 4; i++) {
                if (solFoundations[i].length === 0) { target = i; break; }
            }
        }
    }
    if (target === null) return;

    const fc = solFoundations[target];
    const canPlace = fc.length === 0
        ? card.rank === 'A'
        : solSuitColor(fc[fc.length - 1].suit) === solSuitColor(card.suit)
          && RANKS.indexOf(fc[fc.length - 1].rank) === RANKS.indexOf(card.rank) - 1;

    if (canPlace) {
        if (srcType === 'waste') {
            solWaste.pop();
            solScore += 10;
        } else if (srcType === 'foundation') {
            solFoundations[srcCol].pop();
        }
        fc.push(card);
        solMoves++;
        solDraw();
        solUpdateScore();
        solCheckWin();
    }
}

function solDoMoveTableau(srcCol, srcIdx, destCol) {
    const cards = solTables[srcCol].splice(srcIdx);
    solTables[destCol] = solTables[destCol].concat(cards);
    // Flip new top of source if needed
    if (srcIdx > 0) {
        solTables[srcCol][srcIdx - 1].faceUp = true;
        solScore += 5;
    }
    solMoves++;
    solScore += cards.length * 5;
    solDraw();
    solUpdateScore();
}

function solStockDraw() {
    if (solStock.length === 0) {
        // Recycle waste to stock
        solStock = solWaste.reverse();
        solWaste = [];
        for (let c of solStock) c.faceUp = false;
    } else {
        const card = solStock.pop();
        card.faceUp = true;
        solWaste.push(card);
    }
    solMoves++;
    solDraw();
    solUpdateScore();
}

function solCheckWin() {
    if (solFoundations.every(f => f.length === 13)) {
        solIsRunning = false;
        solDraw();
        setTimeout(() => {
            solCtx.fillStyle = 'rgba(0,0,0,0.6)';
            solCtx.fillRect(0, 0, solCanvas.width, solCanvas.height);
            solCtx.fillStyle = '#ffd700';
            solCtx.font = 'bold 32px Arial';
            solCtx.textAlign = 'center';
            solCtx.fillText('🎉 恭喜通关！', solCanvas.width / 2, solCanvas.height / 2 - 10);
            solCtx.fillStyle = '#fff';
            solCtx.font = '18px Arial';
            solCtx.fillText(`得分: ${solScore} | 步数: ${solMoves}`, solCanvas.width / 2, solCanvas.height / 2 + 25);
            solCtx.fillText('点击"开始游戏"重新开始', solCanvas.width / 2, solCanvas.height / 2 + 55);
        }, 300);
    }
}

function solUpdateScore() {
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = `分数: ${solScore}`;
}

function solDrawCard(ctx, x, y, w, h, card, faceDown) {
    const r = 6;
    ctx.fillStyle = faceDown ? '#1e3a5f' : '#fff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    // Border
    ctx.strokeStyle = faceDown ? '#0f2744' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (faceDown) {
        // Pattern on back
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 6, w - 12, h - 12, 3);
        ctx.fill();
        ctx.fillStyle = '#1e3a5f';
        ctx.font = `bold ${Math.floor(h * 0.35)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x + w / 2, y + h / 2);
        return;
    }

    const color = solSuitColor(card.suit);
    const rank = card.rank;
    // Corner rank+suit
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(h * 0.2)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, x + 5, y + 5);
    ctx.font = `${Math.floor(h * 0.17)}px Arial`;
    ctx.fillText(card.suit, x + 5, y + 5 + h * 0.2);

    // Center suit
    ctx.font = `bold ${Math.floor(h * 0.35)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.suit, x + w / 2, y + h / 2);

    // Bottom-right rotated
    ctx.save();
    ctx.translate(x + w - 5, y + h - 5);
    ctx.rotate(Math.PI);
    ctx.font = `bold ${Math.floor(h * 0.2)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, 0, 0);
    ctx.font = `${Math.floor(h * 0.17)}px Arial`;
    ctx.fillText(card.suit, 0, h * 0.2);
    ctx.restore();
}

function solDraw() {
    if (!solCtx) return;
    const W = solCanvas.width, H = solCanvas.height;
    solCtx.clearRect(0, 0, W, H);

    // Background
    solCtx.fillStyle = '#1a5f2a';
    solCtx.fillRect(0, 0, W, H);

    // Subtle pattern
    solCtx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < W; x += 40) {
        for (let y = 0; y < H; y += 40) {
            if ((x + y) % 80 === 0) solCtx.fillRect(x, y, 20, 20);
        }
    }

    const tx = solOffsetX;
    const sx = solOffsetX;
    const sy = solOffsetY;
    const CY = sy + solCardH;

    // Foundation slots (background)
    for (let i = 0; i < 4; i++) {
        const fx = sx + solCardW + 10 + i * (solCardW + 8);
        solCtx.strokeStyle = 'rgba(255,255,255,0.25)';
        solCtx.lineWidth = 2;
        solCtx.beginPath();
        solCtx.roundRect(fx, sy, solCardW, solCardH, 6);
        solCtx.stroke();
        solCtx.fillStyle = 'rgba(255,255,255,0.08)';
        solCtx.font = `${Math.floor(solCardH * 0.4)}px Arial`;
        solCtx.textAlign = 'center';
        solCtx.textBaseline = 'middle';
        solCtx.fillText(['♠','♥','♦','♣'][i], fx + solCardW / 2, sy + solCardH / 2);
    }

    // Stock
    const stockX = sx, stockY = sy;
    if (solStock.length > 0) {
        solDrawCard(solCtx, stockX, stockY, solCardW, solCardH, {suit:'', rank:'', faceUp:false}, true);
        // Stack effect
        if (solStock.length > 1) {
            solCtx.strokeStyle = '#1e3a5f';
            solCtx.lineWidth = 1;
            for (let i = 1; i < Math.min(solStock.length, 5); i++) {
                solCtx.beginPath();
                solCtx.roundRect(stockX + i, stockY + i, solCardW - i * 2, solCardH - i * 2, 6);
                solCtx.stroke();
            }
        }
    } else {
        // Reset button
        solCtx.strokeStyle = 'rgba(255,255,255,0.4)';
        solCtx.lineWidth = 2;
        solCtx.beginPath();
        solCtx.roundRect(stockX, stockY, solCardW, solCardH, 6);
        solCtx.stroke();
        solCtx.fillStyle = 'rgba(255,255,255,0.5)';
        solCtx.font = `${Math.floor(solCardH * 0.35)}px Arial`;
        solCtx.textAlign = 'center';
        solCtx.textBaseline = 'middle';
        solCtx.fillText('↺', stockX + solCardW / 2, stockY + solCardH / 2);
    }

    // Waste
    const wasteX = sx + solCardW + 10;
    if (solWaste.length > 0) {
        solDrawCard(solCtx, wasteX, stockY, solCardW, solCardH, solWaste[solWaste.length - 1], false);
        if (solWaste.length > 1) {
            solCtx.strokeStyle = '#475569';
            solCtx.lineWidth = 1;
            solCtx.beginPath();
            solCtx.roundRect(wasteX - 3, stockY - 3, solCardW + 6, solCardH + 6, 8);
            solCtx.stroke();
        }
    }

    // Foundations
    for (let i = 0; i < 4; i++) {
        const fx = sx + solCardW + 10 + i * (solCardW + 8);
        const fc = solFoundations[i];
        if (fc.length > 0) {
            solDrawCard(solCtx, fx, stockY, solCardW, solCardH, fc[fc.length - 1], false);
        }
    }

    // Tableau
    for (let col = 0; col < 7; col++) {
        const colX = tx + col * solGapX;
        const topY = CY + col * solGapY;
        const cards = solTables[col];
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cy = topY + i * solGapY;
            const isFaceUp = card.faceUp;

            // Highlight if selected
            if (solSelected && solSelected.type === 'empty-tableau' && solSelected.col === col && cards.length === 0) {
                solCtx.strokeStyle = 'rgba(255,255,255,0.5)';
                solCtx.lineWidth = 2;
                solCtx.setLineDash([5, 5]);
                solCtx.beginPath();
                solCtx.roundRect(colX, cy, solCardW, solCardH, 6);
                solCtx.stroke();
                solCtx.setLineDash([]);
            }

            solDrawCard(solCtx, colX, cy, solCardW, solCardH, card, !isFaceUp);
        }
        // Empty column slot
        if (cards.length === 0) {
            solCtx.strokeStyle = 'rgba(255,255,255,0.15)';
            solCtx.lineWidth = 2;
            solCtx.setLineDash([5, 5]);
            solCtx.beginPath();
            solCtx.roundRect(colX, topY, solCardW, solCardH, 6);
            solCtx.stroke();
            solCtx.setLineDash([]);
        }
    }

    // Dragging cards
    if (solDragging) {
        const dy = (solDragging.curY ?? solDragging.startY) - solDragging.startY;
        const dx = (solDragging.curX ?? solDragging.startX) - solDragging.startX;
        for (let i = 0; i < solDragging.cards.length; i++) {
            const card = solDragging.cards[i];
            const cx = (solDragging.curX ?? solDragging.startX);
            const cy = (solDragging.curY ?? solDragging.startY) + i * solGapY + dy;
            solDrawCard(solCtx, cx, cy, solCardW, solCardH, card, false);
        }
    }
}

window.__initSolitaire = function() {
    solCanvas = document.getElementById('gameCanvas');
    if (!solCanvas) return;
    const W = Math.min(700, window.innerWidth - 40);
    const H = Math.min(520, window.innerHeight - 180);
    solCanvas.width = W;
    solCanvas.height = H;
    solCtx = solCanvas.getContext('2d');
    solOffsetX = Math.max(10, (W - solCardW * 7 - solGapX * 6) / 2);
    solInit();
    solDraw();
};

window.__startSolitaire = function() { solStartGame(); };
window.__pauseSolitaire = function() {
    // Solitaire doesn't have pause, but show message
    solIsRunning = false;
    solDraw();
    setTimeout(() => {
        solIsRunning = true;
        solDraw();
    }, 1500);
};
