import { gameState, reportResult, reportLoss } from '../app.js';

const TOTAL_MINES = 5;
const container = document.getElementById('game-container');

container.innerHTML = `
    <div class="base-panel text-center flex flex-col items-center">
        <h2 class="text-3xl font-extrabold mb-4 text-white tracking-widest">MINES</h2>
        <div class="flex justify-between w-full max-w-[280px] text-sm bg-black/50 p-3 rounded-lg border border-cyberAccent/30 mb-4 font-mono text-cyberAccent">
            <div>СТАВКА: <span class="font-bold text-white">${gameState.bet}</span> 💎</div>
            <div>Х: <span id="mines-mult" class="font-bold text-cyberSuccess">1.00</span></div>
        </div>
        
        <div id="mines-grid" class="grid grid-cols-5 gap-2 justify-center mb-6"></div>
        
        <button id="mines-take-btn" class="cyber-btn w-full max-w-[280px] py-4 text-xl rounded-xl" disabled>ИЗВЛЕЧЬ РЕСУРСЫ</button>
    </div>
`;

const gridEl = document.getElementById('mines-grid');
const takeBtn = document.getElementById('mines-take-btn');
const multEl = document.getElementById('mines-mult');

let minesGrid = [];
let isOver = false;
let gemsFound = 0;
let currentMult = 1.0;

const positions = Array.from({ length: 25 }, (_, i) => i).sort(() => Math.random() - 0.5);
const mineSet = new Set(positions.slice(0, TOTAL_MINES));

for (let i = 0; i < 25; i++) {
    const hasMine = mineSet.has(i);
    minesGrid.push(hasMine);

    const cell = document.createElement('div');
    cell.className = "w-12 h-12 bg-cyberPanel rounded-lg flex items-center justify-center text-2xl cursor-pointer shadow-md border border-gray-600 transition-colors duration-200 transform hover:scale-105 active:scale-95";

    cell.onclick = () => reveal(cell, i, hasMine);
    gridEl.appendChild(cell);
}

takeBtn.onclick = () => {
    if (isOver || gemsFound === 0) return;
    isOver = true;
    revealAll();
    const win = (gameState.bet * currentMult).toFixed(0);
    reportResult(win);
};

function reveal(cell, idx, hasMine) {
    if (isOver || cell.classList.contains('revealed')) return;
    cell.classList.add('revealed');

    if (hasMine) {
        cell.innerHTML = '💣';
        cell.classList.replace('bg-cyberPanel', 'bg-cyberDanger');
        cell.classList.replace('border-gray-600', 'border-red-400');
        isOver = true;
        takeBtn.disabled = true;
        revealAll();
        reportLoss();
    } else {
        cell.innerHTML = '💎';
        cell.classList.replace('bg-cyberPanel', 'bg-cyberEmerald');
        cell.classList.replace('text-tgText', 'text-black');
        gemsFound++;

        currentMult *= 1.15 + (gemsFound * 0.02);
        multEl.innerText = currentMult.toFixed(2);

        takeBtn.disabled = false;
        takeBtn.innerText = `ИЗВЛЕЧЬ ${(gameState.bet * currentMult).toFixed(0)} 💎`;

        if (gemsFound === 25 - TOTAL_MINES) {
            takeBtn.click();
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
