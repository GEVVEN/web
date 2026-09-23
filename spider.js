// ========== 蜘蛛纸牌 (Spider Solitaire - Single Suit) ==========
let spiderCanvas, spiderCtx;
let spiderDecks = 1; // 1 = single suit, 2 = two suits, 4 = four suits
let spiderStock = [];
let spiderTables = [[], [], [], [], [], [], [], [], [], []];
let spiderFoundations = 0;
let spiderScore = 0;
let spiderMoves = 0;
let spiderIsRunning = false;
let spiderCardW = 54;
let spiderCardH = 76;
let spiderGapY = 18;
let spiderOffsetX = 8;
let spiderOffsetY = 10;
let spiderDragging = null;
let spiderKeyHandler = null;
let spiderSuits = ['♠']; // single suit

const SPIDER_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function spiderSuitColor() { return '#1e293b'; }

function spiderNewDeck() {
    let deck = [];
    for (let s of spiderSuits) {
        for (let r = 0; r < 8; r++) { // 8 copies of each rank per suit
            deck.push({ suit: s, rank: SPIDER_RANKS[r], faceUp: false });
        }
    }
    return deck;
}

function spiderShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function spiderInit(suits = 1) {
    spiderSuits = suits === 1 ? ['♠'] : suits === 2 ? ['♠','♥'] : ['♠','♥','♦','♣'];
    spiderDecks = suits;

    let deck = spiderNewDeck();
    spiderShuffle(deck);

    spiderStock = deck.slice(50); // last cards become stock
    spiderTables = [[], [], [], [], [], [], [], [], [], []];

    // Deal 10 cards to each column (first 10 rows), first 4 columns get 6 cards, rest get 5
    let idx = 0;
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            if (row < 4 && col >= row) {
                const card = deck[idx++];
                card.faceUp = (row === 9); // only bottom card face up
                spiderTables[col].push(card);
            }
        }
    }
    // Actually deal properly: 10 cards per row, 5 rows = 50 cards in tableau
    // Column 0-3: 6 cards each, Column 4-9: 5 cards each
    spiderTables = [[], [], [], [], [], [], [], [], [], []];
    idx = 0;
    for (let col = 0; col < 10; col++) {
        const count = col < 4 ? 6 : 5;
        for (let row = 0; row < count; row++) {
            const card = deck[idx++];
            card.faceUp = (row === count - 1);
            spiderTables[col].push(card);
        }
    }
    spiderStock = deck.slice(idx);
    spiderFoundations = 0;
    spiderScore = 0;
    spiderMoves = 0;
    spiderIsRunning = false;
    spiderDragging = null;
    spiderDraw();
    spiderUpdateScore();
}

function spiderStartGame(suits = 1) {
    spiderInit(suits);
    spiderIsRunning = true;
    spiderSetupInput();
}

function spiderSetupInput() {
    if (spiderKeyHandler) {
        spiderCanvas.removeEventListener('mousedown', spiderKeyHandler);
        spiderCanvas.removeEventListener('touchstart', spiderKeyHandler, {passive: false});
    }
    spiderKeyHandler = function(e) {
        e.preventDefault();
        const rect = spiderCanvas.getBoundingClientRect();
        const scale = spiderCanvas.width / rect.width;
        let mx, my;
        if (e.type === 'touchstart') {
            mx = (e.touches[0].clientX - rect.left) * scale;
            my = (e.touches[0].clientY - rect.top) * scale;
        } else {
            mx = (e.clientX - rect.left) * scale;
            my = (e.clientY - rect.top) * scale;
        }
        spiderHandleClick(mx, my, e.type === 'touchstart');
    };
    spiderCanvas.addEventListener('mousedown', spiderKeyHandler);
    spiderCanvas.addEventListener('touchstart', spiderKeyHandler, {passive: false});
}

function spiderHandleClick(mx, my, isTouch) {
    if (!spiderIsRunning) return;
    const W = spiderCanvas.width;

    // Stock click area (right side, top)
    const stockX = W - spiderCardW - 15;
    const stockY = spiderOffsetY;
    if (mx >= stockX && mx <= stockX + spiderCardW && my >= stockY && my <= stockY + spiderCardH) {
        spiderStockDeal();
        return;
    }

    // Tableau columns
    for (let col = 0; col < 10; col++) {
        const colX = spiderOffsetX + col * (spiderCardW + 6);
        const topY = spiderOffsetY + spiderCardH;
        const cards = spiderTables[col];
        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            if (!card.faceUp) continue;
            const cy = topY + i * spiderGapY;
            if (mx >= colX && mx <= colX + spiderCardW && my >= cy && my <= cy + spiderCardH) {
                // Check if this card and all above it form a valid descending sequence
                const seqValid = spiderCheckSequence(col, i);
                if (seqValid) {
                    spiderDragging = { cards: cards.slice(i), startX: mx, startY: my, srcCol: col, srcIdx: i };
                    spiderSetupDrag();
                    spiderDraw();
                    return;
                } else {
                    // Just select the card
                    spiderDragging = { cards: [card], startX: mx, startY: my, srcCol: col, srcIdx: i };
                    spiderSetupDrag();
                    spiderDraw();
                    return;
                }
            }
        }
        // Empty column
        if (cards.length === 0) {
            const cy = topY;
            if (mx >= colX && mx <= colX + spiderCardW && my >= cy && my <= cy + spiderCardH) {
                spiderDragging = { cards: [], startX: mx, startY: my, srcCol: -1, srcIdx: -1 };
                spiderSetupDrag();
                return;
            }
        }
    }
    spiderDraw();
}

function spiderCheckSequence(col, idx) {
    const cards = spiderTables[col];
    for (let i = idx; i < cards.length - 1; i++) {
        if (!cards[i].faceUp || !cards[i + 1].faceUp) return false;
        const ri = SPIDER_RANKS.indexOf(cards[i].rank);
        const rj = SPIDER_RANKS.indexOf(cards[i + 1].rank);
        if (rj !== ri - 1) return false;
    }
    return true;
}

function spiderSetupDrag() {
    const onMove = (e) => {
        e.preventDefault();
        if (!spiderDragging) return;
        const rect = spiderCanvas.getBoundingClientRect();
        const scale = spiderCanvas.width / rect.width;
        if (e.type === 'touchmove') {
            spiderDragging.curX = (e.touches[0].clientX - rect.left) * scale;
            spiderDragging.curY = (e.touches[0].clientY - rect.top) * scale;
        } else {
            spiderDragging.curX = (e.clientX - rect.left) * scale;
            spiderDragging.curY = (e.clientY - rect.top) * scale;
        }
        spiderDraw();
    };
    const onEnd = (e) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        if (!spiderDragging) return;
        const endX = spiderDragging.curX ?? spiderDragging.startX;
        const endY = spiderDragging.curY ?? spiderDragging.startY;
        spiderDropDrag(endX, endY);
        spiderDragging = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, {passive: false});
    document.addEventListener('touchend', onEnd);
}

function spiderDropDrag(mx, my) {
    if (!spiderDragging) return;
    const cards = spiderDragging.cards;
    const srcCol = spiderDragging.srcCol;
    const W = spiderCanvas.width;

    // Check if dropping on stock area
    const stockX = W - spiderCardW - 15;
    if (mx >= stockX && mx <= stockX + spiderCardW + 10 && my >= spiderOffsetY - 10 && my <= spiderOffsetY + spiderCardH + 10) return;

    // Check tableau drops
    for (let col = 0; col < 10; col++) {
        if (col === srcCol) continue;
        const colX = spiderOffsetX + col * (spiderCardW + 6);
        if (mx >= colX - 20 && mx <= colX + spiderCardW + 20) {
            const targetCards = spiderTables[col];
            if (targetCards.length === 0) {
                // Can place any card on empty column
                spiderDoMoveTableau(srcCol, spiderDragging.srcIdx, col);
                return;
            } else {
                const bottom = targetCards[targetCards.length - 1];
                if (!bottom.faceUp) return;
                const bottomRankIdx = SPIDER_RANKS.indexOf(bottom.rank);
                const topRankIdx = SPIDER_RANKS.indexOf(cards[0].rank);
                if (topRankIdx === bottomRankIdx - 1) {
                    spiderDoMoveTableau(srcCol, spiderDragging.srcIdx, col);
                    return;
                }
            }
        }
    }
    spiderDraw();
}

function spiderDoMoveTableau(srcCol, srcIdx, destCol) {
    let cards;
    if (srcCol === -1) {
        // Moving from stock (shouldn't happen via drag, but handle it)
        return;
    }
    cards = spiderTables[srcCol].splice(srcIdx);
    spiderTables[destCol] = spiderTables[destCol].concat(cards);

    // Flip new top of source
    if (srcIdx > 0) {
        spiderTables[srcCol][srcIdx - 1].faceUp = true;
        spiderScore += 20;
    }

    spiderMoves++;
    spiderScore += cards.length * 10;

    // Check for completed sequence (K to A)
    spiderCheckCompletedSequence(destCol);

    spiderDraw();
    spiderUpdateScore();
}

function spiderCheckCompletedSequence(col) {
    const cards = spiderTables[col];
    if (cards.length < 13) return;
    // Check last 13 cards
    const seq = cards.slice(cards.length - 13);
    if (!seq.every(c => c.faceUp)) return;
    if (seq[0].rank !== 'K') return;
    for (let i = 0; i < 12; i++) {
        if (SPIDER_RANKS.indexOf(seq[i].rank) !== SPIDER_RANKS.indexOf(seq[i + 1].rank) - 1) return;
    }
    // Remove the sequence
    spiderTables[col] = cards.slice(0, cards.length - 13);
    spiderFoundations++;
    spiderScore += 100;

    // Flip new top
    if (spiderTables[col].length > 0) {
        spiderTables[col][spiderTables[col].length - 1].faceUp = true;
    }

    // Check win
    const totalCards = spiderTables.reduce((s, c) => s + c.length, 0) + spiderStock.length;
    if (spiderFoundations === 8) {
        spiderIsRunning = false;
        spiderDraw();
        setTimeout(() => {
            spiderCtx.fillStyle = 'rgba(0,0,0,0.6)';
            spiderCtx.fillRect(0, 0, spiderCanvas.width, spiderCanvas.height);
            spiderCtx.fillStyle = '#ffd700';
            spiderCtx.font = 'bold 28px Arial';
            spiderCtx.textAlign = 'center';
            spiderCtx.fillText('🎉 恭喜通关！', spiderCanvas.width / 2, spiderCanvas.height / 2 - 10);
            spiderCtx.fillStyle = '#fff';
            spiderCtx.font = '18px Arial';
            spiderCtx.fillText(`得分: ${spiderScore} | 步数: ${spiderMoves}`, spiderCanvas.width / 2, spiderCanvas.height / 2 + 25);
        }, 300);
    }
}

function spiderStockDeal() {
    if (spiderStock.length === 0) return;
    // Can only deal if all columns have cards
    if (spiderTables.some(col => col.length === 0)) return;
    for (let col = 0; col < 10; col++) {
        if (spiderStock.length > 0) {
            const card = spiderStock.pop();
            card.faceUp = true;
            spiderTables[col].push(card);
        }
    }
    spiderMoves++;
    spiderDraw();
    spiderUpdateScore();
}

function spiderUpdateScore() {
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = `分数: ${spiderScore}`;
}

function spiderDrawCard(ctx, x, y, w, h, card, faceDown) {
    const r = 5;
    ctx.fillStyle = faceDown ? '#1e3a5f' : '#fff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = faceDown ? '#0f2744' : '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (faceDown) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 3);
        ctx.fill();
        ctx.fillStyle = '#1e3a5f';
        ctx.font = `bold ${Math.floor(h * 0.3)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x + w / 2, y + h / 2);
        return;
    }

    const color = spiderSuitColor();
    const rank = card.rank;
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(h * 0.18)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, x + 4, y + 4);
    ctx.font = `${Math.floor(h * 0.15)}px Arial`;
    ctx.fillText(card.suit, x + 4, y + 4 + h * 0.18);

    // Center
    ctx.font = `bold ${Math.floor(h * 0.3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.suit, x + w / 2, y + h / 2);

    // Bottom rotated
    ctx.save();
    ctx.translate(x + w - 4, y + h - 4);
    ctx.rotate(Math.PI);
    ctx.font = `bold ${Math.floor(h * 0.18)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, 0, 0);
    ctx.font = `${Math.floor(h * 0.15)}px Arial`;
    ctx.fillText(card.suit, 0, h * 0.18);
    ctx.restore();
}

function spiderDraw() {
    if (!spiderCtx) return;
    const W = spiderCanvas.width, H = spiderCanvas.height;
    spiderCtx.clearRect(0, 0, W, H);

    spiderCtx.fillStyle = '#1a6b2a';
    spiderCtx.fillRect(0, 0, W, H);

    const stockX = W - spiderCardW - 15;
    const stockY = spiderOffsetY;

    // Stock
    if (spiderStock.length > 0) {
        spiderDrawCard(spiderCtx, stockX, stockY, spiderCardW, spiderCardH, {suit:'♠',rank:'?',faceUp:false}, true);
        if (spiderStock.length > 1) {
            spiderCtx.strokeStyle = '#1e3a5f';
            spiderCtx.lineWidth = 1;
            for (let i = 1; i < Math.min(spiderStock.length, 5); i++) {
                spiderCtx.beginPath();
                spiderCtx.roundRect(stockX + i, stockY + i, spiderCardW - i * 2, spiderCardH - i * 2, 6);
                spiderCtx.stroke();
            }
        }
    } else {
        spiderCtx.strokeStyle = 'rgba(255,255,255,0.3)';
        spiderCtx.lineWidth = 2;
        spiderCtx.beginPath();
        spiderCtx.roundRect(stockX, stockY, spiderCardW, spiderCardH, 6);
        spiderCtx.stroke();
    }

    // Tableau
    for (let col = 0; col < 10; col++) {
        const colX = spiderOffsetX + col * (spiderCardW + 6);
        const topY = spiderOffsetY + spiderCardH;
        const cards = spiderTables[col];
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cy = topY + i * spiderGapY;
            spiderDrawCard(spiderCtx, colX, cy, spiderCardW, spiderCardH, card, !card.faceUp);
        }
        if (cards.length === 0) {
            spiderCtx.strokeStyle = 'rgba(255,255,255,0.15)';
            spiderCtx.lineWidth = 2;
            spiderCtx.setLineDash([4, 4]);
            spiderCtx.beginPath();
            spiderCtx.roundRect(colX, topY, spiderCardW, spiderCardH, 6);
            spiderCtx.stroke();
            spiderCtx.setLineDash([]);
        }
    }

    // Dragging
    if (spiderDragging) {
        const dy = (spiderDragging.curY ?? spiderDragging.startY) - spiderDragging.startY;
        const dx = (spiderDragging.curX ?? spiderDragging.startX) - spiderDragging.startX;
        for (let i = 0; i < spiderDragging.cards.length; i++) {
            const card = spiderDragging.cards[i];
            const cx = (spiderDragging.curX ?? spiderDragging.startX);
            const cy = (spiderDragging.curY ?? spiderDragging.startY) + i * spiderGapY + dy;
            spiderDrawCard(spiderCtx, cx, cy, spiderCardW, spiderCardH, card, false);
        }
    }
}

window.__initSpider = function() {
    spiderCanvas = document.getElementById('gameCanvas');
    if (!spiderCanvas) return;
    const W = Math.min(800, window.innerWidth - 40);
    const H = Math.min(500, window.innerHeight - 180);
    spiderCardW = Math.min(54, (W - spiderOffsetX * 2 - 9 * 6) / 10);
    spiderCardH = spiderCardW * 1.4;
    spiderCanvas.width = W;
    spiderCanvas.height = H;
    spiderCtx = spiderCanvas.getContext('2d');
    spiderInit(1);
    spiderDraw();
};

window.__startSpider = function() { spiderStartGame(1); };
window.__pauseSpider = function() {
    spiderIsRunning = false;
    spiderDraw();
    setTimeout(() => { spiderIsRunning = true; spiderDraw(); }, 1500);
};
