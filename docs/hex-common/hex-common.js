// Hex Common Utilities - Shared functionality for hex-based tools

// ===== Constants =====
const HEX_CONSTANTS = {
    DEFAULT_HEX_SIZE: 20,
    DEFAULT_PADDING: 6,
    HEX_COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/
};

// ===== Shared Color Palettes =====
const COLOR_PALETTES = {
    basic: [
        { color: '#ff0000', title: 'Red' },
        { color: '#00ff00', title: 'Green' },
        { color: '#0000ff', title: 'Blue' },
        { color: '#ffff00', title: 'Yellow' },
        { color: '#ff00ff', title: 'Magenta' },
        { color: '#00ffff', title: 'Cyan' },
        { color: '#000000', title: 'Black' },
        { color: '#ffffff', title: 'White', border: true },
        { color: 'transparent', title: 'Transparent', special: 'transparent' }
    ],
    author: [
        { color: '#323232', title: 'Dark Grey' },
        { color: '#787878', title: 'Grey' },
        { color: '#ffff70', title: 'Yellow' },
        { color: '#ff6600', title: 'Orange' },
        { color: '#ff3333', title: 'Red' },
        { color: '#ff7ad5', title: 'Pink' },
        { color: '#009900', title: 'Green' },
        { color: '#70bfff', title: 'Blue' }
    ]
};

// ===== Hex Coordinate & Geometry Functions =====

// Generate hexagonal grid coordinates using cube coordinates
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

// Generate hexagon SVG path (flat-top orientation)
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

// ===== SVG Helper Functions =====

// Create SVG element with attributes
function createSVG(type, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}

// ===== UI Helper Functions =====

// Sync color picker with hex input field
function syncColorInputs(colorPicker, hexInput, value) {
    colorPicker.value = value;
    hexInput.value = value;
}

// Setup button group selection behavior (for tabs, line types, symbol types, etc.)
function setupButtonGroup(buttons, callback) {
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Get the first data attribute value
            const dataKey = Object.keys(this.dataset)[0];
            callback(this.dataset[dataKey]);
        });
    });
}

// Generate color palette HTML from configuration
function generateColorPalette(paletteType, additionalColors = []) {
    const colors = COLOR_PALETTES[paletteType] || [];
    const allColors = [...colors, ...additionalColors];
    
    return allColors.map(colorConfig => {
        const { color, title, border, special } = colorConfig;
        
        if (special === 'transparent') {
            return `<div class="color-option transparent-option" data-color="transparent" title="${title}">
                        <div class="transparent-pattern"></div>
                    </div>`;
        } else if (special === 'delete') {
            return `<div class="color-option delete-option" data-color="delete" title="${title}" 
                        style="display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #ff0000;">
                        ×
                    </div>`;
        } else {
            const borderStyle = border ? ' border: 1px solid #ccc;' : '';
            return `<div class="color-option" data-color="${color}" style="background-color: ${color};${borderStyle}" title="${title}"></div>`;
        }
    }).join('\n');
}

// Initialize color palettes in a container
function initializeColorPalettes(containerSelector, palettes) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    Object.entries(palettes).forEach(([label, config]) => {
        const paletteHtml = generateColorPalette(config.type, config.additional || []);
        const paletteContainer = container.querySelector(`[data-palette="${label}"]`);
        if (paletteContainer) {
            paletteContainer.innerHTML = paletteHtml;
        }
    });
}

// Setup tab switching behavior
function setupTabSwitching(tabs, contents, onSwitch) {
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.controlTab || this.dataset.tab;
            
            // Update tab buttons
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update tab content
            contents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(`${targetTab}-controls`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Callback with new mode
            if (onSwitch) onSwitch(targetTab);
        });
    });
}

// ===== Hex Board Utilities =====

// Calculate viewBox bounds for hex grid
function calculateHexGridBounds(coords, hexSize, padding = 6) {
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
    
    const gridWidth = maxX - minX;
    const gridHeight = maxY - minY;
    const viewBoxWidth = gridWidth + (padding * 2);
    const viewBoxHeight = gridHeight + (padding * 2);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;
    
    return { minX, maxX, minY, maxY, viewBoxWidth, viewBoxHeight, offsetX, offsetY };
}

// Sanitize coordinate string for use as CSS ID (replace - with n, , with _)
function sanitizeCoordId(coordKey) {
    return coordKey.replace(/-/g, 'n').replace(/,/g, '_');
}

// ===== Symbol Rendering =====

// Render symbols (circle, crosshair, person) on hex cells
function renderSymbol(coordKey, pixel, symbolType, color, hexSize) {
    const symbolId = `symbol-${sanitizeCoordId(coordKey)}`;
    const size = hexSize * 0.48; // Symbol size relative to hex
    let symbolElement;
    
    const strokeWidth = size * 0.25;
    
    switch(symbolType) {
        case 'circle':
            symbolElement = createSVG('circle', {
                cx: pixel.x, cy: pixel.y, r: size, fill: color
            });
            break;
            
        case 'crosshair':
            symbolElement = createSVG('g');
            symbolElement.appendChild(createSVG('circle', {
                cx: pixel.x, cy: pixel.y, r: size * 0.85,
                fill: 'none', stroke: color, 'stroke-width': strokeWidth
            }));
            symbolElement.appendChild(createSVG('line', {
                x1: pixel.x - size * 1.2, y1: pixel.y,
                x2: pixel.x + size * 1.2, y2: pixel.y,
                stroke: color, 'stroke-width': strokeWidth
            }));
            symbolElement.appendChild(createSVG('line', {
                x1: pixel.x, y1: pixel.y - size * 1.2,
                x2: pixel.x, y2: pixel.y + size * 1.2,
                stroke: color, 'stroke-width': strokeWidth
            }));
            symbolElement.appendChild(createSVG('circle', {
                cx: pixel.x, cy: pixel.y, r: size * 0.15, fill: color
            }));
            break;
            
        case 'person':
            symbolElement = createSVG('g');
            const personSize = size * 1.2; // Person symbol is 20% larger
            const yOffset = personSize * 0.15; // Shift up to reduce top space
            symbolElement.appendChild(createSVG('circle', {
                cx: pixel.x, cy: pixel.y - personSize * 0.4 - yOffset, r: personSize * 0.4, fill: color
            }));
            const bodyPath = `M ${pixel.x - personSize * 0.7} ${pixel.y + personSize - yOffset}
                L ${pixel.x - personSize * 0.5} ${pixel.y + personSize * 0.2 - yOffset}
                Q ${pixel.x - personSize * 0.4} ${pixel.y - yOffset} ${pixel.x} ${pixel.y - yOffset}
                Q ${pixel.x + personSize * 0.4} ${pixel.y - yOffset} ${pixel.x + personSize * 0.5} ${pixel.y + personSize * 0.2 - yOffset}
                L ${pixel.x + personSize * 0.7} ${pixel.y + personSize - yOffset} Z`;
            symbolElement.appendChild(createSVG('path', { d: bodyPath, fill: color }));
            break;
            
        default:
            console.warn('Unknown symbol type:', symbolType);
            return null;
    }
    
    symbolElement.setAttribute('id', symbolId);
    symbolElement.style.pointerEvents = 'none'; // Don't interfere with hex clicks
    return symbolElement;
}

// ===== Export for use in other files =====
// These functions are now globally available
