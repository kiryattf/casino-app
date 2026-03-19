import { gameState, reportResult, reportLoss } from '../app.js';

const container = document.getElementById('game-container');

container.innerHTML = `
    <div class="base-panel text-center">
        <h2 class="text-3xl font-extrabold mb-4 text-white tracking-widest">CRASH</h2>
        <div id="crash-status" class="text-sm text-tgHint uppercase tracking-widest mb-2 font-mono">СТАБИЛИЗАЦИЯ...</div>
        
        <canvas id="crash-canvas" width="300" height="150" class="w-full bg-black/40 rounded-xl mb-4 border border-cyberPanel"></canvas>
        
        <div id="crash-multiplier" class="text-5xl font-extrabold my-4 transition-colors duration-200 text-white font-mono z-10 w-full text-center">1.00x</div>
        <div class="text-lg bg-black/50 p-3 rounded-lg border border-cyberAccent/30 mb-6 font-mono text-cyberAccent">
            СТАВКА: <span class="font-bold">${gameState.bet}</span> 💎
        </div>
        <button id="crash-btn" class="cyber-btn w-full py-4 text-xl rounded-xl hidden">ЭКСТРАГИРОВАТЬ</button>
    </div>
`;

const canvas = document.getElementById('crash-canvas');
const ctx = canvas.getContext('2d');
const cBtn = document.getElementById('crash-btn');
const statusText = document.getElementById('crash-status');
const multText = document.getElementById('crash-multiplier');

let currentMult = 1.0;
let isCrashed = false;
let isTaken = false;
let crashPoint = 0;
let loopId;
let t = 0;
const history = [{ x: 0, mult: 1.0 }];

// Setup
crashPoint = Math.random() < 0.7 ? 1 + Math.random() * 1.5 : 2.5 + Math.random() * 5;
let countdown = 3;

const timer = setInterval(() => {
    statusText.innerText = `ПОВОРОТ КЛЮЧА ЧЕРЕЗ ${countdown}...`;
    countdown--;
    if (countdown < 0) {
        clearInterval(timer);
        start();
    }
}, 1000);

cBtn.onclick = () => {
    if (isCrashed || isTaken) return;
    isTaken = true;
    cBtn.disabled = true;
    cBtn.innerText = "ЭКСТРАГИРОВАН!";

    multText.classList.add('text-cyberSuccess');
    statusText.innerText = "УСПЕШНО ✅";

    const win = (gameState.bet * currentMult).toFixed(0);
    reportResult(win);
};

function start() {
    cBtn.classList.remove('hidden');
    statusText.innerText = "НАБОР ВЫСОТЫ";

    loopId = requestAnimationFrame(update);
}

function update(timeParam) {
    if (isCrashed) return;

    t += 1;
    currentMult += 0.005 + (currentMult * 0.002);
    multText.innerText = currentMult.toFixed(2) + "x";

    if (t % 2 === 0) {
        history.push({ x: t, mult: currentMult });
    }

    drawCurve();

    if (currentMult >= crashPoint) {
        isCrashed = true;
        statusText.innerText = "СИСТЕМА РАЗРУШЕНА 💥";
        multText.classList.replace('text-white', 'text-cyberDanger');
        cBtn.classList.add('hidden');
        drawCurve(true);

        if (!isTaken) reportLoss();
        return;
    }

    loopId = requestAnimationFrame(update);
}

function drawCurve(crashed = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (history.length === 0) return;

    const maxT = Math.max(100, t);
    const maxMult = Math.max(2.0, currentMult);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let point of history) {
        const px = (point.x / maxT) * canvas.width;
        const py = canvas.height - ((point.mult - 1) / (maxMult - 1)) * canvas.height;
        ctx.lineTo(px, py);
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = crashed ? '#ff4444' : '#00ffaa';
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, crashed ? 'rgba(255,68,68,0.5)' : 'rgba(0,255,170,0.5)');
    g.addColorStop(1, crashed ? 'rgba(255,68,68,0.0)' : 'rgba(0,255,170,0.0)');
    ctx.fillStyle = g;
    ctx.fill();
}
