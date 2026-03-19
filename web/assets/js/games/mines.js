import { gameState, submitGamePlay, renderBetControls } from '../app.js';

export function initGame() {
    const TOTAL_MINES = 5;
    const container = document.getElementById('game-container');

    container.innerHTML = `
        <div class="base-panel text-center flex flex-col items-center animate-[fadeIn_0.3s_ease]">
            <h2 class="text-3xl font-black mb-2 text-white tracking-widest text-center">MINES</h2>
            
            <div id="mines-grid" class="grid grid-cols-5 gap-2 justify-center mb-6"></div>
            
            <div class="flex justify-between w-full text-sm bg-black/50 p-3 rounded-lg border border-cyberAccent/30 mb-4 font-mono text-cyberAccent">
                <div>МНОЖИТЕЛЬ: <span id="mines-mult" class="font-bold text-cyberSuccess">1.00</span>x</div>
                <div>МИН: <span class="font-bold text-cyberDanger">${TOTAL_MINES}</span> 💣</div>
            </div>

            ${renderBetControls('mines')}
            
            <button id="mines-action-btn" class="cyber-btn w-full py-4 text-xl rounded-xl">НАЧАТЬ ИГРУ</button>
        </div>
    `;

    const gridEl = document.getElementById('mines-grid');
    const actionBtn = document.getElementById('mines-action-btn');
    const multEl = document.getElementById('mines-mult');

    let minesGrid = [];
    let isPlaying = false;
    let isOver = false;
    let gemsFound = 0;
    let currentMult = 1.0;

    function buildGrid() {
        gridEl.innerHTML = '';
        minesGrid = [];
        const positions = Array.from({ length: 25 }, (_, i) => i).sort(() => Math.random() - 0.5);
        const mineSet = new Set(positions.slice(0, TOTAL_MINES));

        for (let i = 0; i < 25; i++) {
            const hasMine = mineSet.has(i);
            minesGrid.push(hasMine);

            const cell = document.createElement('div');
            cell.className = "w-12 h-12 bg-cyberPanel rounded-lg flex items-center justify-center text-2xl cursor-pointer shadow-md border border-gray-600 transition-colors duration-200 transform hover:scale-105 active:scale-95";

            cell.onclick = () => {
                if (!isPlaying) return;
                reveal(cell, i, hasMine);
            };
            gridEl.appendChild(cell);
        }
    }

    buildGrid();

    actionBtn.onclick = () => {
        if (!isPlaying) {
            if (gameState.bet <= 0 || gameState.bet > gameState.balance) {
                window.Telegram.WebApp.showAlert("Недостаточно средств!");
                return;
            }
            isPlaying = true;
            isOver = false;
            gemsFound = 0;
            currentMult = 1.0;
            multEl.innerText = "1.00";
            buildGrid();
            actionBtn.innerText = "ЗАБРАТЬ (1.00x)";
            actionBtn.disabled = true;
        } else {
            if (isOver || gemsFound === 0) return;
            isOver = true;
            isPlaying = false;
            revealAll();
            const win = Math.floor(gameState.bet * currentMult);
            submitGamePlay('mines', gameState.bet, win);
            actionBtn.innerText = "ИГРАТЬ СНОВА";
        }
    };

    function reveal(cell, idx, hasMine) {
        if (isOver || !isPlaying || cell.classList.contains('revealed')) return;
        cell.classList.add('revealed');

        if (hasMine) {
            cell.innerHTML = '💣';
            cell.classList.replace('bg-cyberPanel', 'bg-cyberDanger');
            cell.classList.replace('border-gray-600', 'border-red-400');
            isOver = true;
            isPlaying = false;
            revealAll();
            submitGamePlay('mines', gameState.bet, 0); // Loss
            actionBtn.innerText = "ИГРАТЬ СНОВА";
            actionBtn.disabled = false;
        } else {
            cell.innerHTML = '💎';
            cell.classList.replace('bg-cyberPanel', 'bg-cyberEmerald');
            cell.classList.replace('text-tgText', 'text-black');
            gemsFound++;

            currentMult *= 1.15 + (gemsFound * 0.02);
            multEl.innerText = currentMult.toFixed(2);

            actionBtn.disabled = false;
            actionBtn.innerText = `ЗАБРАТЬ ${Math.floor(gameState.bet * currentMult)} 💎`;

            if (gemsFound === 25 - TOTAL_MINES) {
                actionBtn.click();
            }
        }
    }

    function revealAll() {
        const cells = gridEl.children;
        for (let i = 0; i < 25; i++) {
            if (!cells[i].classList.contains('revealed')) {
                cells[i].classList.add('opacity-50');
                cells[i].innerHTML = minesGrid[i] ? '💣' : '💎';
                if (minesGrid[i]) cells[i].classList.replace('bg-cyberPanel', 'bg-transparent');
            }
        }
    }
}
