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

const NON_NEGATIVE_CATEGORIES = new Set(['length', 'area', 'volume', 'mass', 'pressure', 'density']);
const CEMENT_BAG_VOLUME_M3 = 50 / 1440; // 50 kg bag at 1,440 kg/m³ nominal bulk density
const US_GALLON_LITERS = 3.785411784;

function unitLabel(unit) {
    return {
        mm: 'mm', cm: 'cm', m: 'm', km: 'km', in: 'in', ft: 'ft', yd: 'yd',
        mm2: 'mm²', cm2: 'cm²', m2: 'm²', km2: 'km²', ha: 'ha', acre: 'ac', in2: 'in²', ft2: 'ft²', yd2: 'yd²',
        mm3: 'mm³', cm3: 'cm³', m3: 'm³', L: 'L', mL: 'mL', gal: 'US gal', in3: 'in³', ft3: 'ft³', yd3: 'yd³',
        mg: 'mg', g: 'g', kg: 'kg', t: 't', oz: 'oz', lb: 'lb', st: 'st', C: '°C', F: '°F', K: 'K'
    }[unit] || unit;
}

function validPositive(value) {
    return Number.isFinite(value) && value > 0;
}

function validNonNegative(value) {
    return Number.isFinite(value) && value >= 0;
}

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
    initAreaToDim();
    initTriangleSolver();
    initPerimeterCalc();
    initStairCalc();
    initTileCalc();
    initBrickCalc();
    initPaintCalc();
    initVolWeightCalc();
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
    return Number(val).toFixed(precision);
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
            if (isNaN(val) || fromValEl.value === '' || (NON_NEGATIVE_CATEGORIES.has(cfg.category) && val < 0)) {
                toValEl.value = '';
                resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
                if (formulaEl) formulaEl.textContent = '';
                return;
            }
            const from = fromUnitEl.value;
            const to = toUnitEl.value;
            const result = convert(cfg.category, val, from, to);
            if (!Number.isFinite(result)) {
                toValEl.value = '';
                resultEl.querySelector('.result-text').textContent = 'Enter a physically valid value';
                if (formulaEl) formulaEl.textContent = '';
                return;
            }
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
    document.querySelectorAll('.btn-swap:not(#custom-scale-swap)').forEach(btn => {
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

    if (!validNonNegative(val)) {
        document.getElementById('scale-metric-to-val').value = '';
        resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
        return;
    }

    let activeScale = currentMetricScale;
    if (activeScale === 'custom') {
        activeScale = parseFloat(document.getElementById('metric-scale-custom-val').value);
        if (!validPositive(activeScale)) {
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

    if (!validPositive(val)) {
        document.getElementById('imp-scale-to-val').value = '';
        resultEl.querySelector('.result-text').textContent = 'Enter a value to convert';
        return;
    }

    let activeScale = currentImpScale;
    let ratioText = '';
    if (activeScale === 'custom') {
        activeScale = parseFloat(document.getElementById('imp-scale-custom-val').value);
        if (!validPositive(activeScale)) {
            document.getElementById('imp-scale-to-val').value = '';
            resultEl.querySelector('.result-text').textContent = 'Enter a valid custom scale';
            return;
        }
        ratioText = `1:${activeScale}`;
    } else {
        ratioText = `1/${activeScale}" = 1'-0"`;
    }

    const toInches = { ft: 12, in: 1, m: 1 / 0.0254 };
    const drawingInches = (val * toInches[fromUnit]) / activeScale;
    const fromInches = { in: 1, ft: 1 / 12, mm: 0.001 / 0.0254, cm: 0.01 / 0.0254 };
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

    if (!validPositive(val) || !validPositive(ratio)) {
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

    if (!validPositive(drawing) || !validPositive(real)) {
        scaleEl.textContent = '—';
        nearestEl.textContent = '';
        errorEl.textContent = '';
        return;
    }

    const toMm = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8, yd: 914.4 };
    const scale = (real * toMm[realUnit]) / (drawing * toMm[drawingUnit]);
    scaleEl.textContent = fmt(scale);

    const allScales = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 1250, 2500, 5000];
    let nearest = allScales[0];
    let minDiff = Infinity;
    for (const s of allScales) {
        const diff = Math.abs(s - scale) / s;
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

    if (!validPositive(w) || !validPositive(h) || !validPositive(scale)) {
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

    if (!validPositive(val) || !validPositive(from) || !validPositive(to)) {
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
    initConcreteMix();
    initMortarMix();
    initStructuralSizing();
    initFSICalc();
    initRampCalc();
    initLightVent();
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

function initConcreteMix() {
    const volInput = document.getElementById('concrete-mix-vol');
    const unitSelect = document.getElementById('concrete-mix-unit');
    const gradeSelect = document.getElementById('concrete-mix-grade');
    const resultEl = document.getElementById('concrete-mix-result');

    const calc = () => {
        const val = parseFloat(volInput.value);
        if (isNaN(val) || val <= 0) {
            resultEl.innerHTML = '<span class="result-text">Enter volume to calculate raw materials</span>';
            return;
        }

        const outputUnit = unitSelect.value;
        const volM3 = convert('volume', val, outputUnit, 'm3');
        const outputVolume = value => fmt(convert('volume', value, 'm3', outputUnit));
        
        const dryVolM3 = volM3 * 1.54;
        const ratioStr = gradeSelect.value;
        const parts = ratioStr.split(':').map(Number);
        const sum = parts[0] + parts[1] + parts[2];
        if (parts.length !== 3 || parts.some(part => !validPositive(part)) || !validPositive(sum)) {
            resultEl.innerHTML = '<span class="result-text">Select a valid concrete mix ratio</span>';
            return;
        }

        const cementM3 = (dryVolM3 / sum) * parts[0];
        const sandM3 = (dryVolM3 / sum) * parts[1];
        const aggM3 = (dryVolM3 / sum) * parts[2];

        const cementBags = cementM3 / CEMENT_BAG_VOLUME_M3;

        resultEl.innerHTML = `
            <strong>Dry Volume Required:</strong> ${outputVolume(dryVolM3)} ${unitLabel(outputUnit)}<br>
            <strong style="color:var(--primary-color);">Ratio breakdown — Cement: ${parts[0]} part, Sand: ${parts[1]} parts, Aggregate: ${parts[2]} parts</strong><br><br>
            <strong>Cement:</strong> ${fmt(cementBags)} bags (50kg)<br>
            <strong>Sand:</strong> ${outputVolume(sandM3)} ${unitLabel(outputUnit)}<br>
            <strong>Aggregate:</strong> ${outputVolume(aggM3)} ${unitLabel(outputUnit)}
            <br><small>Estimate assumptions: dry-volume factor 1.54 and 50 kg cement-bag volume ${fmt(CEMENT_BAG_VOLUME_M3)} m³.</small>
        `;
    };

    volInput.addEventListener('input', calc);
    unitSelect.addEventListener('change', calc);
    gradeSelect.addEventListener('change', calc);
}

function initMortarMix() {
    const volInput = document.getElementById('mortar-mix-vol');
    const unitSelect = document.getElementById('mortar-mix-unit');
    const appSelect = document.getElementById('mortar-mix-app');
    const resultEl = document.getElementById('mortar-mix-result');

    const calc = () => {
        const val = parseFloat(volInput.value);
        if (isNaN(val) || val <= 0) {
            resultEl.innerHTML = '<span class="result-text">Enter volume to calculate cement & sand</span>';
            return;
        }

        const outputUnit = unitSelect.value;
        const volM3 = convert('volume', val, outputUnit, 'm3');
        const outputVolume = value => fmt(convert('volume', value, 'm3', outputUnit));
        
        const dryVolM3 = volM3 * 1.33;
        const ratioStr = appSelect.value;
        const parts = ratioStr.split(':').map(Number);
        const sum = parts[0] + parts[1];
        if (parts.length !== 2 || parts.some(part => !validPositive(part)) || !validPositive(sum)) {
            resultEl.innerHTML = '<span class="result-text">Select a valid mortar mix ratio</span>';
            return;
        }

        const cementM3 = (dryVolM3 / sum) * parts[0];
        const sandM3 = (dryVolM3 / sum) * parts[1];

        const cementBags = cementM3 / CEMENT_BAG_VOLUME_M3;

        resultEl.innerHTML = `
            <strong>Dry Volume Required:</strong> ${outputVolume(dryVolM3)} ${unitLabel(outputUnit)}<br>
            <strong style="color:var(--primary-color);">Ratio breakdown — Cement: ${parts[0]} part, Sand: ${parts[1]} parts</strong><br><br>
            <strong>Cement:</strong> ${fmt(cementBags)} bags (50kg)<br>
            <strong>Sand:</strong> ${outputVolume(sandM3)} ${unitLabel(outputUnit)}
            <br><small>Estimate assumption: dry-volume factor 1.33.</small>
        `;
    };

    volInput.addEventListener('input', calc);
    unitSelect.addEventListener('change', calc);
    appSelect.addEventListener('change', calc);
}

function initStructuralSizing() {
    const floorsInput = document.getElementById('structural-floors');
    const spanInput = document.getElementById('structural-span');
    const resultEl = document.getElementById('structural-sizing-result');

    const calc = () => {
        const floors = parseInt(floorsInput.value);
        const span = parseFloat(spanInput.value);

        if (isNaN(floors) || floors < 1) {
            resultEl.innerHTML = '<span class="result-text">Enter valid number of floors</span>';
            return;
        }

        let out = `<strong>Recommended Span:</strong> For a G+${floors-1} building, an economical column span is between <strong>3.0 meters and 4.5 meters</strong>.<br>`;
        
        if (!isNaN(span) && span > 0) {
            const rawDepth = (span * 1000) / 12;
            const depth = Math.max(300, Math.ceil(rawDepth / 50) * 50);
            const width = Math.max(230, Math.ceil((depth / 2) / 10) * 10);
            
            let colWidth = 300;
            let colDepth = 300;
            if (floors <= 2) { colWidth = 230; colDepth = 300; }
            else if (floors === 3) { colWidth = 300; colDepth = 300; }
            else if (floors === 4) { colWidth = 300; colDepth = 380; }
            else { colWidth = 300; colDepth = 450 + ((floors-5)*50); }

            const widthIn = fmt(width / 25.4);
            const depthIn = fmt(depth / 25.4);
            const colWidthIn = fmt(colWidth / 25.4);
            const colDepthIn = fmt(colDepth / 25.4);

            if (span > 5) {
                out += `<br><span style="color:var(--text-warning);"><strong>Warning:</strong> Span exceeds standard economical limits.</span><br>`;
            }

            out += `
                <br><strong>Estimated Beam Size:</strong> ${width} mm × ${depth} mm (${widthIn}" × ${depthIn}")
                <br><strong>Estimated Column Size:</strong> Min. ${colWidth} mm × ${colDepth} mm (${colWidthIn}" × ${colDepthIn}")
            `;
        }

        resultEl.innerHTML = out;
    };

    floorsInput.addEventListener('input', calc);
    spanInput.addEventListener('input', calc);
    calc(); 
}

function initFSICalc() {
    const mode = document.getElementById('fsi-mode');
    const plot = document.getElementById('fsi-plot');
    const dyn = document.getElementById('fsi-dynamic-val');
    const label = document.getElementById('fsi-dynamic-label');
    const res = document.getElementById('fsi-result');

    const calc = () => {
        const p = parseFloat(plot.value);
        const d = parseFloat(dyn.value);
        if (!validPositive(p) || !Number.isFinite(d) || d < 0) {
            res.innerHTML = '<span class="result-text">Enter plot area and values</span>';
            return;
        }
        if (mode.value === 'max-area') {
            res.innerHTML = `<strong>Max Built-up Area:</strong> ${fmt(p * d)}`;
        } else {
            if (p <= 0) return;
            res.innerHTML = `<strong>Current FSI / FAR:</strong> ${fmt(d / p)}`;
        }
    };
    
    mode.addEventListener('change', () => {
        label.textContent = mode.value === 'max-area' ? 'Allowed FSI' : 'Total Built-up Area';
        calc();
    });
    plot.addEventListener('input', calc);
    dyn.addEventListener('input', calc);
}

function initRampCalc() {
    const rise = document.getElementById('ramp-rise');
    const unit = document.getElementById('ramp-unit');
    const res = document.getElementById('ramp-result');

    const calc = () => {
        const r = parseFloat(rise.value);
        if (!validPositive(r)) {
            res.innerHTML = '<span class="result-text">Enter the vertical rise to calculate ramp length</span>';
            return;
        }
        const riseM = convert('length', r, unit.value, 'm');
        const run = r * 12; // 1:12 running slope: 1 unit rise per 12 units run
        const angle = Math.atan(1/12) * (180 / Math.PI);
        let out = `
            <strong>Required Ramp Length (Run):</strong> ${fmt(run)} ${unit.value}<br>
            <strong>Slope Angle:</strong> ${fmt(angle)}°<br>
        `;
        
        const runInMeters = riseM * 12;
        if (runInMeters > 9 || riseM > 0.762) {
            out += `<br><span style="color:var(--text-warning);"><strong>Notice:</strong> ADA-style guidance limits a ramp run to about 9 m and rise to about 0.762 m before a level landing is required. Verify your local code.</span>`;
        }
        res.innerHTML = out;
    }
    rise.addEventListener('input', calc);
    unit.addEventListener('change', calc);
}

function initLightVent() {
    const area = document.getElementById('light-area');
    const unit = document.getElementById('light-unit');
    const res = document.getElementById('light-result');

    const calc = () => {
        const a = parseFloat(area.value);
        if (isNaN(a) || a <= 0) {
            res.innerHTML = '<span class="result-text">Enter floor area to estimate minimums</span>';
            return;
        }
        res.innerHTML = `
            <strong>Min. Window Area (Light 10%):</strong> ${fmt(a * 0.1)} ${unit.value}<br>
            <strong>Min. Openable Area (Ventilation 5%):</strong> ${fmt(a * 0.05)} ${unit.value}
        `;
    }
    area.addEventListener('input', calc);
    unit.addEventListener('change', calc);
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

// ==========================================
// AREA TO DIMENSIONS
// ==========================================
function initAreaToDim() {
    const valInput = document.getElementById('area-to-dim-val');
    const shapeSelect = document.getElementById('area-to-dim-shape');
    const ratioRow = document.getElementById('area-to-dim-ratio-row');
    const ratioInput = document.getElementById('area-to-dim-ratio');
    
    if (!valInput) return;

    const calculate = () => {
        const area = parseFloat(valInput.value);
        const shape = shapeSelect.value;
        const resultEl = document.getElementById('area-to-dim-result');
        const areaUnit = document.getElementById('area-to-dim-unit').value;
        const baseUnit = { m2: 'm', cm2: 'cm', mm2: 'mm', ft2: 'ft', in2: 'in' }[areaUnit] || 'm';
        
        ratioRow.style.display = shape === 'rectangle' ? 'flex' : 'none';

        if (isNaN(area) || area <= 0) {
            resultEl.querySelector('.result-text').textContent = 'Enter a valid area > 0';
            return;
        }

        let output = '';
        switch (shape) {
            case 'circle': {
                const r = Math.sqrt(area / Math.PI);
                output = `Radius = ${fmt(r)} ${baseUnit} | Diameter = ${fmt(2 * r)} ${baseUnit}`;
                break;
            }
            case 'square': {
                const s = Math.sqrt(area);
                output = `Side length = ${fmt(s)} ${baseUnit}`;
                break;
            }
            case 'triangle': {
                // Area of equilateral triangle = (sqrt(3)/4) * a^2
                const a = Math.sqrt((4 * area) / Math.sqrt(3));
                const h = (Math.sqrt(3) / 2) * a;
                output = `Side length = ${fmt(a)} ${baseUnit} | Height = ${fmt(h)} ${baseUnit}`;
                break;
            }
            case 'hexagon': {
                // Area of regular hexagon = (3*sqrt(3)/2) * s^2
                const s_hex = Math.sqrt((2 * area) / (3 * Math.sqrt(3)));
                const w_hex = 2 * s_hex; // Width (corner to corner)
                const h_hex = Math.sqrt(3) * s_hex; // Height (flat to flat)
                output = `Side length = ${fmt(s_hex)} ${baseUnit} | Width = ${fmt(w_hex)} ${baseUnit} | Height = ${fmt(h_hex)} ${baseUnit}`;
                break;
            }
            case 'rectangle': {
                const ratioStr = ratioInput.value.trim();
                let wRatio, hRatio;
                if (ratioStr.includes(':')) {
                    const parts = ratioStr.split(':').map(part => parseFloat(part.trim()));
                    [wRatio, hRatio] = parts;
                } else {
                    wRatio = parseFloat(ratioStr);
                    hRatio = 1;
                }

                if (!validPositive(wRatio) || !validPositive(hRatio)) {
                    resultEl.querySelector('.result-text').textContent = 'Enter a valid positive ratio such as 1:2';
                    return;
                }
                
                // area = w * h = (wRatio * x) * (hRatio * x) = wRatio * hRatio * x^2
                const x = Math.sqrt(area / (wRatio * hRatio));
                const width = wRatio * x;
                const height = hRatio * x;
                
                output = `Width = ${fmt(width)} ${baseUnit} | Height = ${fmt(height)} ${baseUnit}`;
                break;
            }
        }

        resultEl.querySelector('.result-text').textContent = output;
    };

    valInput.addEventListener('input', calculate);
    shapeSelect.addEventListener('change', calculate);
    ratioInput.addEventListener('input', calculate);
    document.getElementById('area-to-dim-unit').addEventListener('change', calculate);
}

// ==========================================
// NEW TOOLS
// ==========================================

function initTriangleSolver() {
    const base = document.getElementById('triangle-base');
    const height = document.getElementById('triangle-height');
    const hyp = document.getElementById('triangle-hyp');
    const angle = document.getElementById('triangle-angle');
    const clear = document.getElementById('triangle-clear');
    const result = document.getElementById('triangle-result');
    if (!base) return;

    const calculate = (event) => {
        let b = parseFloat(base.value);
        let h = parseFloat(height.value);
        let hy = parseFloat(hyp.value);
        let a = parseFloat(angle.value);
        
        let valid = 0;
        if (validPositive(b)) valid++;
        if (validPositive(h)) valid++;
        if (validPositive(hy)) valid++;
        if (Number.isFinite(a) && a > 0 && a < 90) valid++;

        if (valid < 2) {
            result.querySelector('.result-text').textContent = 'Enter two valid positive values (angle must be 0°–90°)';
            return;
        }

        const edited = event?.target?.id;
        const pairOrder = {
            'triangle-base': ['base-height', 'base-hyp', 'base-angle'],
            'triangle-height': ['base-height', 'height-hyp', 'height-angle'],
            'triangle-hyp': ['base-hyp', 'height-hyp', 'hyp-angle'],
            'triangle-angle': ['base-angle', 'height-angle', 'hyp-angle']
        }[edited] || ['base-height', 'base-hyp', 'height-hyp', 'base-angle', 'height-angle', 'hyp-angle'];

        let solved = false;
        for (const pair of pairOrder) {
            if (pair === 'base-height' && validPositive(b) && validPositive(h)) {
                hy = Math.sqrt(b * b + h * h);
                a = Math.atan2(h, b) * (180 / Math.PI);
                solved = true;
            } else if (pair === 'base-hyp' && validPositive(b) && validPositive(hy)) {
                if (hy <= b) continue;
                h = Math.sqrt(hy * hy - b * b);
                a = Math.atan2(h, b) * (180 / Math.PI);
                solved = true;
            } else if (pair === 'height-hyp' && validPositive(h) && validPositive(hy)) {
                if (hy <= h) continue;
                b = Math.sqrt(hy * hy - h * h);
                a = Math.atan2(h, b) * (180 / Math.PI);
                solved = true;
            } else if (pair === 'base-angle' && validPositive(b) && Number.isFinite(a) && a > 0 && a < 90) {
                h = b * Math.tan(a * Math.PI / 180);
                hy = b / Math.cos(a * Math.PI / 180);
                solved = true;
            } else if (pair === 'height-angle' && validPositive(h) && Number.isFinite(a) && a > 0 && a < 90) {
                b = h / Math.tan(a * Math.PI / 180);
                hy = h / Math.sin(a * Math.PI / 180);
                solved = true;
            } else if (pair === 'hyp-angle' && validPositive(hy) && Number.isFinite(a) && a > 0 && a < 90) {
                b = hy * Math.cos(a * Math.PI / 180);
                h = hy * Math.sin(a * Math.PI / 180);
                solved = true;
            }
            if (solved) break;
        }

        if (!solved || !validPositive(b) || !validPositive(h) || !validPositive(hy) || !Number.isFinite(a) || a <= 0 || a >= 90) {
            result.querySelector('.result-text').textContent = 'The entered values do not form a valid right triangle';
            return;
        }
        
        if (valid >= 2) {
            base.value = isNaN(b) ? '' : b.toFixed(4).replace(/\.?0+$/, '');
            height.value = isNaN(h) ? '' : h.toFixed(4).replace(/\.?0+$/, '');
            hyp.value = isNaN(hy) ? '' : hy.toFixed(4).replace(/\.?0+$/, '');
            angle.value = isNaN(a) ? '' : a.toFixed(4).replace(/\.?0+$/, '');
            
            let pitch = h / b;
            let slope = pitch * 100;
            
            result.querySelector('.result-text').innerHTML = 
                `Base: ${fmt(b)} | Height: ${fmt(h)} | Hypotenuse: ${fmt(hy)}<br>` + 
                `Angle: ${fmt(a)}° | Slope: ${fmt(slope)}% | Pitch: 1 in ${fmt(1/pitch)} | ${fmt(h*12/b)}:12`;
            addToHistory('Triangle Solver', `${fmt(b)}, ${fmt(h)}`, '', `Hyp: ${fmt(hy)}`, '');
        }
    };

    [base, height, hyp, angle].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });

    clear.addEventListener('click', () => {
        base.value = '';
        height.value = '';
        hyp.value = '';
        angle.value = '';
        result.querySelector('.result-text').textContent = 'Enter at least 2 values to calculate';
    });
}

function initPerimeterCalc() {
    const shape = document.getElementById('perimeter-shape');
    const dim1 = document.getElementById('perimeter-dim1');
    const dim2 = document.getElementById('perimeter-dim2');
    const dim2Group = document.getElementById('perimeter-dim2-group');
    const unit = document.getElementById('perimeter-unit');
    const l1 = document.getElementById('perimeter-l1');
    const l2 = document.getElementById('perimeter-l2');
    const result = document.getElementById('perimeter-result');
    if (!shape) return;

    const calculate = () => {
        const s = shape.value;
        const v1 = parseFloat(dim1.value);
        const v2 = parseFloat(dim2.value);
        const u = unit.value;
        if (!validPositive(v1)) {
            result.querySelector('.result-text').textContent = 'Enter a valid positive dimension';
            return;
        }

        let p = 0;
        let out = '';
        
        switch (s) {
            case 'circle': {
                p = 2 * Math.PI * v1;
                out = `Circumference = ${fmt(p)} ${u}`;
                break;
            }
            case 'square': {
                p = 4 * v1;
                out = `Perimeter = ${fmt(p)} ${u}`;
                break;
            }
            case 'rectangle': {
                if (!validPositive(v2)) {
                    result.querySelector('.result-text').textContent = 'Enter a valid positive width';
                    return;
                }
                p = 2 * (v1 + v2);
                out = `Perimeter = ${fmt(p)} ${u}`;
                break;
            }
            case 'triangle': {
                p = 3 * v1;
                out = `Perimeter = ${fmt(p)} ${u}`;
                break;
            }
            case 'polygon': {
                if (!Number.isInteger(v1) || v1 < 3 || !validPositive(v2)) {
                    result.querySelector('.result-text').textContent = 'A polygon needs at least 3 sides and a positive side length';
                    return;
                }
                p = v1 * v2;
                out = `Perimeter = ${fmt(p)} ${u}`;
                break;
            }
        }
        
        result.querySelector('.result-text').textContent = out;
        addToHistory('Perimeter', `${s} (${v1} ${u})`, '', out, '');
    };

    shape.addEventListener('change', () => {
        const s = shape.value;
        if (s === 'circle') {
            l1.textContent = 'Radius';
            dim2Group.style.display = 'none';
        } else if (s === 'square') {
            l1.textContent = 'Side Length';
            dim2Group.style.display = 'none';
        } else if (s === 'rectangle') {
            l1.textContent = 'Length';
            l2.textContent = 'Width';
            dim2Group.style.display = 'flex';
        } else if (s === 'triangle') {
            l1.textContent = 'Side Length';
            dim2Group.style.display = 'none';
        } else if (s === 'polygon') {
            l1.textContent = 'Number of Sides';
            l2.textContent = 'Side Length';
            dim2Group.style.display = 'flex';
        }
        calculate();
    });

    [dim1, dim2, unit].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}

function initStairCalc() {
    const rise = document.getElementById('stair-rise');
    const target = document.getElementById('stair-target-riser');
    const unit = document.getElementById('stair-unit');
    const result = document.getElementById('stair-result-text');
    if (!rise) return;

    const calculate = () => {
        const totalRise = parseFloat(rise.value);
        const targetRiser = parseFloat(target.value);
        if (!validPositive(totalRise) || !validPositive(targetRiser)) {
            result.textContent = 'Enter a positive total rise and target riser height';
            return;
        }

        let m = 1;
        if (unit.value === 'cm') m = 10;
        else if (unit.value === 'm') m = 1000;
        else if (unit.value === 'in') m = 25.4;
        else if (unit.value === 'ft') m = 304.8;
        
        const targetRiserMM = targetRiser * m;
        const totalRiseMM = totalRise * m;
        let steps = Math.ceil(totalRiseMM / targetRiserMM);
        if (steps < 1) steps = 1;
        
        const actualRiserMM = totalRiseMM / steps;
        const treadMM = 615 - (2 * actualRiserMM);
        
        const actualRiserOut = actualRiserMM / m;
        const treadOut = treadMM / m;
        const totalRun = treadOut * (steps - 1);
        
        const u = unit.value;
        
        const warnings = actualRiserMM < 150 || actualRiserMM > 190 || treadMM < 250 || treadMM > 300
            ? '<br><span style="color:var(--text-warning);"><strong>Check:</strong> Result is outside common preliminary stair ranges (riser 150–190 mm, tread 250–300 mm). Verify local code.</span>'
            : '';

        result.innerHTML = `
            <strong>Number of Risers (Steps):</strong> ${steps}<br>
            <strong>Actual Riser Height:</strong> ${fmt(actualRiserOut)} ${u}<br>
            <strong>Recommended Tread Depth:</strong> ${fmt(treadOut)} ${u} (based on 2R+T = 615 mm)<br>
            <strong>Total Run (Staircase Length):</strong> ${fmt(totalRun)} ${u}${warnings}
        `;
        addToHistory('Stair Calculator', `Rise: ${totalRise} ${u}`, '', `${steps} risers`, '');
    };

    [rise, target, unit].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}

function initTileCalc() {
    const area = document.getElementById('tile-area');
    const areaUnit = document.getElementById('tile-area-unit');
    const width = document.getElementById('tile-width');
    const length = document.getElementById('tile-length');
    const dimUnit = document.getElementById('tile-dim-unit');
    const grout = document.getElementById('tile-grout');
    const waste = document.getElementById('tile-waste');
    const box = document.getElementById('tile-box');
    const result = document.getElementById('tile-result');
    if (!area) return;

    const calculate = () => {
        const a = parseFloat(area.value);
        const w = parseFloat(width.value);
        const l = parseFloat(length.value);
        const g = parseFloat(grout.value);
        const ws = parseFloat(waste.value);
        const b = parseFloat(box.value);
        
        if (!validPositive(a) || !validPositive(w) || !validPositive(l) || !Number.isFinite(g) || g < 0 || !Number.isFinite(ws) || ws < 0 || (Number.isFinite(b) && b <= 0)) {
            result.querySelector('.result-text').textContent = 'Enter positive area and tile dimensions; waste and grout cannot be negative';
            return;
        }
        
        const areaM2 = convert('area', a, areaUnit.value, 'm2');
        const tileW = convert('length', w, dimUnit.value, 'm') + convert('length', g, dimUnit.value, 'm');
        const tileL = convert('length', l, dimUnit.value, 'm') + convert('length', g, dimUnit.value, 'm');
        const tileAreaM2 = tileW * tileL;
        
        const rawTiles = areaM2 / tileAreaM2;
        const totalTiles = Math.ceil(rawTiles * (1 + (ws/100)));
        
        let out = `<strong>Total Tiles Needed:</strong> ${totalTiles} (incl. ${ws}% waste)<br>`;
        if (!isNaN(b) && b > 0) {
            const boxes = Math.ceil(totalTiles / b);
            out += `<strong>Boxes Needed:</strong> ${boxes}<br>`;
        }
        
        result.querySelector('.result-text').innerHTML = out;
        addToHistory('Tile Estimator', `${a} ${areaUnit.value}`, '', `${totalTiles} tiles`, '');
    };

    [area, areaUnit, width, length, dimUnit, grout, waste, box].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}

function initBrickCalc() {
    const area = document.getElementById('brick-area');
    const areaUnit = document.getElementById('brick-area-unit');
    const type = document.getElementById('brick-type');
    const customDim = document.getElementById('brick-custom-dim');
    const customGroup = document.getElementById('brick-custom-group');
    const mortar = document.getElementById('brick-mortar');
    const dimUnit = document.getElementById('brick-dim-unit');
    const waste = document.getElementById('brick-waste');
    const wallType = document.getElementById('brick-wall-type');
    const result = document.getElementById('brick-result');
    if (!area) return;

    const calculate = () => {
        const a = parseFloat(area.value);
        const t = type.value;
        const mort = parseFloat(mortar.value);
        const ws = parseFloat(waste.value);
        const wt = wallType.value;
        if (!validPositive(a) || !Number.isFinite(mort) || mort < 0 || !Number.isFinite(ws) || ws < 0) {
            result.querySelector('.result-text').textContent = 'Enter a positive wall area; mortar and waste cannot be negative';
            return;
        }
        
        const areaM2 = convert('area', a, areaUnit.value, 'm2');
        
        let bw = 215, bh = 65;
        let dimToMeters = 0.001; 
        
        if (t === 'block') { bw = 440; bh = 215; }
        else if (t === 'custom') {
            const parts = customDim.value.split(/[x×]/i).map(part => parseFloat(part.trim()));
            if (parts.length !== 2 || !validPositive(parts[0]) || !validPositive(parts[1])) {
                result.querySelector('.result-text').textContent = 'Enter custom brick dimensions like 215x65';
                return;
            }
            [bw, bh] = parts;
            dimToMeters = units.length[dimUnit.value]?.factor || 0;
            if (!dimToMeters) {
                result.querySelector('.result-text').textContent = 'Select a valid dimension unit';
                return;
            }
        }
        
        const mortDimToMeters = units.length[dimUnit.value]?.factor || 0;
        
        if (t !== 'custom') {
            bw = bw * 0.001;
            bh = bh * 0.001;
        } else {
            bw = bw * dimToMeters;
            bh = bh * dimToMeters;
        }
        
        let mortarM = mort * mortDimToMeters;
        
        const faceArea = (bw + mortarM) * (bh + mortarM);
        let rawBricks = areaM2 / faceArea;
        if (wt === 'full') rawBricks *= 2;
        
        const totalBricks = Math.ceil(rawBricks * (1 + (ws/100)));
        
        result.querySelector('.result-text').innerHTML = `
            <strong>Total Bricks/Blocks Needed:</strong> ${totalBricks}<br>
            <span style="font-size: 0.9em; opacity: 0.8;">(Includes ${ws}% waste margin)</span>
        `;
        addToHistory('Brick Calculator', `${a} ${areaUnit.value}`, '', `${totalBricks} units`, '');
    };

    type.addEventListener('change', () => {
        customGroup.style.display = type.value === 'custom' ? 'flex' : 'none';
        calculate();
    });

    [area, areaUnit, customDim, mortar, dimUnit, waste, wallType].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}

function initPaintCalc() {
    const area = document.getElementById('paint-area');
    const unit = document.getElementById('paint-unit');
    const subtract = document.getElementById('paint-subtract');
    const coats = document.getElementById('paint-coats');
    const coverage = document.getElementById('paint-coverage');
    const outUnit = document.getElementById('paint-out-unit');
    const result = document.getElementById('paint-result');
    if (!area) return;

    const calculate = () => {
        const a = parseFloat(area.value);
        const s = parseFloat(subtract.value);
        const c = parseFloat(coats.value);
        const cov = parseFloat(coverage.value);

        if (!validPositive(a) || !Number.isFinite(s) || s < 0 || !validPositive(c) || !validPositive(cov)) {
            result.querySelector('.result-text').textContent = 'Enter positive area, coats, and coverage; openings cannot be negative';
            return;
        }

        const netAreaM2 = Math.max(0, convert('area', a, unit.value, 'm2') - convert('area', s, unit.value, 'm2'));
        const litres = (netAreaM2 * c) / cov;
        const totalVolume = outUnit.value === 'gal' ? litres / US_GALLON_LITERS : litres;
        const outputLabel = outUnit.value === 'gal' ? 'US gal' : 'L';

        result.querySelector('.result-text').textContent = `Total Paint Needed = ${fmt(totalVolume)} ${outputLabel}`;
        addToHistory('Paint Estimator', `${fmt(netAreaM2)} m²`, '', `${fmt(totalVolume)} ${outputLabel}`, '');
    };

    [area, unit, subtract, coats, coverage, outUnit].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}

function initVolWeightCalc() {
    const val = document.getElementById('vol-weight-val');
    const unit = document.getElementById('vol-weight-unit');
    const material = document.getElementById('vol-weight-material');
    const customGrp = document.getElementById('vol-weight-custom-group');
    const customVal = document.getElementById('vol-weight-custom-val');
    const result = document.getElementById('vol-weight-result');
    if (!val) return;

    const calculate = () => {
        const v = parseFloat(val.value);
        if (!validPositive(v)) {
            result.querySelector('.result-text').textContent = 'Enter a positive volume';
            return;
        }
        
        let density = 1000;
        if (material.value === 'custom') {
            density = parseFloat(customVal.value);
        } else {
            density = parseFloat(material.value);
        }
        if (!validPositive(density)) {
            result.querySelector('.result-text').textContent = 'Enter a positive custom density';
            return;
        }

        const u = unit.value;
        const m3 = convert('volume', v, u, 'm3');
        const weightKg = m3 * density;
        const weightTonnes = weightKg / 1000;
        const weightLbs = weightKg / 0.45359237;
        
        result.querySelector('.result-text').innerHTML = `
            <strong>Weight:</strong><br>
            ${fmt(weightKg)} kg<br>
            ${fmt(weightTonnes)} Tonnes<br>
            ${fmt(weightLbs)} lbs
        `;
        addToHistory('Vol to Weight', `${v} ${unitLabel(u)}`, '', `${fmt(weightKg)} kg`, '');
    };

    material.addEventListener('change', () => {
        customGrp.style.display = material.value === 'custom' ? 'flex' : 'none';
        calculate();
    });

    [val, unit, customVal].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });
}
