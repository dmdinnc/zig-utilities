# Core Website Framework

A flexible website framework designed to host multiple utilities and tools with live-reload development server.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher) - Download from [https://nodejs.org](https://nodejs.org)

### Installation
1. Clone or download this repository
2. Open terminal/command prompt in the project directory
3. Navigate to the scripts folder and install dependencies:
   ```bash
   cd scripts
   npm install
   ```

### Development Server
Start the live-reload development server from the root directory:
```bash
npm run dev
# or
npm start
# or run directly from scripts folder:
cd scripts && node dev-server.js
```

The server will:
- 🚀 Start on http://localhost:3000
- 👀 Watch for file changes in the `website/` directory
- 🔄 Automatically reload the browser when files change
- 🎨 Hot-reload CSS without full page refresh

### Build for Production
Create an optimized build from the root directory:
```bash
npm run build
# or run directly from scripts folder:
cd scripts && node build.js
```

### Command Line Options

#### Development Server
```bash
cd scripts
node dev-server.js --port 8080 --dir ../website
```
- `--port, -p`: Specify port (default: 3000)
- `--dir, -d`: Website directory (default: ../website)
- `--help, -h`: Show help

#### Build Tool
```bash
cd scripts
node build.js --source ../website --output ../dist --no-minify
```
- `--source, -s`: Source directory (default: ../website)
- `--output, -o`: Output directory (default: ../dist)
- `--no-minify`: Skip minification

## Features

### Live Development
- Live reload on file changes
- CSS hot reload (no page refresh)
- WebSocket-based communication
- File watching with chokidar
- Express.js static file serving

### Production Build
- Copy all source files to build directory
- Minify HTML, CSS, and JS files
- Clean build directory before building

### Website Framework
- Home page with feature showcase
- Utilities section for tools
- Settings with theme switching (light/dark mode)
- Responsive design
- Keyboard shortcuts (Alt + 1-3, Ctrl + T for theme toggle)
