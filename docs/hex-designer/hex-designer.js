// Hex Designer Implementation
function initializeHexDesigner() {
    let currentColor = '#ffffff';
    let hexRadius = 3;
    let hexData = new Map(); // Store hex colors by coordinates
    let activeHexes = new Set(); // Track which hexes are activated
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

    const radiusSlider = document.getElementById('hex-designer-radius');
    const radiusValue = document.getElementById('hex-designer-radius-value');
    const colorOptions = document.querySelectorAll('#hex-designer-colors-controls .color-option');
    const customColorPicker = document.getElementById('hex-designer-custom-color');
    const hexInput = document.getElementById('hex-designer-hex-input');
    const borderColorPicker = document.getElementById('hex-designer-border-color');
    const borderHexInput = document.getElementById('hex-designer-border-hex-input');
    const clearButton = document.getElementById('hex-designer-clear-board');
    const exportButton = document.getElementById('hex-designer-export-board');
    const exportFilenameInput = document.getElementById('hex-designer-export-filename');
    const hexBoard = document.getElementById('hex-designer-board');
    
    // Control tab elements
    const controlTabs = document.querySelectorAll('.hex-designer-container .control-tab');
    const controlTabContents = document.querySelectorAll('#hex-designer-colors-controls, #hex-designer-lines-controls');
    
    // Line drawing elements
    const lineTypeButtons = document.querySelectorAll('#hex-designer-lines-controls .line-type-btn');
    const lineColorPicker = document.getElementById('hex-designer-line-color');
    const lineHexInput = document.getElementById('hex-designer-line-hex-input');
    const lineWidthSlider = document.getElementById('hex-designer-line-width');
    const lineWidthValue = document.getElementById('hex-designer-line-width-value');
    const symbolTypeButtons = document.querySelectorAll('#hex-designer-colors-controls .symbol-type-btn');

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
            document.getElementById(`hex-designer-${targetTab}-controls`).classList.add('active');
            
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
        activeHexes.clear();
        hexSymbolData.clear();
        lineData.clear();
        generateHexBoard();
    });

    // Export board
    exportButton.addEventListener('click', exportHexBoard);


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

        // Update SVG viewBox
        hexBoard.setAttribute('viewBox', `${-offsetX} ${-offsetY} ${viewBoxWidth} ${viewBoxHeight}`);
        
        
        // Clear existing hexagons
        hexBoard.innerHTML = '';

        coords.forEach(coord => {
            const pixel = hexToPixel(coord.q, coord.r, hexSize);
            const hexPath = generateHexPath(pixel.x, pixel.y, hexSize);
            
            const hexElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hexElement.setAttribute('d', hexPath);
            hexElement.setAttribute('class', 'hex-cell');
            hexElement.setAttribute('stroke', hexBorderColor);
            hexElement.style.stroke = hexBorderColor;
            
            const coordKey = `${coord.q},${coord.r}`;
            const isActive = activeHexes.has(coordKey);
            const savedColor = hexData.get(coordKey) || 'transparent';
            
            if (isActive) {
                hexElement.classList.add('active');
                hexElement.setAttribute('stroke', hexBorderColor);
                hexElement.style.stroke = hexBorderColor;
                hexElement.setAttribute('fill', savedColor === 'transparent' ? 'none' : savedColor);
                hexElement.style.fill = savedColor === 'transparent' ? 'none' : savedColor;
            } else {
                hexElement.classList.add('inactive');
                hexElement.setAttribute('fill', 'transparent');
                hexElement.style.fill = 'transparent';
                hexElement.setAttribute('stroke', 'none');
            }
            
            // Store coordinate key on the element for debugging
            hexElement.dataset.coord = coordKey;
            
            // Restore symbols if they exist
            const savedSymbol = hexSymbolData.get(coordKey);
            if (savedSymbol && isActive) {
                setTimeout(() => {
                    addSymbolToHex(coordKey, pixel, savedSymbol.type, savedSymbol.color, hexSize);
                }, 0);
            }
            
            // Activate hex function
            function activateHex(element, coord) {
                // Handle delete color - deactivate the hex
                if (currentColor === 'delete') {
                    deactivateHex(element, coord);
                    return;
                }
                
                if (!activeHexes.has(coord)) {
                    activeHexes.add(coord);
                    element.classList.remove('inactive');
                    element.classList.add('active');
                    element.setAttribute('stroke', hexBorderColor);
                    element.style.stroke = hexBorderColor;
                }
                element.style.fill = currentColor === 'transparent' ? 'none' : currentColor;
                element.setAttribute('fill', currentColor === 'transparent' ? 'none' : currentColor);
                hexData.set(coord, currentColor);
            }
            
            // Deactivate hex function
            function deactivateHex(element, coord) {
                // Remove from active hexes
                activeHexes.delete(coord);
                hexData.delete(coord);
                
                // Remove visual state
                element.classList.remove('active');
                element.classList.add('inactive');
                element.setAttribute('fill', 'transparent');
                element.style.fill = 'transparent';
                element.setAttribute('stroke', 'none');
                
                // Remove any symbols on this hex
                const symbolId = `symbol-${coord.replace(/,/g, '_').replace(/-/g, 'n')}`;
                const existingSymbol = hexBoard.querySelector(`#${symbolId}`);
                if (existingSymbol) {
                    existingSymbol.remove();
                }
                hexSymbolData.delete(coord);
                
                // Remove any lines connected to this hex
                const linesToRemove = [];
                lineData.forEach((lineInfo, lineId) => {
                    if (lineInfo.startCoord === coord || lineInfo.endCoord === coord) {
                        linesToRemove.push(lineId);
                    }
                });
                linesToRemove.forEach(lineId => removeLine(lineId));
            }
            
            // Add symbol function
            function addSymbol(coord, pixel) {
                if (!activeHexes.has(coord)) activateHex(hexElement, coord);
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
                        activateHex(this, coordKey);
                    } else if (currentMode === 'lines') {
                        // Auto-activate inactive hexes as transparent for line drawing
                        if (!activeHexes.has(coordKey)) {
                            activeHexes.add(coordKey);
                            this.classList.remove('inactive');
                            this.classList.add('active');
                            this.setAttribute('stroke', hexBorderColor);
                            this.style.stroke = hexBorderColor;
                            this.style.fill = 'none';
                            this.setAttribute('fill', 'none');
                            hexData.set(coordKey, 'transparent');
                        }
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
                        activateHex(this, coordKey);
                    } else if (currentMode === 'lines') {
                        // Auto-activate inactive hexes as transparent for line drawing
                        if (!activeHexes.has(coordKey)) {
                            activeHexes.add(coordKey);
                            this.classList.remove('inactive');
                            this.classList.add('active');
                            this.setAttribute('stroke', hexBorderColor);
                            this.style.stroke = hexBorderColor;
                            this.style.fill = 'none';
                            this.setAttribute('fill', 'none');
                            hexData.set(coordKey, 'transparent');
                        }
                        isDrawingLine = true;
                        lineStartHex = { coord: coordKey, pixel: pixel };
                    }
                }
            });
            
            // Mouse enter - continue drag or show line preview
            hexElement.addEventListener('mouseenter', function(e) {
                if (currentMode === 'colors' && isDragging && dragStarted) {
                    activateHex(this, coordKey);
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
                        // Auto-activate inactive hexes as transparent for line drawing
                        if (!activeHexes.has(coordKey)) {
                            activeHexes.add(coordKey);
                            this.classList.remove('inactive');
                            this.classList.add('active');
                            this.setAttribute('stroke', hexBorderColor);
                            this.style.stroke = hexBorderColor;
                            this.style.fill = 'none';
                            this.setAttribute('fill', 'none');
                            hexData.set(coordKey, 'transparent');
                        }
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
        
        const group = createSVG('g');
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
                const hitArea = createSVG('line', {
                    x1, y1, x2, y2,
                    stroke: 'transparent',
                    'stroke-width': Math.max(width + 4, 8)
                });
                hitArea.style.pointerEvents = 'stroke';
                group.appendChild(hitArea);
            }
            
            const lineAttrs = { x1, y1, x2, y2, stroke: color, 'stroke-width': width };
            if (type === 'dotted') {
                lineAttrs['stroke-dasharray'] = `${width * 2},${width * 2}`;
            }
            const line = createSVG('line', lineAttrs);
            line.style.pointerEvents = 'none';
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
                const hitArea = createSVG('line', {
                    x1, y1, x2, y2,
                    stroke: 'transparent',
                    'stroke-width': Math.max(width + 4, 8)
                });
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
            
            const line = createSVG('line', {
                x1: lineStartX, y1: lineStartY,
                x2: lineEndX, y2: lineEndY,
                stroke: color, 'stroke-width': width
            });
            line.style.pointerEvents = 'none';
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

    // Generate rounded hexagon path for border
    function generateRoundedHexPath(centerX, centerY, size, cornerRadius) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i; // Pointy-top to match hex grid
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


    // Export hex board as PNG - only active hexes with dynamic border
    function exportHexBoard() {
        if (activeHexes.size === 0) {
            alert('No hexes selected! Please activate some hexes before exporting.');
            return;
        }
        
        const hexSize = 20;
        const gap = 4;
        
        // First, calculate circle center and radius (centroid of all active hexes)
        console.log('Calculating centroid for', activeHexes.size, 'hexes');
        let centerX = 0, centerY = 0;
        const hexPositions = [];
        activeHexes.forEach(coordKey => {
            const [q, r] = coordKey.split(',').map(Number);
            const pixel = hexToPixel(q, r, hexSize);
            hexPositions.push({ q, r, x: pixel.x, y: pixel.y });
            centerX += pixel.x;
            centerY += pixel.y;
        });
        centerX /= activeHexes.size;
        centerY /= activeHexes.size;
        console.log('Hex positions:', hexPositions);
        console.log('Calculated centroid:', centerX.toFixed(2), centerY.toFixed(2));
        
        // Calculate radius needed to encompass all hexes plus clearance
        let maxDist = 0;
        activeHexes.forEach(coordKey => {
            const [q, r] = coordKey.split(',').map(Number);
            const pixel = hexToPixel(q, r, hexSize);
            const dist = Math.hypot(pixel.x - centerX, pixel.y - centerY);
            maxDist = Math.max(maxDist, dist);
        });
        
        // Add hex size plus extra clearance
        const radius = maxDist + hexSize + gap;
        
        // Now calculate bounds based on the circle
        const minX = centerX - radius;
        const maxX = centerX + radius;
        const minY = centerY - radius;
        const maxY = centerY + radius;
        
        const exportWidth = maxX - minX;
        const exportHeight = maxY - minY;
        const offsetX = -minX;
        const offsetY = -minY;
        
        // Create export SVG
        const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSvg.setAttribute('width', exportWidth);
        exportSvg.setAttribute('height', exportHeight);
        exportSvg.setAttribute('viewBox', `${-offsetX} ${-offsetY} ${exportWidth} ${exportHeight}`);
        
        // Add black circular background
        
        const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleElement.setAttribute('cx', centerX);
        circleElement.setAttribute('cy', centerY);
        circleElement.setAttribute('r', radius);
        circleElement.setAttribute('fill', '#000000');
        circleElement.setAttribute('stroke', 'none');
        exportSvg.appendChild(circleElement);
        
        // Draw active hexes
        activeHexes.forEach(coordKey => {
            const [q, r] = coordKey.split(',').map(Number);
            const pixel = hexToPixel(q, r, hexSize);
            const hexPath = generateHexPath(pixel.x, pixel.y, hexSize);
            const hexElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hexElement.setAttribute('d', hexPath);
            hexElement.setAttribute('stroke', hexBorderColor);
            hexElement.setAttribute('stroke-width', '1');
            const color = hexData.get(coordKey) || 'transparent';
            hexElement.setAttribute('fill', color === 'transparent' ? 'none' : color);
            exportSvg.appendChild(hexElement);
            
            // Add symbols if present
            const symbol = hexSymbolData.get(coordKey);
            if (symbol) {
                const symbolElements = hexBoard.querySelector(`#symbol-${coordKey.replace(/,/g, '_').replace(/-/g, 'n')}`);
                if (symbolElements) {
                    const clonedSymbol = symbolElements.cloneNode(true);
                    exportSvg.appendChild(clonedSymbol);
                }
            }
        });
        
        // Add lines that connect active hexes
        lineData.forEach((lineInfo) => {
            if (activeHexes.has(lineInfo.startCoord) && activeHexes.has(lineInfo.endCoord)) {
                const [startQ, startR] = lineInfo.startCoord.split(',').map(Number);
                const [endQ, endR] = lineInfo.endCoord.split(',').map(Number);
                const startPixel = hexToPixel(startQ, startR, hexSize);
                const endPixel = hexToPixel(endQ, endR, hexSize);
                const lineElement = createLineElement(startPixel, endPixel, lineInfo.color, lineInfo.width, lineInfo.type, true);
                exportSvg.appendChild(lineElement);
            }
        });
        
        
        // Convert to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = exportWidth;
        canvas.height = exportHeight;
        
        const svgData = new XMLSerializer().serializeToString(exportSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        
        img.onload = function() {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0);
            
            let currentFilename = exportFilenameInput.value.trim() || 'hex-design-1';
            if (!currentFilename.toLowerCase().endsWith('.png')) {
                currentFilename += '.png';
            }
            
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = currentFilename;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
                const nextFilename = incrementFilename(currentFilename.replace('.png', ''));
                exportFilenameInput.value = nextFilename;
            }, 'image/png', 0.9);
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // Initialize the board
    generateHexBoard();
}

// Make function globally available
window.initializeHexDesigner = initializeHexDesigner;
