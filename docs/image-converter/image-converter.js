// Image Converter Utility
function initializeImageConverter() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageName = document.getElementById('image-name');
    const imageSize = document.getElementById('image-size');
    const imageDimensions = document.getElementById('image-dimensions');
    const removeImageBtn = document.getElementById('remove-image');
    const conversionControls = document.getElementById('conversion-controls');
    const formatButtons = document.querySelectorAll('.format-btn');
    const qualityControl = document.getElementById('quality-control');
    const qualityRange = document.getElementById('quality-range');
    const qualityValue = document.getElementById('quality-value');
    const conversionResult = document.getElementById('conversion-result');
    const resultImg = document.getElementById('result-img');
    const downloadBtn = document.getElementById('download-btn');
    const convertAnotherBtn = document.getElementById('convert-another');
    const originalSizeDisplay = document.getElementById('original-size-display');
    const convertedSizeDisplay = document.getElementById('converted-size-display');
    const sizeReduction = document.getElementById('size-reduction');

    let currentFile = null;
    let selectedFormat = null;

    // File size formatting
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.image-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `image-notification ${type}`;
        notification.textContent = message;
        
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

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Handle file selection
    function handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be less than 10MB', 'error');
            return;
        }

        currentFile = file;
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            
            // Get image dimensions
            previewImg.onload = () => {
                imageDimensions.textContent = `${previewImg.naturalWidth} × ${previewImg.naturalHeight}px`;
            };
        };
        reader.readAsDataURL(file);

        // Update file info
        imageName.textContent = file.name;
        imageSize.textContent = formatFileSize(file.size);

        // Show preview and controls
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
        conversionControls.style.display = 'block';
        conversionResult.style.display = 'none';

        showNotification('Image loaded successfully!', 'success');
    }

    // Convert image
    function convertImage(format, quality = 0.9) {
        if (!currentFile) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            // Convert to selected format
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                           format === 'png' ? 'image/png' : 'image/webp';
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    showNotification('Conversion failed. Format may not be supported.', 'error');
                    return;
                }

                // Create result preview
                const resultUrl = URL.createObjectURL(blob);
                resultImg.src = resultUrl;

                // Update size comparison
                const originalSize = currentFile.size;
                const convertedSize = blob.size;
                originalSizeDisplay.textContent = formatFileSize(originalSize);
                convertedSizeDisplay.textContent = formatFileSize(convertedSize);

                const reduction = ((originalSize - convertedSize) / originalSize * 100);
                if (reduction > 0) {
                    sizeReduction.textContent = `(-${reduction.toFixed(1)}%)`;
                    sizeReduction.style.color = 'var(--genomic-green)';
                } else {
                    sizeReduction.textContent = `(+${Math.abs(reduction).toFixed(1)}%)`;
                    sizeReduction.style.color = 'var(--pyroman-flame)';
                }

                // Setup download
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = resultUrl;
                    const extension = format === 'jpeg' ? 'jpg' : format;
                    const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
                    link.download = `${baseName}_converted.${extension}`;
                    link.click();
                    showNotification('Download started!', 'success');
                };

                conversionResult.style.display = 'block';
                showNotification(`Image converted to ${format.toUpperCase()}!`, 'success');

            }, mimeType, quality);
        };

        img.src = previewImg.src;
    }

    // Event listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        currentFile = null;
        selectedFormat = null;
        uploadArea.style.display = 'block';
        imagePreview.style.display = 'none';
        conversionControls.style.display = 'none';
        conversionResult.style.display = 'none';
        fileInput.value = '';
        formatButtons.forEach(btn => btn.classList.remove('selected'));
        qualityControl.style.display = 'none';
    });

    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            formatButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedFormat = btn.dataset.format;

            // Show quality control for lossy formats
            if (selectedFormat === 'jpeg' || selectedFormat === 'webp') {
                qualityControl.style.display = 'block';
            } else {
                qualityControl.style.display = 'none';
            }

            // Auto-convert
            const quality = parseInt(qualityRange.value) / 100;
            convertImage(selectedFormat, quality);
        });
    });

    qualityRange.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
        if (selectedFormat && (selectedFormat === 'jpeg' || selectedFormat === 'webp')) {
            const quality = parseInt(e.target.value) / 100;
            convertImage(selectedFormat, quality);
        }
    });

    convertAnotherBtn.addEventListener('click', () => {
        removeImageBtn.click();
    });

    console.log('Image Converter initialized successfully!');
}
