const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

const urlParams = new URLSearchParams(window.location.search);
export const gameState = {
    game: urlParams.get('game'),
    bet: parseFloat(urlParams.get('bet')) || 0,
    userId: urlParams.get('user_id'),
    user: tg.initDataUnsafe?.user || { username: 'Player' }
};

document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('game-container');

    if (!gameState.game || !gameState.bet || !gameState.userId) {
        loadingEl.innerHTML = `<h1 class="text-xl font-bold text-cyberDanger text-center">ДАННЫЕ ПОВРЕЖДЕНЫ.<br>Запустите через бота.</h1>`;
        return;
    }

    const scriptUrl = `assets/js/games/${gameState.game}.js`;

    if (['crash', 'plinko', 'mines'].includes(gameState.game)) {
        loadGame(scriptUrl).then(() => {
            loadingEl.classList.add('hidden');
            containerEl.classList.remove('hidden');
        }).catch(err => {
            console.error(err);
            loadingEl.innerHTML = `<h1 class="text-xl font-bold text-cyberDanger text-center">ОШИБКА ЗАГРУЗКИ МОДУЛЯ</h1>`;
        });
    } else {
        loadingEl.innerHTML = `<h1 class="text-xl font-bold text-cyberDanger text-center">НЕИЗВЕСТНЫЙ МОДУЛЬ: ${gameState.game}</h1>`;
    }
});

function loadGame(scriptUrl) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = scriptUrl;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

export function reportResult(winAmount) {
    tg.showConfirm(`ВЫИГРЫШ: ${winAmount} 💎\n\nСинхронизировать данные?`, (ok) => {
        if (ok) tg.close();
    });

    // Placeholder API call targeting backend sync
    /*
    fetch('/api/syncResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: gameState.userId,
            game: gameState.game,
            bet: gameState.bet,
            winAmount: winAmount,
            initData: tg.initData
        })
    }).then(r => r.json()).then(data => console.log(data));
    */
}

export function reportLoss() {
    tg.showAlert(`СТАВКА В ${gameState.bet} 💎 УТЕРЯНА.`);
    // Placeholder API call targeting backend sync
}
