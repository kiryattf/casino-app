import { gameState, submitGamePlay, renderBetControls } from '../app.js';

export function initGame() {
    const container = document.getElementById('game-container');

    container.innerHTML = `
        <div class="base-panel w-full flex flex-col items-center animate-[fadeIn_0.3s_ease]">
            <h2 class="text-3xl font-black mb-2 text-white tracking-widest text-center">CRASH</h2>
            <div id="crash-status" class="text-xs text-tgText/50 uppercase tracking-widest mb-4 font-mono">СТАБИЛИЗАЦИЯ...</div>
            
            <canvas id="crash-canvas" width="300" height="150" class="w-full max-w-[320px] bg-black/40 rounded-xl mb-4 border border-cyberPanel shadow-inner"></canvas>
            
            <div id="crash-multiplier" class="text-4xl font-extrabold mb-4 transition-colors duration-200 text-white font-mono w-full text-center tracking-tight">1.00x</div>
            
            ${renderBetControls('crash')}
            
            <button id="crash-btn" class="cyber-btn w-full py-4 text-lg rounded-xl flex items-center justify-center gap-2">СТАРТ (РАУНД)</button>
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
    let isRunning = false;
    let crashPoint = 0;
    let loopId;
    let t = 0;
    let history = [{ x: 0, mult: 1.0 }];

    cBtn.onclick = () => {
        if (!isRunning) {
            if (gameState.bet > gameState.balance) {
                window.Telegram.WebApp.showAlert("Недостаточно средств на балансе!");
                return;
            }
            if (gameState.bet <= 0) return;
            startRound();
        } else {
            if (isCrashed || isTaken) return;
            isTaken = true;
            cBtn.disabled = true;
            cBtn.innerText = "ЭКСТРАГИРОВАН!";

            multText.classList.add('text-cyberSuccess');
            statusText.innerText = "УСПЕШНО ✅";

            const win = Math.floor(gameState.bet * currentMult);
            submitGamePlay('crash', gameState.bet, win);
        }
    };

    function startRound() {
        isRunning = true;
        isCrashed = false;
        isTaken = false;
        t = 0;
        currentMult = 1.0;
        history = [{ x: 0, mult: 1.0 }];
        crashPoint = Math.random() < 0.7 ? 1 + Math.random() * 1.5 : 2.5 + Math.random() * 5;

        cBtn.innerText = "ЭКСТРАГИРОВАТЬ";
        statusText.innerText = "НАБОР ВЫСОТЫ";
        multText.classList.remove('text-cyberDanger', 'text-cyberSuccess');
        multText.classList.add('text-white');

        loopId = requestAnimationFrame(update);
    }

    function update(timeParam) {
        if (isCrashed) return;

        t += 1;
        currentMult += 0.0015 + (currentMult * 0.001);
        multText.innerText = currentMult.toFixed(2) + "x";

        if (t % 2 === 0) history.push({ x: t, mult: currentMult });
        drawCurve();

        if (currentMult >= crashPoint) {
            isCrashed = true;
            isRunning = false;
            statusText.innerText = "СИСТЕМА РАЗРУШЕНА 💥";
            multText.classList.replace('text-white', 'text-cyberDanger');
            cBtn.innerText = "СТАРТ (РАУНД)";
            cBtn.disabled = false;
            drawCurve(true);

            if (!isTaken) submitGamePlay('crash', gameState.bet, 0); // Loss
            return;
        }

        loopId = requestAnimationFrame(update);
    }

    function drawCurve(crashed = false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (history.length === 0) return;

        const maxT = Math.max(100, t) * 1.15;
        const maxMult = Math.max(2.0, currentMult) * 1.1;

        const p = new Path2D();
        p.moveTo(0, canvas.height);

        let lastPx = 0, lastPy = canvas.height;

        for (let point of history) {
            const px = (point.x / maxT) * canvas.width;
            const py = canvas.height - ((point.mult - 1) / (maxMult - 1)) * canvas.height;
            p.lineTo(px, py);
            lastPx = px; lastPy = py;
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = crashed ? '#ff4444' : '#00ffaa';
        ctx.stroke(p);

        p.lineTo(lastPx, canvas.height);
        p.lineTo(0, canvas.height);
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, crashed ? 'rgba(255,68,68,0.5)' : 'rgba(0,255,170,0.5)');
        g.addColorStop(1, crashed ? 'rgba(255,68,68,0.0)' : 'rgba(0,255,170,0.0)');
        ctx.fillStyle = g;
        ctx.fill(p);

        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (crashed) ctx.fillText("💥", lastPx, lastPy);
        else ctx.fillText("🚀", lastPx, lastPy);
    }

    // Draw initial empty graph
    drawCurve();
}
