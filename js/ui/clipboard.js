// Copy to clipboard functionality
export function initClipboard() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-copy')) {
            const display = e.target.closest('.result-display');
            if (display) {
                const text = display.querySelector('.result-text')?.textContent || '';
                if (text && text !== 'Enter a value to convert') {
                    navigator.clipboard.writeText(text).then(() => {
                        showToast('Copied to clipboard!');
                    }).catch(() => {
                        // Fallback
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        showToast('Copied to clipboard!');
                    });
                }
            }
        }
    });
}

let toastTimeout;
export function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}
