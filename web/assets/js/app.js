const tg = window.Telegram.WebApp;
tg.expand();

export const gameState = {
    balance: 0,
    currentGame: null,
    bet: 10,
    initData: tg.initData || "placeholder",
    userId: tg.initDataUnsafe?.user?.id || 12345
};

const dom = {
    loading: document.getElementById('loading'),
    hubMenu: document.getElementById('hub-menu'),
    gameContainer: document.getElementById('game-container'),
    balanceEl: document.getElementById('live-balance')
};

export const API_URL = window.API_BASE;

function bootstrap() {
    initApp();

    tg.BackButton.onClick(() => {
        if (gameState.currentGame) showHub();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

async function initApp() {
    await fetchBalance();
    dom.loading.classList.add('hidden');
    showHub();
}

export async function fetchBalance() {
    try {
        const res = await fetch(`${API_URL}/balance`, {
            headers: {
                'Authorization': `tma ${gameState.initData}`,
                'bypass-tunnel-reminder': 'true'
            }
        });
        if (res.ok) {
            const data = await res.json();
            gameState.balance = data.balance;
            dom.balanceEl.innerText = data.balance;
            dom.balanceEl.classList.remove('animate-pulse');
            return true;
        }
    } catch (e) {
        console.error("API Error", e);
    }
    // Fallback if API fails (UI stays static)
    dom.balanceEl.innerText = gameState.balance || "0";
    return false;
}

export async function submitGamePlay(gameName, betAmount, winAmount) {
    gameState.balance += (winAmount - betAmount);
    dom.balanceEl.innerText = gameState.balance;
    dom.balanceEl.classList.add('text-cyberEmerald');
    setTimeout(() => dom.balanceEl.classList.remove('text-cyberEmerald'), 500);

    try {
        const res = await fetch(`${API_URL}/sync_balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `tma ${gameState.initData}`,
                'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ game: gameName, bet: betAmount, winAmount: winAmount })
        });
        if (res.ok) {
            const data = await res.json();
            gameState.balance = data.balance;
            dom.balanceEl.innerText = data.balance;
        } else {
            const err = await res.json();
            tg.showAlert(err.error || "Ошибка синхронизации. Баланс будет возвращен.");
            fetchBalance(); // Revert
        }
    } catch (e) {
        console.error(e);
        tg.showAlert("API Оффлайн. Результат не сохранен.");
        fetchBalance(); // Revert
    }
}

// Global Nav Handle
window.navGame = (gameName) => {
    gameState.currentGame = gameName;
    dom.hubMenu.classList.add('hidden');
    dom.gameContainer.classList.remove('hidden');
    dom.gameContainer.innerHTML = '<div class="text-center w-full mt-20"><h2 class="text-xl text-cyberAccent animate-pulse">ЗAГРУЗКА...</h2></div>';

    tg.BackButton.show();

    // Dynamically load the JS module for the game
    import('./games/' + gameName + '.js?t=' + Date.now()).then(module => {
        module.initGame();
    }).catch(err => {
        console.error(err);
        dom.gameContainer.innerHTML = `<h1 class="text-xl font-bold text-cyberDanger text-center mt-10">ОШИБКА ЗАГРУЗКИ МОДУЛЯ</h1>`;
    });
}

function showHub() {
    gameState.currentGame = null;
    tg.BackButton.hide();
    dom.gameContainer.innerHTML = '';
    dom.gameContainer.classList.add('hidden');
    dom.hubMenu.classList.remove('hidden');
}

// Global Bet Builder function
export function renderBetControls(containerId, onBetChangeCallback) {
    const html = `
        <div class="w-full bg-black/50 rounded-xl p-3 mb-4 border border-cyberPanel shadow-inner">
            <div class="flex justify-between text-xs text-tgText/70 mb-2 font-mono">
                <span>СУММА СТАВКИ</span>
                <span class="text-cyberEmerald font-bold"><span id="bet-display-${containerId}">${gameState.bet}</span> 💎</span>
            </div>
            <div class="flex gap-2 mb-2">
                <input type="number" id="bet-input-${containerId}" class="w-full bg-black/60 text-white font-bold p-2 text-lg rounded-lg border border-cyberAccent/30 focus:border-cyberEmerald focus:outline-none text-center font-mono" value="${gameState.bet}">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <button class="bg-cyberPanel hover:bg-cyberBase border border-gray-700 rounded py-2 text-xs font-bold transition-transform active:scale-95 text-gray-300" onclick="window.adjBet('${containerId}', '/2')">/2</button>
                <button class="bg-cyberPanel hover:bg-cyberBase border border-gray-700 rounded py-2 text-xs font-bold transition-transform active:scale-95 text-gray-300" onclick="window.adjBet('${containerId}', 'x2')">X2</button>
                <button class="bg-cyberPanel hover:bg-cyberBase border border-gray-700 rounded py-2 text-xs font-bold transition-transform active:scale-95 text-gray-300" onclick="window.adjBet('${containerId}', '+10')">+10</button>
                <button class="bg-cyberPanel hover:bg-cyberBase border border-cyberEmerald/50 rounded py-2 text-xs text-cyberEmerald font-black transition-transform active:scale-95" onclick="window.adjBet('${containerId}', 'max')">MAX</button>
            </div>
        </div>
    `;

    // Auto attach 
    window.adjBet = (id, action) => {
        const inp = document.getElementById(`bet-input-${id}`);
        if (!inp) return;
        let v = parseInt(inp.value) || 0;
        if (action === '/2') v = Math.floor(v / 2);
        if (action === 'x2') v = v * 2;
        if (action === '+10') v += 10;
        if (action === 'max') v = gameState.balance;
        if (v < 1) v = 1;
        if (v > gameState.balance) v = gameState.balance;
        inp.value = v;
        gameState.bet = v;
        document.getElementById(`bet-display-${id}`).innerText = v;
        if (onBetChangeCallback) onBetChangeCallback(v);
    };

    setTimeout(() => {
        const inp = document.getElementById(`bet-input-${containerId}`);
        if (inp) {
            inp.addEventListener('input', (e) => {
                let v = parseInt(e.target.value) || 0;
                if (v < 0) v = 0;
                gameState.bet = v;
                document.getElementById(`bet-display-${containerId}`).innerText = v;
                if (onBetChangeCallback) onBetChangeCallback(v);
            });
        }
    }, 100);

    return html;
}
