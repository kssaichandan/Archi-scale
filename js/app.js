import { convert, units } from './data/units.js';
import { metricScales, imperialScales } from './data/scales.js';
import { paperSizes, marginMm } from './data/paper-sizes.js';
import { materials } from './data/materials.js';
import { archDimensions } from './data/dimensions.js';
import { initTheme } from './ui/theme.js';
import { addToHistory, renderHistory, clearHistory } from './ui/history.js';
import { initFavorites, renderFavorites } from './ui/favorites.js';
import { initClipboard, showToast } from './ui/clipboard.js';
import { initTabs } from './ui/tabs.js';

let precision = 6;

document.addEventListener('DOMContentLoaded', () => {
    // Safely prevent long overflowing numbers across all converters
    document.addEventListener('input', (e) => {
        try {
            const target = e.target;
            if (target && target.tagName === 'INPUT' && (target.type === 'number' || (target.classList && target.classList.contains('input-value')))) {
                // Keep length under 16 characters safely
                if (typeof target.value === 'string' && target.value.length > 16) {
                    target.value = target.value.slice(0, 16);
                }
            }
        } catch (err) {
            console.error('Input restriction error:', err);
        }
    }, { passive: true });

    initTheme();
    initTabs();
    initClipboard();
    initFavorites();
    renderHistory();
    renderFavorites();
    initPrecisionControl();
    initStandardConverters();
    initMetricScale();
    initImperialScale();
    initCustomScale();
    initReverseScale();
    initPaperFit();
    initScaleResize();
    initConstructionConverters();
    initReferenceTables();
    initSwapButtons();
    document.getElementById('clearHistory')?.addEventListener('click', clearHistory);
});

// ponytail: precision menu is trivial DOM, no need for a separate module
function initPrecisionControl() {
    const btn = document.getElementById('precisionBtn');
    const menu = document.createElement('div');
    menu.className = 'precision-menu';
    for (let i = 0; i <= 10; i++) {
        const opt = document.createElement('button');
        opt.className = 'precision-option' + (i === precision ? ' active' : '');
        opt.textContent = `${i} decimal${i !== 1 ? 's' : ''}`;
        opt.addEventListener('click', () => {
            precision = i;
            menu.querySelectorAll('.precision-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            btn.textContent = i;
            menu.classList.remove('show');
            showToast(`Precision set to ${i} decimal places`);
        });
        menu.appendChild(opt);
    }
    btn.parentElement.appendChild(menu);
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });
    document.addEventListener('click', () => menu.classList.remove('show'));
}

function fmt(val) {
    if (isNaN(val) || !isFinite(val)) return '—';
    return parseFloat(val.toFixed(precision)).toString();
}

// ==========================================
// STANDARD UNIT CONVERTERS
// ==========================================
const converterConfigs = [
    { id: 'length', category: 'length', fromVal: 'length-from-val', toVal: 'length-to-val', fromUnit: 'length-from-unit', toUnit: 'length-to-unit', resultId: 'length-result', formulaId: 'length-formula' },
    { id: 'area', category: 'area', fromVal: 'area-from-val', toVal: 'area-to-val', fromUnit: 'area-from-unit', toUnit: 'area-to-unit', resultId: 'area-result', formulaId: 'area-formula' },
    { id: 'volume', category: 'volume', fromVal: 'volume-from-val', toVal: 'volume-to-val', fromUnit: 'volume-from-unit', toUnit: 'volume-to-unit', resultId: 'volume-result', formulaId: 'volume-formula' },
    { id: 'mass', category: 'mass', fromVal: 'mass-from-val', toVal: 'mass-to-val', fromUnit: 'mass-from-unit', toUnit: 'mass-to-unit', resultId: 'mass-result', formulaId: 'mass-formula' },
    { id: 'temperature', category: 'temperature', fromVal: 'temp-from-val', toVal: 'temp-to-val', fromUnit: 'temp-from-unit', toUnit: 'temp-to-unit', resultId: 'temp-result', formulaId: 'temp-formula' },
    { id: 'pressure', category: 'pressure', fromVal: 'pressure-from-val', toVal: 'pressure-to-val', fromUnit: 'pressure-from-unit', toUnit: 'pressure-to-unit', resultId: 'pressure-result', formulaId: 'pressure-formula' },
    { id: 'density', category: 'density', fromVal: 'density-from-val', toVal: 'density-to-val', fromUnit: 'density-from-unit', toUnit: 'density-to-unit', resultId: 'density-result', formulaId: 'density-formula' },
    { id: 'angle', category: 'angle', fromVal: 'angle-from-val', toVal: 'angle-to-val', fromUnit: 'angle-from-unit', toUnit: 'angle-to-unit', resultId: 'angle-result', formulaId: 'angle-formula' },
];

function initStandardConverters() {
    converterConfigs.forEach(cfg => {
        const fromValEl = document.getElementById(cfg.fromVal);
        const toValEl = document.getElementById(cfg.toVal);
        const fromUnitEl = document.getElementById(cfg.fromUnit);
        const toUnitEl = document.getElementById(cfg.toUnit);
        const resultEl = document.getElementById(cfg.resultId);
        const formulaEl = document.getElementById(cfg.formulaId);

        const doConvert = () => {
            const val = parseFloat(fromValEl.value);
            if (isNaN(val) || fromValEl.value === '') {
                toValEl.value = '';
                resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
                if (formulaEl) formulaEl.textContent = '';
                return;
            }
            const from = fromUnitEl.value;
            const to = toUnitEl.value;
            const result = convert(cfg.category, val, from, to);
            const formatted = fmt(result);
            toValEl.value = formatted;

            const fromName = units[cfg.category]?.[from]?.abbr || from;
            const toName = units[cfg.category]?.[to]?.abbr || to;
            resultEl.querySelector('.result-text').textContent = `${val} ${fromName} = ${formatted} ${toName}`;

            if (formulaEl) {
                if (cfg.category !== 'temperature') {
                    const factor = units[cfg.category]?.[from]?.factor;
                    const toFactor = units[cfg.category]?.[to]?.factor;
                    formulaEl.textContent = `Formula: ${val} × ${factor} / ${toFactor} = ${formatted}`;
                } else {
                    formulaEl.textContent = getTemperatureFormula(val, from, to, result);
                }
            }

            addToHistory(cfg.id, val, fromName, formatted, toName);
        };

        fromValEl.addEventListener('input', doConvert);
        fromUnitEl.addEventListener('change', doConvert);
        toUnitEl.addEventListener('change', doConvert);
    });
}

function getTemperatureFormula(val, from, to, result) {
    if (from === to) return '';
    const key = `${from}-${to}`;
    const f = fmt(result);
    const formulas = {
        'C-F': `(${val} × 9/5) + 32 = ${f}`,
        'C-K': `${val} + 273.15 = ${f}`,
        'F-C': `(${val} - 32) × 5/9 = ${f}`,
        'F-K': `(${val} - 32) × 5/9 + 273.15 = ${f}`,
        'K-C': `${val} - 273.15 = ${f}`,
        'K-F': `(${val} - 273.15) × 9/5 + 32 = ${f}`,
    };
    return formulas[key] || '';
}

// ==========================================
// SWAP BUTTONS - scoped to converter-row
// ==========================================
function initSwapButtons() {
    document.querySelectorAll('.btn-swap').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.converter-row');
            if (!row) return;
            const groups = row.querySelectorAll('.input-group');
            if (groups.length < 2) return;
            const u1 = groups[0].querySelector('.input-unit');
            const u2 = groups[1].querySelector('.input-unit');
            if (u1 && u2) {
                const tmp = u1.value;
                u1.value = u2.value;
                u2.value = tmp;
                groups[0].querySelector('.input-value')?.dispatchEvent(new Event('input'));
            }
        });
    });
}

// ==========================================
// METRIC SCALE CONVERTER
// ==========================================
let currentMetricScale = 100;
let metricScaleMode = 'real-to-drawing';

function initMetricScale() {
    const customWrapper = document.getElementById('metric-custom-wrapper');
    const customVal = document.getElementById('metric-scale-custom-val');
    
    document.querySelectorAll('#section-scale-metric .preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentMetricScale = btn.dataset.scale === 'custom' ? 'custom' : parseInt(btn.dataset.scale);
            document.querySelectorAll('#section-scale-metric .preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (customWrapper) customWrapper.style.display = (currentMetricScale === 'custom') ? 'block' : 'none';
            updateMetricScaleInfo();
            doMetricScaleConvert();
        });
    });

    document.querySelectorAll('#section-scale-metric .scale-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            metricScaleMode = tab.dataset.mode;
            document.querySelectorAll('#section-scale-metric .scale-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('scale-metric-from-label').textContent = metricScaleMode === 'real-to-drawing' ? 'Real World' : 'Drawing';
            document.getElementById('scale-metric-to-label').textContent = metricScaleMode === 'real-to-drawing' ? 'Drawing' : 'Real World';
            doMetricScaleConvert();
        });
    });

    if (customVal) customVal.addEventListener('input', () => {
        updateMetricScaleInfo();
        doMetricScaleConvert();
    });
    document.getElementById('scale-metric-from-val').addEventListener('input', doMetricScaleConvert);
    document.getElementById('scale-metric-from-unit').addEventListener('change', doMetricScaleConvert);
    document.getElementById('scale-metric-to-unit').addEventListener('change', doMetricScaleConvert);
    updateMetricScaleInfo();
}

function updateMetricScaleInfo() {
    let scaleStr = currentMetricScale;
    if (currentMetricScale === 'custom') {
        const cVal = document.getElementById('metric-scale-custom-val').value;
        scaleStr = cVal ? cVal : '?';
    }
    document.getElementById('scale-metric-ratio').textContent = `1:${scaleStr}`;
    document.getElementById('scale-metric-explain').textContent = `At 1:${scaleStr}, 1mm on drawing = ${scaleStr}mm in reality`;
}

function doMetricScaleConvert() {
    const val = parseFloat(document.getElementById('scale-metric-from-val').value);
    const fromUnit = document.getElementById('scale-metric-from-unit').value;
    const toUnit = document.getElementById('scale-metric-to-unit').value;
    const resultEl = document.getElementById('scale-metric-result');

    if (isNaN(val)) {
        document.getElementById('scale-metric-to-val').value = '';
        resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
        return;
    }

    let activeScale = currentMetricScale;
    if (activeScale === 'custom') {
        activeScale = parseFloat(document.getElementById('metric-scale-custom-val').value);
        if (isNaN(activeScale) || activeScale <= 0) {
            document.getElementById('scale-metric-to-val').value = '';
            resultEl.querySelector('.result-text').textContent = 'Enter a valid custom scale';
            return;
        }
    }

    const toMm = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8, yd: 914.4 };
    const valInMm = val * toMm[fromUnit];
    const resultInMm = metricScaleMode === 'real-to-drawing'
        ? valInMm / activeScale
        : valInMm * activeScale;
    const result = resultInMm / toMm[toUnit];
    const formatted = fmt(result);
    document.getElementById('scale-metric-to-val').value = formatted;

    const from = metricScaleMode === 'real-to-drawing' ? 'Real' : 'Drawing';
    const to = metricScaleMode === 'real-to-drawing' ? 'Drawing' : 'Real';
    resultEl.querySelector('.result-text').textContent = `${from}: ${val} ${fromUnit} → ${to}: ${formatted} ${toUnit} (at 1:${activeScale})`;
}

// ==========================================
// IMPERIAL SCALE CONVERTER
// ==========================================
let currentImpScale = 48;

function initImperialScale() {
    const customWrapper = document.getElementById('imp-custom-wrapper');
    const customVal = document.getElementById('imp-scale-custom-val');
    
    document.querySelectorAll('#section-scale-imperial .preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentImpScale = btn.dataset.scale === 'custom' ? 'custom' : parseInt(btn.dataset.scale);
            document.querySelectorAll('#section-scale-imperial .preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (customWrapper) customWrapper.style.display = (currentImpScale === 'custom') ? 'block' : 'none';
            updateImpScaleInfo();
            doImpScaleConvert();
        });
    });

    if (customVal) customVal.addEventListener('input', () => {
        updateImpScaleInfo();
        doImpScaleConvert();
    });
    document.getElementById('imp-scale-from-val').addEventListener('input', doImpScaleConvert);
    document.getElementById('imp-scale-from-unit').addEventListener('change', doImpScaleConvert);
    document.getElementById('imp-scale-to-unit').addEventListener('change', doImpScaleConvert);
    updateImpScaleInfo();
}

function updateImpScaleInfo() {
    if (currentImpScale === 'custom') {
        const cVal = document.getElementById('imp-scale-custom-val').value;
        const scaleStr = cVal ? cVal : '?';
        document.getElementById('imp-scale-ratio').textContent = `1:${scaleStr}`;
        document.getElementById('imp-scale-metric').textContent = `(Custom)`;
    } else {
        const s = imperialScales.find(s => s.value === currentImpScale);
        document.getElementById('imp-scale-ratio').textContent = s ? s.label : `1:${currentImpScale}`;
        document.getElementById('imp-scale-metric').textContent = `(Metric: 1:${currentImpScale})`;
    }
}

function doImpScaleConvert() {
    const val = parseFloat(document.getElementById('imp-scale-from-val').value);
    const fromUnit = document.getElementById('imp-scale-from-unit').value;
    const toUnit = document.getElementById('imp-scale-to-unit').value;
    const resultEl = document.getElementById('scale-imperial-result');

    if (isNaN(val)) {
        document.getElementById('imp-scale-to-val').value = '';
        resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
        return;
    }

    let activeScale = currentImpScale;
    let ratioText = '';
    if (activeScale === 'custom') {
        activeScale = parseFloat(document.getElementById('imp-scale-custom-val').value);
        if (isNaN(activeScale) || activeScale <= 0) {
            document.getElementById('imp-scale-to-val').value = '';
            resultEl.querySelector('.result-text').textContent = 'Enter a valid custom scale';
            return;
        }
        ratioText = `1:${activeScale}`;
    } else {
        ratioText = `1/${activeScale}" = 1'-0"`;
    }

    const toInches = { ft: 12, in: 1, m: 39.3701 };
    const drawingInches = (val * toInches[fromUnit]) / activeScale;
    const fromInches = { in: 1, ft: 1/12, mm: 25.4, cm: 2.54 };
    const result = drawingInches * fromInches[toUnit];
    const formatted = fmt(result);
    document.getElementById('imp-scale-to-val').value = formatted;
    resultEl.querySelector('.result-text').textContent = `Real: ${val} ${fromUnit} → Drawing: ${formatted} ${toUnit} (at ${ratioText})`;
}

// ==========================================
// CUSTOM SCALE CONVERTER
// ==========================================
let customScaleMode = 'real-to-drawing';

function initCustomScale() {
    const tabs = document.querySelectorAll('#section-scale-custom .scale-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            customScaleMode = tab.dataset.mode;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('custom-scale-from-label').textContent = customScaleMode === 'real-to-drawing' ? 'Real World' : 'Drawing';
            document.getElementById('custom-scale-to-label').textContent = customScaleMode === 'real-to-drawing' ? 'Drawing' : 'Real World';
            doCustomScaleConvert();
        });
    });

    const ratioInput = document.getElementById('custom-scale-ratio');
    if (ratioInput) ratioInput.addEventListener('input', doCustomScaleConvert);
    const fromVal = document.getElementById('custom-scale-from-val');
    if (fromVal) fromVal.addEventListener('input', doCustomScaleConvert);
    const fromUnit = document.getElementById('custom-scale-from-unit');
    if (fromUnit) fromUnit.addEventListener('change', doCustomScaleConvert);
    const toUnit = document.getElementById('custom-scale-to-unit');
    if (toUnit) toUnit.addEventListener('change', doCustomScaleConvert);
    const swapBtn = document.getElementById('custom-scale-swap');
    if (swapBtn) swapBtn.addEventListener('click', () => {
        if(fromUnit && toUnit) {
            const tmp = fromUnit.value;
            fromUnit.value = toUnit.value;
            toUnit.value = tmp;
            if (fromVal) fromVal.dispatchEvent(new Event('input'));
        }
    });
}

function doCustomScaleConvert() {
    const valEl = document.getElementById('custom-scale-from-val');
    const ratioEl = document.getElementById('custom-scale-ratio');
    const fromUnitEl = document.getElementById('custom-scale-from-unit');
    const toUnitEl = document.getElementById('custom-scale-to-unit');
    const resultEl = document.getElementById('custom-scale-result');
    const toValEl = document.getElementById('custom-scale-to-val');
    
    if (!valEl || !ratioEl || !fromUnitEl || !toUnitEl || !resultEl || !toValEl) return;
    
    const val = parseFloat(valEl.value);
    const ratio = parseFloat(ratioEl.value);
    const fromUnit = fromUnitEl.value;
    const toUnit = toUnitEl.value;

    if (isNaN(val) || isNaN(ratio) || ratio === 0) {
        toValEl.value = '';
        resultEl.querySelector('.result-text').textContent = 'Enter a value and ratio to convert';
        return;
    }

    const toMm = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8, yd: 914.4 };
    const valInMm = val * toMm[fromUnit];
    const resultInMm = customScaleMode === 'real-to-drawing'
        ? valInMm / ratio
        : valInMm * ratio;
    const result = resultInMm / toMm[toUnit];
    const formatted = fmt(result);
    toValEl.value = formatted;

    const from = customScaleMode === 'real-to-drawing' ? 'Real' : 'Drawing';
    const to = customScaleMode === 'real-to-drawing' ? 'Drawing' : 'Real';
    resultEl.querySelector('.result-text').textContent = `${from}: ${val} ${fromUnit} → ${to}: ${formatted} ${toUnit} (at 1:${ratio})`;
}

// ==========================================
// REVERSE SCALE FINDER
// ==========================================
function initReverseScale() {
    ['rev-scale-drawing', 'rev-scale-drawing-unit', 'rev-scale-real', 'rev-scale-real-unit'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', doReverseScale);
        el.addEventListener('change', doReverseScale);
    });
}

function doReverseScale() {
    const drawing = parseFloat(document.getElementById('rev-scale-drawing').value);
    const drawingUnit = document.getElementById('rev-scale-drawing-unit').value;
    const real = parseFloat(document.getElementById('rev-scale-real').value);
    const realUnit = document.getElementById('rev-scale-real-unit').value;
    const scaleEl = document.getElementById('found-scale-value');
    const nearestEl = document.getElementById('nearest-standard');
    const errorEl = document.getElementById('scale-error');

    if (isNaN(drawing) || isNaN(real) || drawing === 0) {
        scaleEl.textContent = '—';
        nearestEl.textContent = '';
        errorEl.textContent = '';
        return;
    }

    const toMm = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8, yd: 914.4 };
    const scale = (real * toMm[realUnit]) / (drawing * toMm[drawingUnit]);
    scaleEl.textContent = Math.round(scale);

    const allScales = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 1250, 2500, 5000];
    let nearest = allScales[0];
    let minDiff = Infinity;
    for (const s of allScales) {
        const diff = Math.abs(s - scale);
        if (diff < minDiff) { minDiff = diff; nearest = s; }
    }

    nearestEl.textContent = `Nearest standard scale: 1:${nearest}`;
    const error = ((scale - nearest) / nearest * 100).toFixed(1);
    errorEl.textContent = Math.abs(error) < 0.1 ? '✓ Exact match!' : `Difference: ${Math.abs(error)}% from 1:${nearest}`;
}

// ==========================================
// PAPER FIT CHECKER
// ==========================================
function initPaperFit() {
    document.getElementById('paper-fit-width').addEventListener('input', doPaperFit);
    document.getElementById('paper-fit-height').addEventListener('input', doPaperFit);
    const scaleSelect = document.getElementById('paper-fit-scale');
    const customVal = document.getElementById('paper-fit-custom-val');
    scaleSelect.addEventListener('change', () => {
        if (customVal) customVal.style.display = scaleSelect.value === 'custom' ? 'block' : 'none';
        doPaperFit();
    });
    if (customVal) customVal.addEventListener('input', doPaperFit);
}

function doPaperFit() {
    const w = parseFloat(document.getElementById('paper-fit-width').value);
    const h = parseFloat(document.getElementById('paper-fit-height').value);
    const scaleVal = document.getElementById('paper-fit-scale').value;
    let scale = 100;
    if (scaleVal === 'custom') {
        scale = parseFloat(document.getElementById('paper-fit-custom-val').value);
    } else {
        scale = parseInt(scaleVal);
    }
    
    const sizeEl = document.getElementById('paper-drawing-size');
    const gridEl = document.getElementById('paper-fit-grid');

    if (isNaN(w) || isNaN(h) || isNaN(scale) || scale <= 0) {
        sizeEl.textContent = '';
        gridEl.innerHTML = '';
        return;
    }

    const dw = (w * 1000) / scale;
    const dh = (h * 1000) / scale;
    sizeEl.innerHTML = `Drawing size at 1:${scale}: <strong>${fmt(dw)} mm × ${fmt(dh)} mm</strong>`;

    const allPapers = [];
    for (const [group, sizes] of Object.entries(paperSizes)) {
        for (const p of sizes) {
            const fitP = (dw + marginMm * 2 <= p.width) && (dh + marginMm * 2 <= p.height);
            const fitL = (dw + marginMm * 2 <= p.height) && (dh + marginMm * 2 <= p.width);
            const orient = fitP ? '(portrait)' : fitL ? '(landscape)' : '';
            allPapers.push({ ...p, fits: fitP || fitL, orientation: orient, area: p.width * p.height });
        }
    }
    allPapers.sort((a, b) => a.area - b.area);

    gridEl.innerHTML = allPapers.map(p => `
        <div class="paper-card ${p.fits ? 'fits' : 'no-fit'}">
            <div class="paper-name">${p.name}</div>
            <div class="paper-dims">${p.width} × ${p.height} mm</div>
            <div class="paper-status">${p.fits ? '✓ Fits ' + p.orientation : '✗ Too large'}</div>
        </div>
    `).join('');
}

// ==========================================
// SCALE RESIZE CALCULATOR
// ==========================================
function initScaleResize() {
    const fromSelect = document.getElementById('resize-from-scale');
    const toSelect = document.getElementById('resize-to-scale');
    const fromCustom = document.getElementById('resize-from-custom-val');
    const toCustom = document.getElementById('resize-to-custom-val');

    fromSelect.addEventListener('change', () => {
        if (fromCustom) fromCustom.style.display = fromSelect.value === 'custom' ? 'block' : 'none';
        doResize();
    });
    toSelect.addEventListener('change', () => {
        if (toCustom) toCustom.style.display = toSelect.value === 'custom' ? 'block' : 'none';
        doResize();
    });
    if (fromCustom) fromCustom.addEventListener('input', doResize);
    if (toCustom) toCustom.addEventListener('input', doResize);
    document.getElementById('resize-drawing-val').addEventListener('input', doResize);
}

function doResize() {
    const fromVal = document.getElementById('resize-from-scale').value;
    const toVal = document.getElementById('resize-to-scale').value;
    let from = fromVal === 'custom' ? parseFloat(document.getElementById('resize-from-custom-val').value) : parseInt(fromVal);
    let to = toVal === 'custom' ? parseFloat(document.getElementById('resize-to-custom-val').value) : parseInt(toVal);
    
    const val = parseFloat(document.getElementById('resize-drawing-val').value);
    const pctEl = document.getElementById('resize-percentage');
    const detEl = document.getElementById('resize-detail');

    if (isNaN(val) || isNaN(from) || isNaN(to) || from <= 0 || to <= 0) {
        pctEl.textContent = '—';
        detEl.textContent = '';
        return;
    }

    const pct = (from / to) * 100;
    const newVal = val * (from / to);

    pctEl.textContent = `${fmt(pct)}%`;
    detEl.innerHTML = `New drawing dimension: ${fmt(newVal)} mm at 1:${from} → <strong>${fmt(newVal)} mm</strong> at 1:${to}`;

    if (pct > 100) {
        detEl.innerHTML += `<br><span style="color:var(--text-success)">↑ Enlarge to ${fmt(pct)}%</span>`;
    } else if (pct < 100) {
        detEl.innerHTML += `<br><span style="color:var(--text-warning)">↓ Reduce to ${fmt(pct)}%</span>`;
    } else {
        detEl.innerHTML += `<br><span style="color:var(--text-accent)">= Same size (100%)</span>`;
    }
}

// ==========================================
// CONSTRUCTION CONVERTERS
// ==========================================
function initConstructionConverters() {
    wireConverter('bf', 'boardfeet', 'board-feet-result');
    wireConverter('roof', 'roofing', 'roofing-result');
    wireConverter('concrete', 'concrete', 'concrete-result');
}

function wireConverter(prefix, category, resultId) {
    const fromVal = document.getElementById(`${prefix}-from-val`);
    const toVal = document.getElementById(`${prefix}-to-val`);
    const fromUnit = document.getElementById(`${prefix}-from-unit`);
    const toUnit = document.getElementById(`${prefix}-to-unit`);
    const resultEl = document.getElementById(resultId);

    const convert_ = () => {
        const val = parseFloat(fromVal.value);
        if (isNaN(val)) {
            toVal.value = '';
            resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
            return;
        }
        const result = convert(category, val, fromUnit.value, toUnit.value);
        const formatted = fmt(result);
        toVal.value = formatted;
        const fn = units[category]?.[fromUnit.value]?.abbr || fromUnit.value;
        const tn = units[category]?.[toUnit.value]?.abbr || toUnit.value;
        resultEl.querySelector('.result-text').textContent = `${val} ${fn} = ${formatted} ${tn}`;
    };

    fromVal.addEventListener('input', convert_);
    fromUnit.addEventListener('change', convert_);
    toUnit.addEventListener('change', convert_);
}

// ==========================================
// REFERENCE TABLES
// ==========================================
function initReferenceTables() {
    renderArchDimensions();
    renderMaterialDensities();
    renderPaperSizes('iso');
    renderScaleRef('metric');

    document.getElementById('arch-dim-search').addEventListener('input', renderArchDimensions);
    document.getElementById('material-search').addEventListener('input', renderMaterialDensities);

    document.querySelectorAll('#paper-sizes-table .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#paper-sizes-table .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPaperSizes(btn.dataset.group);
        });
    });

    document.querySelectorAll('#scale-ref-table .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#scale-ref-table .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderScaleRef(btn.dataset.group);
        });
    });
}

function renderArchDimensions() {
    const q = document.getElementById('arch-dim-search').value.toLowerCase();
    const el = document.querySelector('#arch-dimensions-table .table-container');
    const filtered = archDimensions.filter(d =>
        d.item.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) ||
        d.metric.toLowerCase().includes(q) || d.imperial.toLowerCase().includes(q)
    );

    // Group by category
    const groups = {};
    for (const d of filtered) {
        if (!groups[d.category]) groups[d.category] = [];
        groups[d.category].push(d);
    }

    const icons = {
        'Doors': '🚪', 'Windows': '🪟', 'Stairs': '🪜', 'Walls': '🧱',
        'Ceiling': '🏠', 'Ramps': '♿', 'Kitchens': '🍳', 'Bathrooms': '🚿',
        'Structure': '🏗️', 'Floors': '🟫', 'Exterior': '🌳', 'Fire Safety': '🔥', 'Acoustics': '🔊',
        'Sofas': '🛋️', 'Beds': '🛏️', 'Tables': '🪑', 'Chairs': '💺',
        'Storage': '🗄️', 'Cupboards': '📦', 'Outdoor': '☀️'
    };

    el.innerHTML = Object.entries(groups).map(([cat, items]) => `
            <details class="arch-category">
            <summary class="arch-category-header">
                <span class="arch-cat-icon">${icons[cat] || '📏'}</span>
                <span class="arch-cat-name">${cat}</span>
                <span class="arch-cat-count">${items.length}</span>
            </summary>
            <div class="arch-category-body">
                <table class="ref-table">
                    <thead><tr><th>Item</th><th>Metric</th><th>Imperial</th></tr></thead>
                    <tbody>${items.map(d => `<tr><td>${d.item}</td><td>${d.metric}</td><td>${d.imperial}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        </details>
    `).join('');
}

function renderMaterialDensities() {
    const q = document.getElementById('material-search').value.toLowerCase();
    const el = document.querySelector('#material-densities-table .table-container');
    const rows = materials.filter(m => m.name.toLowerCase().includes(q));
    el.innerHTML = `<table class="ref-table"><thead><tr><th>Material</th><th>Density</th><th>Imperial</th></tr></thead><tbody>${
        rows.map(m => `<tr><td>${m.name}</td><td>${m.density} ${m.unit}</td><td>${m.imperial}</td></tr>`).join('')
    }</tbody></table>`;
}

function renderPaperSizes(group) {
    const el = document.querySelector('#paper-sizes-table .table-container');
    const sizes = paperSizes[group] || [];
    el.innerHTML = `<table class="ref-table"><thead><tr><th>Size</th><th>Width (mm)</th><th>Height (mm)</th><th>Width (cm)</th><th>Height (cm)</th><th>Width (in)</th><th>Height (in)</th></tr></thead><tbody>${
        sizes.map(s => `<tr><td><strong>${s.name}</strong></td><td>${s.width}</td><td>${s.height}</td><td>${(s.width/10).toFixed(1)}</td><td>${(s.height/10).toFixed(1)}</td><td>${(s.width/25.4).toFixed(2)}</td><td>${(s.height/25.4).toFixed(2)}</td></tr>`).join('')
    }</tbody></table>`;
}

function renderScaleRef(group) {
    const el = document.querySelector('#scale-ref-table .table-container');
    if (group === 'metric') {
        el.innerHTML = `<table class="ref-table"><thead><tr><th>Scale</th><th>Use Case</th><th>Detail Level</th></tr></thead><tbody>${
            metricScales.map(s => `<tr><td><strong>${s.label}</strong></td><td>${s.use}</td><td>${getDetailLevel(s.value)}</td></tr>`).join('')
        }</tbody></table>`;
    } else {
        el.innerHTML = `<table class="ref-table"><thead><tr><th>Scale</th><th>Metric Equivalent</th><th>Use Case</th></tr></thead><tbody>${
            imperialScales.map(s => `<tr><td><strong>${s.label}</strong></td><td>1:${s.metric}</td><td>${s.use}</td></tr>`).join('')
        }</tbody></table>`;
    }
}

function getDetailLevel(s) {
    if (s <= 10) return 'Extreme Detail';
    if (s <= 50) return 'High Detail';
    if (s <= 200) return 'Medium Detail';
    if (s <= 1000) return 'Low Detail';
    return 'Macro';
}
