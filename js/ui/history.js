// ponytail: localStorage-backed history, no external deps
const HISTORY_KEY = 'archi-scale-history';
const MAX_HISTORY = 20;

let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

export function addToHistory(type, fromVal, fromUnit, toVal, toUnit) {
    const entry = {
        type,
        from: `${fromVal} ${fromUnit}`,
        to: `${toVal} ${toUnit}`,
        time: new Date().toLocaleTimeString(),
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

export function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    if (history.length === 0) {
        container.innerHTML = '<p class="empty-state">No conversions yet. Start converting!</p>';
        return;
    }
    container.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <span class="hist-type">${h.type}</span>
            <span class="hist-conversion">${h.from} → ${h.to}</span>
            <span class="hist-time">${h.time}</span>
            <button class="hist-delete" data-index="${i}">×</button>
        </div>
    `).join('');

    container.querySelectorAll('.hist-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            history.splice(parseInt(e.target.dataset.index), 1);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            renderHistory();
        });
    });
}

export function clearHistory() {
    history = [];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}
