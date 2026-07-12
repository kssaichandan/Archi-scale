// Theme toggle with localStorage persistence
const THEME_KEY = 'archi-scale-theme';

export function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateIcon(saved);

    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        updateIcon(next);
    });
}

function updateIcon(theme) {
    const btn = document.getElementById('themeToggle');
    btn.textContent = theme === 'light' ? '☀️' : '🌙';
}
