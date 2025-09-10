#!/bin/bash

# Core Website Framework Launch Script
# This script builds and launches the website with proper error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBSITE_DIR="website"
PORT=8080
BROWSER_OPEN=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is available
check_port() {
    if netstat -an | grep -q ":$PORT "; then
        print_warning "Port $PORT is already in use"
        read -p "Would you like to use a different port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter new port number: " PORT
            print_status "Using port $PORT"
        else
            print_error "Cannot start server on occupied port"
            exit 1
        fi
    fi
}

# Function to validate website structure
validate_structure() {
    print_status "Validating website structure..."
    
    if [ ! -d "$WEBSITE_DIR" ]; then
        print_error "Website directory '$WEBSITE_DIR' not found!"
        exit 1
    fi
    
    if [ ! -f "$WEBSITE_DIR/index.html" ]; then
        print_error "index.html not found in $WEBSITE_DIR/"
        exit 1
    fi
    
    if [ ! -f "$WEBSITE_DIR/styles.css" ]; then
        print_warning "styles.css not found in $WEBSITE_DIR/"
    fi
    
    if [ ! -f "$WEBSITE_DIR/script.js" ]; then
        print_warning "script.js not found in $WEBSITE_DIR/"
    fi
    
    print_success "Website structure validated"
}

# Function to build the website (placeholder for future build steps)
build_website() {
    print_status "Building website..."
    
    # Future build steps can be added here:
    # - Minify CSS/JS
    # - Optimize images
    # - Generate sitemap
    # - Run tests
    
    print_success "Website build completed"
}

# Function to start the development server
start_server() {
    print_status "Starting development server on port $PORT..."
    
    cd "$WEBSITE_DIR"
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python not found! Please install Python to run the development server."
        exit 1
    fi
    
    print_success "Server starting at http://localhost:$PORT"
    print_status "Press Ctrl+C to stop the server"
    
    # Start the server in background if browser opening is enabled
    if [ "$BROWSER_OPEN" = true ]; then
        $PYTHON_CMD -m http.server $PORT &
        SERVER_PID=$!
        
        # Wait a moment for server to start
        sleep 2
        
        # Try to open browser
        if command -v start &> /dev/null; then
            # Windows
            start http://localhost:$PORT
        elif command -v open &> /dev/null; then
            # macOS
            open http://localhost:$PORT
        elif command -v xdg-open &> /dev/null; then
            # Linux
            xdg-open http://localhost:$PORT
        else
            print_warning "Could not automatically open browser"
            print_status "Please open http://localhost:$PORT in your browser"
        fi
        
        # Wait for server process
        wait $SERVER_PID
    else
        $PYTHON_CMD -m http.server $PORT
    fi
}

# Function to clean up on exit
cleanup() {
    print_status "Shutting down server..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    print_success "Server stopped"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo "=================================="
    echo "  Core Website Framework Launcher"
    echo "=================================="
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            --no-browser)
                BROWSER_OPEN=false
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  -p, --port PORT    Specify port number (default: 8000)"
                echo "  --no-browser       Don't automatically open browser"
                echo "  -h, --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use -h or --help for usage information"
                exit 1
                ;;
        esac
    done
    
    validate_structure
    check_port
    build_website
    start_server
}

# Run main function with all arguments
main "$@"
