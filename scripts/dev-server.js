const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

class LiveReloadServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.websiteDir = options.websiteDir || '../docs';
        this.watchPatterns = options.watchPatterns || ['**/*.html', '**/*.css', '**/*.js'];
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.clients = new Set();
        this.setupExpress();
        this.setupWebSocket();
        this.setupFileWatcher();
    }

    setupExpress() {
        // Serve static files from website directory
        this.app.use(express.static(this.websiteDir));
        
        // Inject live reload script into HTML files
        this.app.get('*.html', (req, res, next) => {
            const filePath = path.join(this.websiteDir, req.path);
            
            if (fs.existsSync(filePath)) {
                let html = fs.readFileSync(filePath, 'utf8');
                
                // Inject WebSocket client script before closing body tag
                const liveReloadScript = `
                <script>
                    (function() {
                        const ws = new WebSocket('ws://localhost:${this.port}');
                        ws.onmessage = function(event) {
                            const data = JSON.parse(event.data);
                            if (data.type === 'reload') {
                                console.log('🔄 File changed, reloading page...');
                                window.location.reload();
                            } else if (data.type === 'css-reload') {
                                console.log('🎨 CSS changed, reloading stylesheets...');
                                reloadCSS();
                            }
                        };
                        
                        ws.onopen = function() {
                            console.log('🔗 Live reload connected');
                        };
                        
                        ws.onclose = function() {
                            console.log('❌ Live reload disconnected');
                        };
                        
                        function reloadCSS() {
                            const links = document.querySelectorAll('link[rel="stylesheet"]');
                            links.forEach(link => {
                                const href = link.href;
                                const newHref = href.includes('?') 
                                    ? href.split('?')[0] + '?t=' + Date.now()
                                    : href + '?t=' + Date.now();
                                link.href = newHref;
                            });
                        }
                    })();
                </script>`;
                
                if (html.includes('</body>')) {
                    html = html.replace('</body>', liveReloadScript + '\n</body>');
                } else {
                    html += liveReloadScript;
                }
                
                res.setHeader('Content-Type', 'text/html');
                res.send(html);
            } else {
                next();
            }
        });
        
        // Default route for SPA
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(process.cwd(), this.websiteDir, 'index.html'));
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(`📱 Client connected (${this.clients.size} total)`);
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`📱 Client disconnected (${this.clients.size} total)`);
            });
        });
    }

    setupFileWatcher() {
        const watchPaths = this.watchPatterns.map(pattern => 
            path.join(this.websiteDir, pattern)
        );
        
        this.watcher = chokidar.watch(watchPaths, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', (filePath) => {
            const relativePath = path.relative(process.cwd(), filePath);
            const ext = path.extname(filePath);
            
            console.log(`📝 File changed: ${relativePath}`);
            
            // Determine reload type based on file extension
            let reloadType = 'reload';
            if (ext === '.css') {
                reloadType = 'css-reload';
            }
            
            // Notify all connected clients
            this.broadcast({
                type: reloadType,
                file: relativePath,
                timestamp: Date.now()
            });
        });

        this.watcher.on('add', (filePath) => {
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(`➕ File added: ${relativePath}`);
            this.broadcast({ type: 'reload', file: relativePath });
        });

        this.watcher.on('unlink', (filePath) => {
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(`➖ File removed: ${relativePath}`);
            this.broadcast({ type: 'reload', file: relativePath });
        });
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log('🚀 Development server started!');
                console.log(`📂 Serving files from: ${this.websiteDir}/`);
                console.log(`🌐 Local server: http://localhost:${this.port}`);
                console.log(`👀 Watching for changes in: ${this.watchPatterns.join(', ')}`);
                console.log('📱 Live reload enabled');
                console.log('\n💡 Press Ctrl+C to stop the server\n');
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            console.log('\n🛑 Shutting down development server...');
            
            if (this.watcher) {
                this.watcher.close();
            }
            
            this.clients.forEach(client => {
                client.close();
            });
            
            this.server.close(() => {
                console.log('✅ Server stopped successfully');
                resolve();
            });
        });
    }
}

// CLI functionality
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
            case '-p':
                options.port = parseInt(args[++i]);
                break;
            case '--dir':
            case '-d':
                options.websiteDir = args[++i];
                break;
            case '--help':
            case '-h':
                console.log(`
Core Website Framework - Development Server

Usage: node dev-server.js [options]

Options:
  -p, --port <number>    Port number (default: 3000)
  -d, --dir <path>       Website directory (default: docs)
  -h, --help             Show this help message

Features:
  ✨ Live reload on file changes
  🎨 CSS hot reload (no page refresh)
  📱 WebSocket-based communication
  🔍 File watching with chokidar
  🚀 Express.js static file serving
                `);
                process.exit(0);
        }
    }
    
    const server = new LiveReloadServer(options);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });
    
    // Start the server
    server.start().catch(console.error);
}

module.exports = LiveReloadServer;
