import { gameState, submitGamePlay, renderBetControls } from '../app.js';

export function initGame() {
    const container = document.getElementById('game-container');

    container.innerHTML = `
        <div class="base-panel text-center w-full animate-[fadeIn_0.3s_ease]">
            <h2 class="text-3xl font-extrabold mb-4 text-white tracking-widest relative">PLINKO</h2>
            
            <canvas id="plinko-c" width="300" height="350" class="mx-auto block bg-black/40 rounded-xl mb-4 border border-cyberPanel w-full max-w-[300px]"></canvas>
            
            ${renderBetControls('plinko')}

            <div class="w-full bg-black/50 rounded-xl p-3 mb-4 border border-cyberPanel shadow-inner flex justify-between items-center text-sm font-mono text-tgText/80">
                <span>СБРОС ШАРОВ</span>
                <select id="plinko-count" class="bg-cyberBase border border-cyberAccent text-white font-bold rounded p-1 outline-none text-center">
                    <option value="1">1 Шар</option>
                    <option value="3">3 Шара</option>
                    <option value="5">5 Шаров</option>
                    <option value="10">10 Шаров</option>
                </select>
            </div>
            
            <button id="plinko-btn" class="cyber-btn w-full py-4 text-xl rounded-xl">ПУСК</button>
        </div>
    `;

    const canvas = document.getElementById('plinko-c');
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('plinko-btn');
    const countSelect = document.getElementById('plinko-count');

    const ROWS = 8;
    const PEGS = [];
    const BALLS = [];
    const MULTIPLIERS = [10, 3, 1.5, 1, 0.5, 1, 1.5, 3, 10];
    let isDropping = false;

    const startY = 40;
    const spacingY = 32;
    const spacingX = 30;

    for (let r = 0; r < ROWS; r++) {
        const pegsInRow = r + 3;
        const rowWidth = (pegsInRow - 1) * spacingX;
        const startX = (canvas.width - rowWidth) / 2;
        for (let c = 0; c < pegsInRow; c++) {
            PEGS.push({ x: startX + c * spacingX, y: startY + r * spacingY, r: 4 });
        }
    }

    btn.onclick = () => {
        if (isDropping) return;
        let count = parseInt(countSelect.value);
        let totalBet = gameState.bet * count;

        if (totalBet > gameState.balance || totalBet <= 0) {
            window.Telegram.WebApp.showAlert("Недостаточно средств (нужно " + totalBet + " 💎)");
            return;
        }

        // Disable button during batch drop sequence
        isDropping = true;
        btn.disabled = true;
        btn.classList.add('opacity-50');

        let delayedDrops = 0;
        let dropInterval = setInterval(() => {
            BALLS.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 8,
                y: 10,
                vx: 0,
                vy: 0,
                r: 6,
                baseBet: gameState.bet // Track bet for this specific ball in case user changes bet mid-flight
            });
            delayedDrops++;
            if (delayedDrops >= count) {
                clearInterval(dropInterval);
                setTimeout(() => {
                    isDropping = false;
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }, 1000); // Allow next batch soon
            }
        }, 300);
    };

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4b5563';
        PEGS.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });

        const slotW = canvas.width / MULTIPLIERS.length;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        MULTIPLIERS.forEach((m, i) => {
            const sx = i * slotW;
            ctx.fillStyle = m >= 2 ? '#00ffaa' : (m < 1 ? '#ff4444' : '#fbbf24');
            ctx.fillRect(sx, canvas.height - 25, slotW - 2, 25);
            ctx.fillStyle = '#0b0f19';
            ctx.fillText(m + "x", sx + slotW / 2, canvas.height - 8);
        });

        for (let i = BALLS.length - 1; i >= 0; i--) {
            let b = BALLS[i];

            b.vy += 0.25;
            b.x += b.vx;
            b.y += b.vy;

            PEGS.forEach(p => {
                let dx = b.x - p.x;
                let dy = b.y - p.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < b.r + p.r) {
                    let a = Math.atan2(dy, dx);
                    let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 0.55;
                    if (Math.abs(Math.sin(a)) > 0.8) {
                        a += (Math.random() > 0.5 ? 0.4 : -0.4);
                    }
                    b.vx = Math.cos(a) * speed;
                    b.vy = Math.sin(a) * Math.max(speed, 2);

                    b.x = p.x + Math.cos(a) * (b.r + p.r + 1);
                    b.y = p.y + Math.sin(a) * (b.r + p.r + 1);
                }
            });

            if (b.x < b.r) { b.x = b.r; b.vx *= -0.8; }
            if (b.x > canvas.width - b.r) { b.x = canvas.width - b.r; b.vx *= -0.8; }

            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (b.y > canvas.height - 25) {
                const slotIdx = Math.min(MULTIPLIERS.length - 1, Math.max(0, Math.floor(b.x / slotW)));
                const mult = MULTIPLIERS[slotIdx];
                const betForBall = b.baseBet;

                BALLS.splice(i, 1);

                const win = Math.floor(betForBall * mult);
                submitGamePlay('plinko', betForBall, win);
            }
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
