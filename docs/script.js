// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tabs
    function switchTab(targetTab) {
        // Remove active class from all nav links and tab contents
        navLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked nav link
        const activeLink = document.querySelector(`[data-tab="${targetTab}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Show the corresponding tab content
        const activeContent = document.getElementById(targetTab);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Update URL hash without scrolling
        history.replaceState(null, null, `#${targetTab}`);
    }

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            switchTab(hash);
        }
    });

    // Initialize tab based on URL hash or default to home
    function initializeTab() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            switchTab(hash);
        } else {
            switchTab('home');
        }
    }

    // Initialize the correct tab on page load
    initializeTab();

    // Theme switching functionality
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('preferred-theme', theme);
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('preferred-theme') || 'light';
    const savedThemeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
    if (savedThemeRadio) {
        savedThemeRadio.checked = true;
        applyTheme(savedTheme);
    }

    // Add theme change listeners
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                applyTheme(this.value);
            }
        });
    });


    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Alt + number keys to switch tabs
        if (e.altKey && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            const tabs = ['home', 'utilities', 'hex-editor', 'settings'];
            if (tabs[tabIndex]) {
                switchTab(tabs[tabIndex]);
            }
        }
    });

    // Add loading states for future dynamic content
    window.showLoading = function(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading-spinner">Loading...</div>';
        }
    };

    window.hideLoading = function(containerId, content) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = content;
        }
    };

    // Expose utility functions globally for future use
    window.CoreFramework = {
        switchTab: switchTab,
        showLoading: window.showLoading,
        hideLoading: window.hideLoading
    };

    // Add theme toggle shortcut (Ctrl + T)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Update radio button
            const themeRadio = document.querySelector(`input[name="theme"][value="${newTheme}"]`);
            if (themeRadio) {
                themeRadio.checked = true;
                applyTheme(newTheme);
            }
        }
    });

    // Load hex editor when hex-editor tab is accessed
    const hexEditorTab = document.querySelector('[data-tab="hex-editor"]');
    if (hexEditorTab) {
        hexEditorTab.addEventListener('click', function() {
            setTimeout(() => {
                if (!document.getElementById('hex-editor-content').innerHTML.trim()) {
                    loadHexEditor();
                }
            }, 100);
        });
    }

    // Feature card navigation
    const featureCards = document.querySelectorAll('.feature-card[data-nav-tab]');
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const targetTab = this.dataset.navTab;
            const targetNavLink = document.querySelector(`[data-tab="${targetTab}"]`);
            if (targetNavLink) {
                targetNavLink.click();
            }
        });
    });

    // Check if hex editor tab is active on page load and load content if needed
    setTimeout(() => {
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab && activeTab.dataset.tab === 'hex-editor') {
            const hexEditorContent = document.getElementById('hex-editor-content');
            if (hexEditorContent && !hexEditorContent.innerHTML.trim()) {
                loadHexEditor();
            }
        }
    }, 200);

    console.log('Core Website Framework initialized successfully!');
    console.log('Keyboard shortcuts:');
    console.log('- Alt + 1-4: Switch tabs');
    console.log('- Ctrl + T: Toggle theme');
});

// Load hex editor content and initialize
async function loadHexEditor() {
    console.log('Loading hex editor...');
    try {
        const response = await fetch('hex-editor/hex-editor.html');
        console.log('Fetch response:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const htmlContent = await response.text();
        console.log('HTML content loaded, length:', htmlContent.length);
        
        const container = document.getElementById('hex-editor-content');
        if (!container) {
            throw new Error('hex-editor-content container not found');
        }
        
        container.innerHTML = htmlContent;
        console.log('HTML content inserted');
        
        // Wait a bit for DOM to update, then initialize
        setTimeout(() => {
            console.log('Attempting to initialize hex editor...');
            if (typeof initializeHexEditor === 'function') {
                console.log('initializeHexEditor function found, calling it...');
                initializeHexEditor();
            } else {
                console.error('initializeHexEditor function not found');
                console.log('Available functions:', Object.keys(window).filter(key => key.includes('hex') || key.includes('Hex')));
            }
        }, 100);
    } catch (error) {
        console.error('Failed to load hex editor:', error);
        document.getElementById('hex-editor-content').innerHTML = `<p>Failed to load hex editor: ${error.message}</p>`;
    }
}
