// Hex Editor Implementation
function initializeHexEditor() {
    let currentColor = '#ffffff';
    let backgroundColor = '#ffffff';
    let hexRadius = 3;
    let hexData = new Map(); // Store hex colors by coordinates
    let hexCircleData = new Map(); // Store circle colors by coordinates
    let lineData = new Map(); // Store lines by ID
    let isDragging = false;
    let dragStarted = false;
    let isBackgroundTransparent = false;
    let currentMode = 'colors'; // 'colors' or 'lines'
    let currentLineType = 'solid';
    let currentLineColor = '#000000';
    let currentLineWidth = 2;
    let isDrawingLine = false;
    let lineStartHex = null;
    let hexBorderColor = '#000000';

    const radiusSlider = document.getElementById('hex-radius');
    const radiusValue = document.getElementById('radius-value');
    const colorOptions = document.querySelectorAll('.color-option');
    const customColorPicker = document.getElementById('custom-color');
    const hexInput = document.getElementById('hex-input');
    const backgroundColorPicker = document.getElementById('background-color');
    const backgroundHexInput = document.getElementById('background-hex-input');
    const transparentBackgroundCheckbox = document.getElementById('transparent-background');
    const borderColorPicker = document.getElementById('border-color');
    const borderHexInput = document.getElementById('border-hex-input');
    const clearButton = document.getElementById('clear-board');
    const exportButton = document.getElementById('export-board');
    const hexBoard = document.getElementById('hex-board');
    
    // Control tab elements
    const controlTabs = document.querySelectorAll('.control-tab');
    const controlTabContents = document.querySelectorAll('.control-tab-content');
    
    // Line drawing elements
    const lineTypeButtons = document.querySelectorAll('.line-type-btn');
    const lineColorPicker = document.getElementById('line-color');
    const lineHexInput = document.getElementById('line-hex-input');
    const lineWidthSlider = document.getElementById('line-width');
    const lineWidthValue = document.getElementById('line-width-value');

    if (!radiusSlider) return; // Exit if hex editor elements don't exist

    // Initialize with first color selected
    colorOptions[0].classList.add('selected');
    
    // Debug: Log initial setup
    console.log('Hex editor initialized, current color:', currentColor);

    // Radius slider functionality
    radiusSlider.addEventListener('input', function() {
        hexRadius = parseInt(this.value);
        radiusValue.textContent = hexRadius;
        generateHexBoard();
    });

    // Color palette selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            currentColor = this.dataset.color;
            customColorPicker.value = currentColor;
            hexInput.value = currentColor;
            console.log('Color selected:', currentColor);
        });
    });

    // Custom color picker
    customColorPicker.addEventListener('input', function() {
        currentColor = this.value;
        hexInput.value = this.value;
        colorOptions.forEach(opt => opt.classList.remove('selected'));
    });

    // Hex input field
    hexInput.addEventListener('input', function() {
        const value = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            currentColor = value;
            customColorPicker.value = value;
            colorOptions.forEach(opt => opt.classList.remove('selected'));
        }
    });

    // Background color picker
    backgroundColorPicker.addEventListener('input', function() {
        backgroundColor = this.value;
        backgroundHexInput.value = this.value;
        updateBackgroundColor();
    });

    // Background hex input field
    backgroundHexInput.addEventListener('input', function() {
        const value = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            backgroundColor = value;
            backgroundColorPicker.value = value;
            updateBackgroundColor();
        }
    });

    // Transparent background checkbox
    transparentBackgroundCheckbox.addEventListener('change', function() {
        isBackgroundTransparent = this.checked;
        backgroundColorPicker.disabled = this.checked;
        backgroundHexInput.disabled = this.checked;
        updateBackgroundColor();
    });

    // Global mouse up event to handle drag ending outside hex elements
    document.addEventListener('mouseup', function() {
        isDragging = false;
        dragStarted = false;
        isDrawingLine = false;
        lineStartHex = null;
        clearLinePreview();
    });

    // Prevent context menu on hex board during drag
    hexBoard.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Control tab switching
    controlTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.controlTab;
            
            // Update tab buttons
            controlTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update tab content
            controlTabContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}-controls`).classList.add('active');
            
            // Update current mode
            currentMode = targetTab;
            console.log('Switched to mode:', currentMode);
        });
    });

    // Line type selection
    lineTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            lineTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentLineType = this.dataset.lineType;
            console.log('Line type selected:', currentLineType);
        });
    });

    // Line color picker
    lineColorPicker.addEventListener('input', function() {
        currentLineColor = this.value;
        lineHexInput.value = this.value;
    });

    // Line hex input
    lineHexInput.addEventListener('input', function() {
        const value = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            currentLineColor = value;
            lineColorPicker.value = value;
        }
    });

    // Line width slider
    lineWidthSlider.addEventListener('input', function() {
        currentLineWidth = parseInt(this.value);
        lineWidthValue.textContent = currentLineWidth;
    });

    // Border color picker
    borderColorPicker.addEventListener('input', function() {
        hexBorderColor = this.value;
        borderHexInput.value = this.value;
        updateHexBorderColors();
    });

    // Border hex input
    borderHexInput.addEventListener('input', function() {
        const value = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            hexBorderColor = value;
            borderColorPicker.value = value;
            updateHexBorderColors();
        }
    });

    // Clear board
    clearButton.addEventListener('click', function() {
        hexData.clear();
        hexCircleData.clear();
        lineData.clear();
        generateHexBoard();
    });

    // Export board
    exportButton.addEventListener('click', exportHexBoard);

    // Generate hexagonal coordinates
    function generateHexCoordinates(radius) {
        const coords = [];
        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                coords.push({ q, r, s: -q - r });
            }
        }
        return coords;
    }

    // Convert hex coordinates to pixel coordinates (flat-top orientation)
    function hexToPixel(q, r, size) {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
        const y = size * (3/2 * r);
        return { x, y };
    }

    // Generate hexagon path (flat-top orientation)
    function generateHexPath(centerX, centerY, size) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6); // Rotate by 30 degrees for flat-top
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')} Z`;
    }

    // Update background color
    function updateBackgroundColor() {
        if (isBackgroundTransparent) {
            hexBoard.style.backgroundColor = 'transparent';
        } else {
            hexBoard.style.backgroundColor = backgroundColor;
        }
    }

    // Update hex border colors
    function updateHexBorderColors() {
        const hexCells = hexBoard.querySelectorAll('.hex-cell');
        hexCells.forEach(cell => {
            cell.setAttribute('stroke', hexBorderColor);
            cell.style.stroke = hexBorderColor;
        });
    }

    // Generate the hex board
    function generateHexBoard() {
        const coords = generateHexCoordinates(hexRadius);
        const hexSize = 20;
        const boardSize = (hexRadius * 2 + 1) * hexSize * 2;
        const centerX = boardSize / 2;
        const centerY = boardSize / 2;

        // Update SVG viewBox and background
        hexBoard.setAttribute('viewBox', `0 0 ${boardSize} ${boardSize}`);
        hexBoard.style.backgroundColor = backgroundColor;
        
        // Clear existing hexagons
        hexBoard.innerHTML = '';

        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            const hexPath = generateHexPath(centerX + pixel.x, centerY + pixel.y, hexSize);
            
            const hexElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hexElement.setAttribute('d', hexPath);
            hexElement.setAttribute('class', 'hex-cell');
            hexElement.setAttribute('stroke', hexBorderColor);
            hexElement.style.stroke = hexBorderColor;
            
            const coordKey = `${coord.q},${coord.r}`;
            const savedColor = hexData.get(coordKey) || '#ffffff'; // Default to white
            if (savedColor === 'transparent') {
                hexElement.setAttribute('fill', 'none');
                hexElement.style.fill = 'none';
            } else {
                hexElement.setAttribute('fill', savedColor);
                hexElement.style.fill = savedColor;
            }
            
            // Store coordinate key on the element for debugging
            hexElement.dataset.coord = coordKey;
            
            // Restore circles if they exist
            const savedCircleColor = hexCircleData.get(coordKey);
            if (savedCircleColor) {
                setTimeout(() => {
                    const circleId = `circle-${coordKey.replace(/,/g, '_').replace(/-/g, 'n')}`;
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('id', circleId);
                    circle.setAttribute('cx', centerX + pixel.x);
                    circle.setAttribute('cy', centerY + pixel.y);
                    circle.setAttribute('r', hexSize * 0.4);
                    circle.setAttribute('fill', savedCircleColor);
                    circle.style.pointerEvents = 'none';
                    hexBoard.appendChild(circle);
                }, 0);
            }
            
            // Paint function for reuse
            function paintHex(element, coord) {
                if (currentColor === 'transparent') {
                    element.style.fill = 'none';
                    element.setAttribute('fill', 'none');
                } else {
                    element.style.fill = currentColor;
                    element.setAttribute('fill', currentColor);
                }
                hexData.set(coord, currentColor);
            }
            
            // Add circle function
            function addCircle(coord, pixel) {
                const circleId = `circle-${coordKey.replace(/,/g, '_').replace(/-/g, 'n')}`;
                const existingCircle = hexBoard.querySelector(`#${circleId}`);
                
                if (existingCircle) {
                    existingCircle.remove();
                }
                
                if (currentColor !== 'transparent') {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('id', circleId);
                    circle.setAttribute('cx', centerX + pixel.x);
                    circle.setAttribute('cy', centerY + pixel.y);
                    circle.setAttribute('r', hexSize * 0.4); // Larger circle
                    circle.setAttribute('fill', currentColor);
                    circle.style.pointerEvents = 'none'; // Don't interfere with hex clicks
                    
                    hexBoard.appendChild(circle);
                    hexCircleData.set(coord, currentColor);
                } else {
                    hexCircleData.delete(coord);
                }
            }
            
            // Click event handling based on current mode
            hexElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.button === 0 && !isDragging) { // Only left-click (button 0)
                    if (currentMode === 'colors') {
                        paintHex(this, coordKey);
                    } else if (currentMode === 'lines') {
                        handleLineDrawing(coordKey, pixel);
                    }
                }
            });
            
            // Mouse down - start drag (left-click only)
            hexElement.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // Only left-click (button 0)
                    e.preventDefault();
                    if (currentMode === 'colors') {
                        isDragging = true;
                        dragStarted = true;
                        paintHex(this, coordKey);
                    } else if (currentMode === 'lines') {
                        isDrawingLine = true;
                        lineStartHex = { coord: coordKey, pixel: pixel };
                    }
                }
            });
            
            // Mouse enter - continue drag or show line preview
            hexElement.addEventListener('mouseenter', function(e) {
                if (currentMode === 'colors' && isDragging && dragStarted) {
                    paintHex(this, coordKey);
                } else if (currentMode === 'lines' && isDrawingLine && lineStartHex) {
                    showLinePreview(lineStartHex.pixel, pixel);
                }
            });
            
            // Mouse up - end drag or complete line (left-click only)
            hexElement.addEventListener('mouseup', function(e) {
                if (e.button === 0) { // Only left-click (button 0)
                    if (currentMode === 'colors') {
                        isDragging = false;
                        dragStarted = false;
                    } else if (currentMode === 'lines' && isDrawingLine && lineStartHex) {
                        drawLine(lineStartHex.coord, coordKey, lineStartHex.pixel, pixel);
                        isDrawingLine = false;
                        lineStartHex = null;
                        clearLinePreview();
                    }
                }
            });
            
            // Right-click event for circles (only in colors mode)
            hexElement.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (currentMode === 'colors') {
                    addCircle(coordKey, pixel);
                }
            });

            hexBoard.appendChild(hexElement);
        });
        
        // Restore lines if they exist
        lineData.forEach((lineInfo, lineId) => {
            drawStoredLine(lineInfo);
        });
    }

    // Line drawing functions
    function handleLineDrawing(coordKey, pixel) {
        if (!lineStartHex) {
            lineStartHex = { coord: coordKey, pixel: pixel };
            isDrawingLine = true;
        } else {
            drawLine(lineStartHex.coord, coordKey, lineStartHex.pixel, pixel);
            lineStartHex = null;
            isDrawingLine = false;
            clearLinePreview();
        }
    }

    function showLinePreview(startPixel, endPixel) {
        clearLinePreview();
        const previewLine = createLineElement(startPixel, endPixel, currentLineColor, currentLineWidth, currentLineType, true);
        previewLine.id = 'line-preview';
        previewLine.style.opacity = '0.5';
        hexBoard.appendChild(previewLine);
    }

    function clearLinePreview() {
        const preview = hexBoard.querySelector('#line-preview');
        if (preview) {
            preview.remove();
        }
    }

    function sanitizeLineId(coord1, coord2) {
        // Replace negative signs and commas with safe characters for CSS selectors
        const sanitized1 = coord1.replace(/-/g, 'n').replace(/,/g, '_');
        const sanitized2 = coord2.replace(/-/g, 'n').replace(/,/g, '_');
        return `line-${sanitized1}-${sanitized2}`;
    }

    function drawLine(startCoord, endCoord, startPixel, endPixel) {
        const lineId = sanitizeLineId(startCoord, endCoord);
        const reverseLineId = sanitizeLineId(endCoord, startCoord);
        
        // Remove existing line if it exists (in either direction)
        const existingLine = hexBoard.querySelector(`#${lineId}`) || hexBoard.querySelector(`#${reverseLineId}`);
        if (existingLine) {
            existingLine.remove();
            lineData.delete(lineId);
            lineData.delete(reverseLineId);
        }
        
        // Create new line
        const lineElement = createLineElement(startPixel, endPixel, currentLineColor, currentLineWidth, currentLineType, false);
        lineElement.id = lineId;
        
        // Store line data
        lineData.set(lineId, {
            startCoord,
            endCoord,
            startPixel,
            endPixel,
            color: currentLineColor,
            width: currentLineWidth,
            type: currentLineType
        });
        
        hexBoard.appendChild(lineElement);
    }

    function drawStoredLine(lineInfo) {
        // Recalculate pixel positions based on current board size
        const coords = generateHexCoordinates(hexRadius);
        const hexSize = 20;
        
        // Find the coordinates in the current grid
        const startCoordParts = lineInfo.startCoord.split(',');
        const endCoordParts = lineInfo.endCoord.split(',');
        const startQ = parseInt(startCoordParts[0]);
        const startR = parseInt(startCoordParts[1]);
        const endQ = parseInt(endCoordParts[0]);
        const endR = parseInt(endCoordParts[1]);
        
        const startPixel = hexToPixel(startQ, startR, hexSize);
        const endPixel = hexToPixel(endQ, endR, hexSize);
        
        const lineElement = createLineElement(
            startPixel, 
            endPixel, 
            lineInfo.color, 
            lineInfo.width, 
            lineInfo.type, 
            false
        );
        lineElement.id = sanitizeLineId(lineInfo.startCoord, lineInfo.endCoord);
        hexBoard.appendChild(lineElement);
    }

    function createLineElement(startPixel, endPixel, color, width, type, isPreview) {
        const boardSize = (hexRadius * 2 + 1) * 20 * 2;
        const centerX = boardSize / 2;
        const centerY = boardSize / 2;
        
        const x1 = centerX + startPixel.x;
        const y1 = centerY + startPixel.y;
        const x2 = centerX + endPixel.x;
        const y2 = centerY + endPixel.y;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.style.pointerEvents = 'none';
        
        if (type === 'solid' || type === 'dotted') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', width);
            if (type === 'dotted') {
                line.setAttribute('stroke-dasharray', `${width * 2},${width * 2}`);
            }
            group.appendChild(line);
        } else if (type === 'arrow-one' || type === 'arrow-two') {
            // Calculate arrow properties
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;
            const arrowSize = width * 3;
            
            if (type === 'arrow-two') {
                // Start arrow (pointing backwards)
                const startArrowX = x1 + unitX * arrowSize;
                const startArrowY = y1 + unitY * arrowSize;
                const startArrow = createArrowHead(startArrowX, startArrowY, x1, y1, arrowSize, color, false);
                group.appendChild(startArrow);
            }
            
            // Line (shortened for arrows)
            const lineStartX = type === 'arrow-two' ? x1 + unitX * arrowSize : x1;
            const lineStartY = type === 'arrow-two' ? y1 + unitY * arrowSize : y1;
            const lineEndX = x2 - unitX * arrowSize;
            const lineEndY = y2 - unitY * arrowSize;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', lineStartX);
            line.setAttribute('y1', lineStartY);
            line.setAttribute('x2', lineEndX);
            line.setAttribute('y2', lineEndY);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', width);
            group.appendChild(line);
            
            // End arrow
            const endArrow = createArrowHead(lineEndX, lineEndY, x2, y2, arrowSize, color, false);
            group.appendChild(endArrow);
        }
        
        return group;
    }

    function createArrowHead(x1, y1, x2, y2, size, color, reverse) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return null; // Prevent division by zero
        
        const unitX = dx / length;
        const unitY = dy / length;
        
        const perpX = -unitY;
        const perpY = unitX;
        
        const tipX = x2;
        const tipY = y2;
        const baseX = x1;
        const baseY = y1;
        
        const point1X = baseX + perpX * size * 0.5;
        const point1Y = baseY + perpY * size * 0.5;
        const point2X = baseX - perpX * size * 0.5;
        const point2Y = baseY - perpY * size * 0.5;
        
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${tipX},${tipY} ${point1X},${point1Y} ${point2X},${point2Y}`);
        arrow.setAttribute('fill', color);
        
        return arrow;
    }

    // Export hex board as PNG
    function exportHexBoard() {
        const svgData = new XMLSerializer().serializeToString(hexBoard);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // High-quality export settings
        const scaleFactor = 4; // 4x resolution for crisp output
        const svgRect = hexBoard.getBoundingClientRect();
        const exportWidth = Math.max(800, svgRect.width * scaleFactor);
        const exportHeight = Math.max(800, svgRect.height * scaleFactor);
        
        // Create high-resolution SVG with explicit dimensions
        const svgElement = hexBoard.cloneNode(true);
        svgElement.setAttribute('width', exportWidth);
        svgElement.setAttribute('height', exportHeight);
        svgElement.style.backgroundColor = isBackgroundTransparent ? 'transparent' : backgroundColor;
        
        // Ensure stroke properties are preserved with proper scaling
        const hexCells = svgElement.querySelectorAll('.hex-cell');
        
        hexCells.forEach(cell => {
            cell.setAttribute('stroke', hexBorderColor);
            cell.setAttribute('stroke-width', '1'); // Keep original stroke width, don't scale it
        });
        
        const highResSvgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([highResSvgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            // Set canvas to high resolution
            canvas.width = exportWidth;
            canvas.height = exportHeight;
            
            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Fill background if not transparent
            if (!isBackgroundTransparent) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Draw the SVG at high resolution
            ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
            
            // Export as high-quality PNG
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = `hex-board-${hexRadius}-radius-hq.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }, 'image/png', 1.0); // Maximum quality
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // Initialize the board
    generateHexBoard();
    
    // Initialize UI state to match defaults
    updateBackgroundColor();
}

// Make function globally available
window.initializeHexEditor = initializeHexEditor;
