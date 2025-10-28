// Hex Board Editor Implementation
function initializeHexBoardEditor() {
    // Initialize color palettes (no delete option for board editor)
    initializeColorPalettes('#colors-controls', {
        basic: { type: 'basic' },
        author: { type: 'author' }
    });
    
    let currentColor = '#ffffff';
    let backgroundColor = '#ffffff';
    let backgroundType = 'hexagon'; // 'solid', 'none', 'hexagon'
    let hexagonBgColor = '#000000';
    let hexagonStrokeColor = '#000000';
    let hexagonStrokeWidth = 1;
    let hexRadius = 3;
    let hexData = new Map(); // Store hex colors by coordinates
    let hexSymbolData = new Map(); // Store symbols (type and color) by coordinates
    let lineData = new Map(); // Store lines by ID
    let currentSymbolType = 'circle'; // Default symbol type
    let isDragging = false;
    let dragStarted = false;
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
    const backgroundTypeRadios = document.querySelectorAll('input[name="background-type"]');
    const solidBgControls = document.getElementById('solid-bg-controls');
    const hexagonBgControls = document.getElementById('hexagon-bg-controls');
    const hexagonBgColorPicker = document.getElementById('hexagon-bg-color');
    const hexagonBgHexInput = document.getElementById('hexagon-bg-hex-input');
    const hexagonStrokeColorPicker = document.getElementById('hexagon-stroke-color');
    const hexagonStrokeHexInput = document.getElementById('hexagon-stroke-hex-input');
    const hexagonStrokeWidthSlider = document.getElementById('hexagon-stroke-width');
    const hexagonStrokeWidthValue = document.getElementById('hexagon-stroke-width-value');
    const borderColorPicker = document.getElementById('border-color');
    const borderHexInput = document.getElementById('border-hex-input');
    const clearButton = document.getElementById('clear-board');
    const exportButton = document.getElementById('export-board');
    const exportFilenameInput = document.getElementById('export-filename');
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
    const symbolTypeButtons = document.querySelectorAll('.symbol-type-btn');

    if (!radiusSlider) return; // Exit if hex editor elements don't exist

    // Initialize with first color selected
    colorOptions[0].classList.add('selected');
    
    // Debug: Log initial setup
    console.log('Hex board editor initialized, current color:', currentColor);

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
            syncColorInputs(customColorPicker, hexInput, currentColor);
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
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            currentColor = this.value;
            customColorPicker.value = this.value;
            colorOptions.forEach(opt => opt.classList.remove('selected'));
        }
    });

    // Background type radio buttons
    backgroundTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                backgroundType = this.value;
                updateBackgroundControls();
                updateBackgroundColor();
            }
        });
    });

    // Background color picker
    backgroundColorPicker.addEventListener('input', function() {
        backgroundColor = this.value;
        syncColorInputs(backgroundColorPicker, backgroundHexInput, this.value);
        updateBackgroundColor();
    });

    // Background hex input field
    backgroundHexInput.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            backgroundColor = this.value;
            backgroundColorPicker.value = this.value;
            updateBackgroundColor();
        }
    });

    // Hexagon background controls
    hexagonBgColorPicker.addEventListener('input', function() {
        hexagonBgColor = this.value;
        syncColorInputs(hexagonBgColorPicker, hexagonBgHexInput, this.value);
        updateBackgroundColor();
    });

    hexagonBgHexInput.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            hexagonBgColor = this.value;
            hexagonBgColorPicker.value = this.value;
            updateBackgroundColor();
        }
    });

    hexagonStrokeColorPicker.addEventListener('input', function() {
        hexagonStrokeColor = this.value;
        syncColorInputs(hexagonStrokeColorPicker, hexagonStrokeHexInput, this.value);
        updateBackgroundColor();
    });

    hexagonStrokeHexInput.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            hexagonStrokeColor = this.value;
            hexagonStrokeColorPicker.value = this.value;
            updateBackgroundColor();
        }
    });

    hexagonStrokeWidthSlider.addEventListener('input', function() {
        hexagonStrokeWidth = parseInt(this.value);
        hexagonStrokeWidthValue.textContent = hexagonStrokeWidth;
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

    // Line type and symbol type selection using helper
    setupButtonGroup(lineTypeButtons, type => {
        currentLineType = type;
        console.log('Line type selected:', type);
    });
    
    setupButtonGroup(symbolTypeButtons, type => {
        currentSymbolType = type;
        console.log('Symbol type selected:', type);
    });

    // Line color picker
    lineColorPicker.addEventListener('input', function() {
        currentLineColor = this.value;
        syncColorInputs(lineColorPicker, lineHexInput, this.value);
    });

    // Line hex input
    lineHexInput.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            currentLineColor = this.value;
            lineColorPicker.value = this.value;
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
        syncColorInputs(borderColorPicker, borderHexInput, this.value);
        updateHexBorderColors();
    });

    // Border hex input
    borderHexInput.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
            hexBorderColor = this.value;
            borderColorPicker.value = this.value;
            updateHexBorderColors();
        }
    });

    // Clear board
    clearButton.addEventListener('click', function() {
        hexData.clear();
        hexSymbolData.clear();
        lineData.clear();
        generateHexBoard();
    });

    // Export board
    exportButton.addEventListener('click', exportHexBoard);

    // Update background controls visibility
    function updateBackgroundControls() {
        if (backgroundType === 'solid') {
            solidBgControls.style.display = 'block';
            hexagonBgControls.style.display = 'none';
        } else if (backgroundType === 'hexagon') {
            solidBgControls.style.display = 'none';
            hexagonBgControls.style.display = 'block';
        } else { // none
            solidBgControls.style.display = 'none';
            hexagonBgControls.style.display = 'none';
        }
    }

    // Update background color and rendering
    function updateBackgroundColor() {
        if (backgroundType === 'none') {
            hexBoard.style.backgroundColor = 'transparent';
        } else if (backgroundType === 'solid') {
            hexBoard.style.backgroundColor = backgroundColor;
        } else if (backgroundType === 'hexagon') {
            hexBoard.style.backgroundColor = 'transparent';
            renderHexagonBackground();
        }
    }

    // Render hexagon background
    function renderHexagonBackground() {
        // Remove existing background elements
        const existingBg = hexBoard.querySelector('#background-hexagon');
        const existingStroke = hexBoard.querySelector('#background-hexagon-stroke');
        if (existingBg) {
            existingBg.remove();
        }
        if (existingStroke) {
            existingStroke.remove();
        }

        if (backgroundType !== 'hexagon') return;

        // Calculate the outer hexagon bounds with 2px gap
        const coords = generateHexCoordinates(hexRadius);
        const hexSize = 20;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            const hexWidth = hexSize * Math.sqrt(3);
            const hexHeight = hexSize * 2;
            minX = Math.min(minX, pixel.x - hexWidth/2);
            maxX = Math.max(maxX, pixel.x + hexWidth/2);
            minY = Math.min(minY, pixel.y - hexHeight/2);
            maxY = Math.max(maxY, pixel.y + hexHeight/2);
        });

        // Add 4px gap around the hex grid to avoid overlaps
        const gap = 4;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Calculate distance from center to furthest hex corner
        let maxDistanceFromCenter = 0;
        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            // Check all 6 corners of each hex
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const cornerX = pixel.x + hexSize * Math.cos(angle);
                const cornerY = pixel.y + hexSize * Math.sin(angle);
                const distanceFromCenter = Math.sqrt(
                    Math.pow(cornerX - centerX, 2) + Math.pow(cornerY - centerY, 2)
                );
                maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distanceFromCenter);
            }
        });

        // Add 2px beyond the furthest hex corner
        const hexBgSize = maxDistanceFromCenter + gap;

        // Create actual hexagon shape with rounded corners
        const bgHexPath = generateRoundedHexPath(centerX, centerY, hexBgSize, 8); // 8px corner radius

        // Create background fill (behind hexes)
        const bgHex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bgHex.setAttribute('id', 'background-hexagon');
        bgHex.setAttribute('d', bgHexPath);
        bgHex.setAttribute('fill', hexagonBgColor);
        bgHex.setAttribute('stroke', 'none');
        bgHex.style.pointerEvents = 'none';

        // Create stroke outline (on top of hexes)
        const strokeHex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        strokeHex.setAttribute('id', 'background-hexagon-stroke');
        strokeHex.setAttribute('d', bgHexPath);
        strokeHex.setAttribute('fill', 'none');
        strokeHex.setAttribute('stroke', hexagonStrokeColor);
        strokeHex.setAttribute('stroke-width', hexagonStrokeWidth);
        strokeHex.style.pointerEvents = 'none';

        // Insert background at the beginning (behind hexes)
        hexBoard.insertBefore(bgHex, hexBoard.firstChild);
        // Insert stroke at the end (on top of hexes)
        hexBoard.appendChild(strokeHex);
    }

    // Generate rounded hexagon path
    function generateRoundedHexPath(centerX, centerY, size, cornerRadius) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i; // No rotation - pointy-top to match hex grid
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            points.push({ x, y });
        }

        // Create path with rounded corners
        let path = '';
        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const next = points[(i + 1) % points.length];
            const prev = points[(i - 1 + points.length) % points.length];

            // Calculate direction vectors
            const toPrev = { x: prev.x - current.x, y: prev.y - current.y };
            const toNext = { x: next.x - current.x, y: next.y - current.y };
            
            // Normalize vectors
            const lenPrev = Math.sqrt(toPrev.x * toPrev.x + toPrev.y * toPrev.y);
            const lenNext = Math.sqrt(toNext.x * toNext.x + toNext.y * toNext.y);
            toPrev.x /= lenPrev; toPrev.y /= lenPrev;
            toNext.x /= lenNext; toNext.y /= lenNext;

            // Calculate control points for rounded corner
            const controlPrev = { 
                x: current.x + toPrev.x * cornerRadius, 
                y: current.y + toPrev.y * cornerRadius 
            };
            const controlNext = { 
                x: current.x + toNext.x * cornerRadius, 
                y: current.y + toNext.y * cornerRadius 
            };

            if (i === 0) {
                path += `M ${controlNext.x} ${controlNext.y}`;
            } else {
                path += ` L ${controlPrev.x} ${controlPrev.y}`;
                path += ` Q ${current.x} ${current.y} ${controlNext.x} ${controlNext.y}`;
            }
        }
        
        // Close the path with final curve
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const toFirst = { x: firstPoint.x - lastPoint.x, y: firstPoint.y - lastPoint.y };
        const lenFirst = Math.sqrt(toFirst.x * toFirst.x + toFirst.y * toFirst.y);
        toFirst.x /= lenFirst; toFirst.y /= lenFirst;
        
        const controlLast = { 
            x: lastPoint.x + toFirst.x * cornerRadius, 
            y: lastPoint.y + toFirst.y * cornerRadius 
        };
        const controlFirstStart = { 
            x: firstPoint.x - toFirst.x * cornerRadius, 
            y: firstPoint.y - toFirst.y * cornerRadius 
        };
        
        path += ` L ${controlLast.x} ${controlLast.y}`;
        path += ` Q ${lastPoint.x} ${lastPoint.y} ${controlFirstStart.x} ${controlFirstStart.y}`;
        path += ' Z';

        return path;
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
        const padding = 6;
        
        // Calculate actual bounds of the hex grid
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            // Account for actual hex dimensions (flat-top hexagon)
            const hexWidth = hexSize * Math.sqrt(3);
            const hexHeight = hexSize * 2;
            minX = Math.min(minX, pixel.x - hexWidth/2);
            maxX = Math.max(maxX, pixel.x + hexWidth/2);
            minY = Math.min(minY, pixel.y - hexHeight/2);
            maxY = Math.max(maxY, pixel.y + hexHeight/2);
        });
        
        const gridWidth = maxX - minX;
        const gridHeight = maxY - minY;
        
        // Calculate tight bounds with padding
        const viewBoxWidth = gridWidth + (padding * 2);
        const viewBoxHeight = gridHeight + (padding * 2);
        
        // Center the grid in the viewBox
        const offsetX = -minX + padding;
        const offsetY = -minY + padding;

        // Update SVG viewBox and background
        hexBoard.setAttribute('viewBox', `${-offsetX} ${-offsetY} ${viewBoxWidth} ${viewBoxHeight}`);
        updateBackgroundColor();
        
        
        // Clear existing hexagons
        hexBoard.innerHTML = '';

        // Render background first if needed
        if (backgroundType === 'hexagon') {
            renderHexagonBackground();
        }

        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            const hexPath = generateHexPath(pixel.x, pixel.y, hexSize);
            
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
            
            // Restore symbols if they exist
            const savedSymbol = hexSymbolData.get(coordKey);
            if (savedSymbol) {
                setTimeout(() => {
                    addSymbolToHex(coordKey, pixel, savedSymbol.type, savedSymbol.color, hexSize);
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
            
            // Add symbol function
            function addSymbol(coord, pixel) {
                const symbolId = `symbol-${coord.replace(/,/g, '_').replace(/-/g, 'n')}`;
                const existingSymbol = hexBoard.querySelector(`#${symbolId}`);
                
                if (existingSymbol) {
                    existingSymbol.remove();
                }
                
                if (currentColor !== 'transparent') {
                    addSymbolToHex(coord, pixel, currentSymbolType, currentColor, hexSize);
                    hexSymbolData.set(coord, { type: currentSymbolType, color: currentColor });
                } else {
                    hexSymbolData.delete(coord);
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
            
            // Right-click event for symbols (only in colors mode)
            hexElement.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (currentMode === 'colors') {
                    addSymbol(coordKey, pixel);
                }
            });

            hexBoard.appendChild(hexElement);
        });
        
        // Restore lines if they exist
        lineData.forEach((lineInfo, lineId) => {
            drawStoredLine(lineInfo);
        });
    }

    // Add symbol to hex cell using shared renderSymbol from hex-common.js
    function addSymbolToHex(coordKey, pixel, symbolType, color, hexSize) {
        const symbolElement = renderSymbol(coordKey, pixel, symbolType, color, hexSize);
        if (symbolElement) {
            hexBoard.appendChild(symbolElement);
        }
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

    function removeLine(lineId) {
        // Remove from DOM
        const lineElement = hexBoard.querySelector(`#${lineId}`);
        if (lineElement) {
            lineElement.remove();
        }
        
        // Remove from lineData storage
        lineData.delete(lineId);
        
        // Also check for reverse direction line ID and remove if exists
        const lineInfo = Array.from(lineData.entries()).find(([id, info]) => {
            const reverseId = sanitizeLineId(info.endCoord, info.startCoord);
            return reverseId === lineId;
        });
        
        if (lineInfo) {
            lineData.delete(lineInfo[0]);
        }
        
        console.log('Line removed:', lineId);
    }

    function highlightLine(lineGroup, isHighlighted) {
        // Find all visual elements (lines and arrows) in the group, excluding hit areas
        const visualElements = lineGroup.querySelectorAll('line[stroke]:not([stroke="transparent"]), polygon');
        
        visualElements.forEach(element => {
            if (isHighlighted) {
                // Store original stroke for restoration
                if (!element.dataset.originalStroke) {
                    element.dataset.originalStroke = element.getAttribute('stroke');
                    element.dataset.originalStrokeWidth = element.getAttribute('stroke-width') || '';
                }
                
                // Apply highlight effect
                element.setAttribute('stroke', '#ff6b6b'); // Bright red highlight
                const currentWidth = parseInt(element.getAttribute('stroke-width') || '2');
                element.setAttribute('stroke-width', Math.max(currentWidth + 1, 3)); // Slightly thicker
                element.style.filter = 'drop-shadow(0 0 3px rgba(255, 107, 107, 0.6))'; // Glow effect
            } else {
                // Restore original appearance
                if (element.dataset.originalStroke) {
                    element.setAttribute('stroke', element.dataset.originalStroke);
                    if (element.dataset.originalStrokeWidth) {
                        element.setAttribute('stroke-width', element.dataset.originalStrokeWidth);
                    }
                    element.style.filter = '';
                }
            }
        });
    }

    function createLineElement(startPixel, endPixel, color, width, type, isPreview) {
        // Use the same coordinate system as the hex board (no offset needed)
        const x1 = startPixel.x;
        const y1 = startPixel.y;
        const x2 = endPixel.x;
        const y2 = endPixel.y;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // Enable pointer events for lines (but not for preview lines)
        if (isPreview) {
            group.style.pointerEvents = 'none';
        } else {
            group.style.pointerEvents = 'stroke';
            group.style.cursor = 'pointer';
            
            // Add right-click handler to remove the line
            group.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeLine(group.id);
            });
            
            // Add hover highlighting
            group.addEventListener('mouseenter', function(e) {
                highlightLine(group, true);
            });
            
            group.addEventListener('mouseleave', function(e) {
                highlightLine(group, false);
            });
        }
        
        if (type === 'solid' || type === 'dotted') {
            // Create invisible hit area for easier clicking
            if (!isPreview) {
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                hitArea.setAttribute('x1', x1);
                hitArea.setAttribute('y1', y1);
                hitArea.setAttribute('x2', x2);
                hitArea.setAttribute('y2', y2);
                hitArea.setAttribute('stroke', 'transparent');
                hitArea.setAttribute('stroke-width', Math.max(width + 4, 8)); // Add 4px grace area, minimum 8px
                hitArea.style.pointerEvents = 'stroke';
                group.appendChild(hitArea);
            }
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', width);
            line.style.pointerEvents = 'none'; // Visual line doesn't handle events
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
            
            // Create invisible hit area for easier clicking (full line length)
            if (!isPreview) {
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                hitArea.setAttribute('x1', x1);
                hitArea.setAttribute('y1', y1);
                hitArea.setAttribute('x2', x2);
                hitArea.setAttribute('y2', y2);
                hitArea.setAttribute('stroke', 'transparent');
                hitArea.setAttribute('stroke-width', Math.max(width + 4, 8)); // Add 4px grace area, minimum 8px
                hitArea.style.pointerEvents = 'stroke';
                group.appendChild(hitArea);
            }
            
            if (type === 'arrow-two') {
                // Start arrow (pointing backwards)
                const startArrowX = x1 + unitX * arrowSize;
                const startArrowY = y1 + unitY * arrowSize;
                const startArrow = createArrowHead(startArrowX, startArrowY, x1, y1, arrowSize, color, false);
                startArrow.style.pointerEvents = 'none'; // Arrow heads don't handle events
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
            line.style.pointerEvents = 'none'; // Visual line doesn't handle events
            group.appendChild(line);
            
            // End arrow
            const endArrow = createArrowHead(lineEndX, lineEndY, x2, y2, arrowSize, color, false);
            endArrow.style.pointerEvents = 'none'; // Arrow heads don't handle events
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

    // Function to increment filename number
    function incrementFilename(filename) {
        // Match numbers at the end of the filename (before extension if any)
        const match = filename.match(/^(.*?)(\d+)(\.[^.]*)?$/);
        
        if (match) {
            const prefix = match[1];
            const number = parseInt(match[2]);
            const extension = match[3] || '';
            return `${prefix}${number + 1}${extension}`;
        } else {
            // If no number found, append -1
            const dotIndex = filename.lastIndexOf('.');
            if (dotIndex > 0) {
                return filename.substring(0, dotIndex) + '-1' + filename.substring(dotIndex);
            } else {
                return filename + '-1';
            }
        }
    }

    // Export hex board as PNG
    function exportHexBoard() {
        const svgData = new XMLSerializer().serializeToString(hexBoard);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Get current filename from input
        let currentFilename = exportFilenameInput.value.trim() || 'hex-board-1';
        
        // Ensure .png extension
        if (!currentFilename.toLowerCase().endsWith('.png')) {
            currentFilename += '.png';
        }
        
        // Optimized export settings for card game corner images
        const scaleFactor = 0.8; // Further reduced for very small card corner images
        const svgRect = hexBoard.getBoundingClientRect();
        const exportWidth = Math.min(200, svgRect.width * scaleFactor); // Much smaller for card corners
        const exportHeight = Math.min(200, svgRect.height * scaleFactor);
        
        // Create high-resolution SVG with explicit dimensions
        const svgElement = hexBoard.cloneNode(true);
        svgElement.setAttribute('width', exportWidth);
        svgElement.setAttribute('height', exportHeight);
        
        // Set background based on current background type
        if (backgroundType === 'none') {
            svgElement.style.backgroundColor = 'transparent';
        } else if (backgroundType === 'solid') {
            svgElement.style.backgroundColor = backgroundColor;
        } else if (backgroundType === 'hexagon') {
            svgElement.style.backgroundColor = 'transparent';
        }
        
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
            
            // Fill background based on background type
            if (backgroundType === 'solid') {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (backgroundType === 'hexagon') {
                // For hexagon background, fill with transparent first
                // The hexagon background is already in the SVG
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            // For 'none' type, leave transparent
            
            // Draw the SVG at high resolution
            ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
            
            // Export as compressed PNG
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = currentFilename;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
                
                // Increment filename for next export
                const nextFilename = incrementFilename(currentFilename.replace('.png', ''));
                exportFilenameInput.value = nextFilename;
            }, 'image/png', 0.6); // Further reduced quality for card game corner images
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // Initialize the board
    generateHexBoard();
    
    // Initialize UI state to match defaults
    updateBackgroundControls();
    updateBackgroundColor();
}

// Make function globally available
window.initializeHexBoardEditor = initializeHexBoardEditor;
