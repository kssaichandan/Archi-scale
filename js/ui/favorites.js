// Favorites with localStorage
const FAVS_KEY = 'archi-scale-favorites';

let favorites = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]');

export function initFavorites() {
    updateAllStars();
    document.querySelectorAll('.btn-star').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.fav;
            toggleFavorite(section);
        });
    });
}

function toggleFavorite(section) {
    const idx = favorites.indexOf(section);
    if (idx > -1) {
        favorites.splice(idx, 1);
    } else {
        favorites.push(section);
    }
    localStorage.setItem(FAVS_KEY, JSON.stringify(favorites));
    updateAllStars();
    renderFavorites();
}

function updateAllStars() {
    document.querySelectorAll('.btn-star').forEach(btn => {
        const section = btn.dataset.fav;
        if (favorites.includes(section)) {
            btn.classList.add('active');
            btn.textContent = '★';
        } else {
            btn.classList.remove('active');
            btn.textContent = '☆';
        }
    });
}

export function getFavorites() {
    return favorites;
}

const sectionNames = {
    'length': 'Length Converter',
    'area': 'Area Converter',
    'volume': 'Volume Converter',
    'mass': 'Mass / Weight Converter',
    'temperature': 'Temperature Converter',
    'pressure': 'Pressure Converter',
    'density': 'Density Converter',
    'angle': 'Angle Converter',
    'scale-metric': 'Scale Converter (Metric)',
    'scale-imperial': 'Imperial Scale Converter',
    'reverse-scale': 'Find Scale',
    'paper-fit': 'Paper Fit Checker',
    'scale-resize': 'Scale Resize',
    'board-feet': 'Board Feet Converter',
    'roofing': 'Roofing Squares Converter',
    'concrete': 'Concrete Volume Converter',
    'arch-dimensions': 'Architectural Dimensions',
    'material-densities': 'Material Densities',
    'paper-sizes': 'Paper Size Reference',
    'scale-ref': 'Scale Reference',
};

export function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (favorites.length === 0) {
        container.innerHTML = '<p class="empty-state">No favorites yet. Click ☆ on any converter to add it here.</p>';
        return;
    }
    container.innerHTML = favorites.map(f => `
        <div class="history-item" style="cursor:pointer" data-goto="${f}">
            <span class="hist-type">⭐</span>
            <span class="hist-conversion">${sectionNames[f] || f}</span>
            <button class="hist-delete" data-fav-remove="${f}">×</button>
        </div>
    `).join('');

    container.querySelectorAll('[data-goto]').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('hist-delete')) return;
            const section = item.dataset.goto;
            document.querySelector(`[data-section="${section}"]`).click();
        });
    });

    container.querySelectorAll('[data-fav-remove]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = btn.dataset.favRemove;
            const idx = favorites.indexOf(section);
            if (idx > -1) favorites.splice(idx, 1);
            localStorage.setItem(FAVS_KEY, JSON.stringify(favorites));
            updateAllStars();
            renderFavorites();
        });
    });
}
