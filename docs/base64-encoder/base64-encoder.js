// Base64 Encoder/Decoder Utility
function initializeBase64Encoder() {
    const decodedTextarea = document.getElementById('decoded-text');
    const encodedTextarea = document.getElementById('encoded-text');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const clearAllBtn = document.getElementById('clear-all');
    const copyDecodedBtn = document.getElementById('copy-decoded');
    const copyEncodedBtn = document.getElementById('copy-encoded');
    const decodedCount = document.getElementById('decoded-count');
    const encodedCount = document.getElementById('encoded-count');

    // Update character counts
    function updateCharCount(textarea, countElement) {
        const count = textarea.value.length;
        countElement.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }

    // Encode text to Base64
    function encodeToBase64() {
        try {
            const text = decodedTextarea.value;
            if (!text.trim()) {
                showNotification('Please enter some text to encode', 'warning');
                return;
            }
            
            const encoded = btoa(unescape(encodeURIComponent(text)));
            encodedTextarea.value = encoded;
            updateCharCount(encodedTextarea, encodedCount);
            showNotification('Text encoded successfully!', 'success');
        } catch (error) {
            showNotification('Error encoding text: ' + error.message, 'error');
        }
    }

    // Decode Base64 to text
    function decodeFromBase64() {
        try {
            const encoded = encodedTextarea.value;
            if (!encoded.trim()) {
                showNotification('Please enter Base64 text to decode', 'warning');
                return;
            }
            
            const decoded = decodeURIComponent(escape(atob(encoded)));
            decodedTextarea.value = decoded;
            updateCharCount(decodedTextarea, decodedCount);
            showNotification('Base64 decoded successfully!', 'success');
        } catch (error) {
            showNotification('Error decoding Base64: Invalid format', 'error');
        }
    }

    // Clear all text areas
    function clearAll() {
        decodedTextarea.value = '';
        encodedTextarea.value = '';
        updateCharCount(decodedTextarea, decodedCount);
        updateCharCount(encodedTextarea, encodedCount);
        showNotification('All fields cleared', 'info');
    }

    // Copy text to clipboard
    async function copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            showNotification(`${type} text copied to clipboard!`, 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`${type} text copied to clipboard!`, 'success');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.base64-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `base64-notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-family: 'Roboto', sans-serif;
            font-weight: 500;
            font-size: 0.9rem;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Event listeners
    encodeBtn.addEventListener('click', encodeToBase64);
    decodeBtn.addEventListener('click', decodeFromBase64);
    clearAllBtn.addEventListener('click', clearAll);
    
    copyDecodedBtn.addEventListener('click', () => {
        const text = decodedTextarea.value;
        if (text.trim()) {
            copyToClipboard(text, 'Decoded');
        } else {
            showNotification('No decoded text to copy', 'warning');
        }
    });
    
    copyEncodedBtn.addEventListener('click', () => {
        const text = encodedTextarea.value;
        if (text.trim()) {
            copyToClipboard(text, 'Encoded');
        } else {
            showNotification('No encoded text to copy', 'warning');
        }
    });

    // Update character counts on input
    decodedTextarea.addEventListener('input', () => updateCharCount(decodedTextarea, decodedCount));
    encodedTextarea.addEventListener('input', () => updateCharCount(encodedTextarea, encodedCount));

    // Initialize character counts
    updateCharCount(decodedTextarea, decodedCount);
    updateCharCount(encodedTextarea, encodedCount);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'e':
                    e.preventDefault();
                    encodeToBase64();
                    break;
                case 'd':
                    e.preventDefault();
                    decodeFromBase64();
                    break;
                case 'k':
                    e.preventDefault();
                    clearAll();
                    break;
            }
        }
    });

    console.log('Base64 Encoder/Decoder initialized successfully!');
    console.log('Keyboard shortcuts:');
    console.log('- Ctrl/Cmd + E: Encode');
    console.log('- Ctrl/Cmd + D: Decode');
    console.log('- Ctrl/Cmd + K: Clear All');
}
