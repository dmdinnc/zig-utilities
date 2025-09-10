const fs = require('fs');
const path = require('path');

class WebsiteBuilder {
    constructor(options = {}) {
        this.sourceDir = options.sourceDir || '../website';
        this.buildDir = options.buildDir || '../dist';
        this.minify = options.minify !== false;
    }

    async build() {
        console.log('🏗️  Building website for production...');
        
        // Clean build directory
        await this.cleanBuildDir();
        
        // Copy and process files
        await this.copyFiles();
        
        // Minify if enabled
        if (this.minify) {
            await this.minifyFiles();
        }
        
        console.log('✅ Build completed successfully!');
        console.log(`📦 Output directory: ${this.buildDir}/`);
    }

    async cleanBuildDir() {
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.buildDir, { recursive: true });
        console.log('🧹 Cleaned build directory');
    }

    async copyFiles() {
        const files = this.getAllFiles(this.sourceDir);
        
        for (const file of files) {
            const relativePath = path.relative(this.sourceDir, file);
            const destPath = path.join(this.buildDir, relativePath);
            
            // Ensure destination directory exists
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            
            // Copy file
            fs.copyFileSync(file, destPath);
        }
        
        console.log(`📁 Copied ${files.length} files`);
    }

    getAllFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    async minifyFiles() {
        console.log('🗜️  Minifying files...');
        
        const files = this.getAllFiles(this.buildDir);
        
        for (const file of files) {
            const ext = path.extname(file);
            
            switch (ext) {
                case '.html':
                    this.minifyHTML(file);
                    break;
                case '.css':
                    this.minifyCSS(file);
                    break;
                case '.js':
                    this.minifyJS(file);
                    break;
            }
        }
    }

    minifyHTML(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Basic HTML minification
        content = content
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
        
        fs.writeFileSync(filePath, content);
    }

    minifyCSS(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Basic CSS minification
        content = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
            .replace(/\s*{\s*/g, '{') // Clean braces
            .replace(/;\s*/g, ';') // Clean semicolons
            .trim();
        
        fs.writeFileSync(filePath, content);
    }

    minifyJS(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Basic JS minification (very simple)
        content = content
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
        
        fs.writeFileSync(filePath, content);
    }
}

// CLI functionality
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--source':
            case '-s':
                options.sourceDir = args[++i];
                break;
            case '--output':
            case '-o':
                options.buildDir = args[++i];
                break;
            case '--no-minify':
                options.minify = false;
                break;
            case '--help':
            case '-h':
                console.log(`
Core Website Framework - Build Tool

Usage: node build.js [options]

Options:
  -s, --source <path>    Source directory (default: website)
  -o, --output <path>    Output directory (default: dist)
  --no-minify           Skip minification
  -h, --help            Show this help message

Features:
  📦 Copy all source files to build directory
  🗜️  Minify HTML, CSS, and JS files
  🧹 Clean build directory before building
                `);
                process.exit(0);
        }
    }
    
    const builder = new WebsiteBuilder(options);
    builder.build().catch(console.error);
}

module.exports = WebsiteBuilder;
