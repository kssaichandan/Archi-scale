// js/calculator.js

document.addEventListener('DOMContentLoaded', () => {
    const calcToggle = document.getElementById('calcToggle');
    const calcPanel = document.getElementById('calcPanel');
    const modeBtns = document.querySelectorAll('.calc-mode-btn');
    const keypad = document.getElementById('calcKeypad');
    const display = document.getElementById('calcDisplay');
    const historyDisplay = document.getElementById('calcHistoryDisplay');

    if (!calcToggle || !calcPanel) return;

    let currentMode = 'normal';
    let currentValue = '0';
    let previousValue = '';
    let operator = null;
    let waitingForNewValue = false;
    let historyStr = '';

    const normalKeys = [
        ['C', '±', '%', '/'],
        ['7', '8', '9', '*'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '=']
    ];

    const scientificKeys = [
        ['sin', 'cos', 'tan', 'C', '/'],
        ['ln', '7', '8', '9', '*'],
        ['log', '4', '5', '6', '-'],
        ['√', '1', '2', '3', '+'],
        ['^', '0', '.', '=']
    ];

    function renderKeys() {
        keypad.innerHTML = '';
        keypad.className = `calc-keypad ${currentMode}`;
        
        const keysToRender = currentMode === 'normal' ? normalKeys : scientificKeys;
        
        keysToRender.forEach(row => {
            row.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'calc-btn';
                btn.textContent = key;
                
                if (key === '0') btn.classList.add('zero');
                if (key === '=') btn.classList.add('equals');
                if (['+', '-', '*', '/'].includes(key)) btn.classList.add('operator');
                if (key === 'C') btn.classList.add('clear');
                
                btn.addEventListener('click', () => handleKeyPress(key));
                keypad.appendChild(btn);
            });
        });
    }

    function updateDisplay() {
        display.value = currentValue;
        historyDisplay.textContent = historyStr;
    }

    function calculate(a, b, op) {
        a = parseFloat(a);
        b = parseFloat(b);
        if (isNaN(a) || isNaN(b)) return a;
        
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : 'Error';
            case '^': return Math.pow(a, b);
            default: return b;
        }
    }

    function handleMathFunction(func) {
        const val = parseFloat(currentValue);
        if (isNaN(val)) return;
        
        let result = 0;
        switch (func) {
            case 'sin': result = Math.sin(val); historyStr = `sin(${val})`; break;
            case 'cos': result = Math.cos(val); historyStr = `cos(${val})`; break;
            case 'tan': result = Math.tan(val); historyStr = `tan(${val})`; break;
            case 'ln': result = Math.log(val); historyStr = `ln(${val})`; break;
            case 'log': result = Math.log10(val); historyStr = `log(${val})`; break;
            case '√': result = Math.sqrt(val); historyStr = `√(${val})`; break;
        }
        currentValue = String(result);
        waitingForNewValue = true;
        updateDisplay();
    }

    function handleKeyPress(key) {
        if (/[0-9]/.test(key)) {
            if (waitingForNewValue) {
                currentValue = key;
                waitingForNewValue = false;
            } else {
                currentValue = currentValue === '0' ? key : currentValue + key;
            }
        } else if (key === '.') {
            if (waitingForNewValue) {
                currentValue = '0.';
                waitingForNewValue = false;
            } else if (!currentValue.includes('.')) {
                currentValue += '.';
            }
        } else if (key === 'C') {
            currentValue = '0';
            previousValue = '';
            operator = null;
            historyStr = '';
            waitingForNewValue = false;
        } else if (key === '±') {
            currentValue = String(parseFloat(currentValue) * -1);
        } else if (key === '%') {
            currentValue = String(parseFloat(currentValue) / 100);
        } else if (['sin', 'cos', 'tan', 'ln', 'log', '√'].includes(key)) {
            handleMathFunction(key);
            return;
        } else if (['+', '-', '*', '/', '^'].includes(key)) {
            if (operator && !waitingForNewValue) {
                const result = calculate(previousValue, currentValue, operator);
                currentValue = String(result);
                historyStr = `${previousValue} ${operator} ${currentValue} ${key}`;
            } else {
                historyStr = `${currentValue} ${key}`;
            }
            previousValue = currentValue;
            operator = key;
            waitingForNewValue = true;
        } else if (key === '=') {
            if (operator && previousValue) {
                const result = calculate(previousValue, currentValue, operator);
                historyStr = `${previousValue} ${operator} ${currentValue} =`;
                currentValue = String(result);
                previousValue = '';
                operator = null;
                waitingForNewValue = true;
            }
        }
        
        updateDisplay();
    }

    // Toggle Panel
    calcToggle.addEventListener('click', () => {
        if (calcPanel.classList.contains('show')) {
            calcPanel.classList.remove('visible');
            setTimeout(() => calcPanel.classList.remove('show'), 300);
        } else {
            calcPanel.classList.add('show');
            setTimeout(() => calcPanel.classList.add('visible'), 10);
        }
    });

    // Mode Switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            renderKeys();
        });
    });

    // Initialize
    renderKeys();
});
