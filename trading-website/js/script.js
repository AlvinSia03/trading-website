// Trading Platform JavaScript with Scene-based Parallax

class TradingPlatform {
    constructor() {
        this.apiUrl = 'http://18.143.79.95/api/priceData/technical-test';
        this.instrumentsData = [];
        this.filteredData = [];
        this.previousData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = '';
        this.refreshInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupChristmasScene();
        this.loadInitialData();
        this.startDataRefresh();
    }
    
    setupChristmasScene() {
        // Scene-based parallax similar to CodePen
        const scene = document.getElementById('christmas-scene');
        if (scene && window.innerWidth > 768) {
            // Simple parallax effect on mouse move
            document.addEventListener('mousemove', (e) => {
                const mouseX = e.clientX / window.innerWidth;
                const mouseY = e.clientY / window.innerHeight;
                
                // Background parallax
                const background = scene.querySelector('.background');
                if (background) {
                    const bgMove = (mouseX - 0.5) * 20;
                    background.style.transform = `translateX(${bgMove}px)`;
                }
                
                // Mountain parallax
                const mountains = scene.querySelector('.mountains');
                if (mountains) {
                    const mountainMove = (mouseX - 0.5) * 40;
                    mountains.style.transform = `translateX(${mountainMove}px)`;
                }
            });
            
            // Scene layers movement on scroll
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const layers = scene.querySelectorAll('.scene-layer');
                
                layers.forEach((layer, index) => {
                    const depth = layer.dataset.depth || 0.2;
                    const yPos = -(scrolled * depth);
                    layer.style.transform += ` translateY(${yPos}px)`;
                });
            });
        }
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterData();
                this.currentPage = 1;
                this.renderTable();
                this.renderPagination();
            });
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Mobile menu toggle
        this.setupMobileMenu();
        
        // Intersection Observer for animations
        this.setupScrollAnimations();
    }
    
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for scroll animations
        document.querySelectorAll('.instrument-card, .step-card, .feature-card').forEach(el => {
            observer.observe(el);
        });
    }
    
    setupMobileMenu() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarNav = document.querySelector('#navbarNav');
        
        if (navbarToggler && navbarNav) {
            navbarToggler.addEventListener('click', () => {
                navbarNav.classList.toggle('show');
            });
        }
    }
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.processData(data);
            this.showLoading(false);
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load market data. Please check your connection.');
        }
    }
    
    processData(data) {
        // Store previous data for comparison
        this.previousData = [...this.instrumentsData];
        
        // Process new data
        this.instrumentsData = Array.isArray(data) ? data : [];
        
        // Filter and sort data
        this.filterData();
        this.sortData();
    }
    
    filterData() {
        if (!this.searchTerm) {
            this.filteredData = [...this.instrumentsData];
        } else {
            this.filteredData = this.instrumentsData.filter(item => 
                item.symbol && item.symbol.toLowerCase().includes(this.searchTerm)
            );
        }
    }
    
    sortData() {
        // Sort by symbol name alphabetically
        this.filteredData.sort((a, b) => {
            const symbolA = a.symbol || '';
            const symbolB = b.symbol || '';
            return symbolA.localeCompare(symbolB);
        });
    }
    
    startDataRefresh() {
        // Refresh data every 1 second
        this.refreshInterval = setInterval(() => {
            this.loadInitialData();
        }, 1000);
    }
    
    stopDataRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    showLoading(show) {
        const loading = document.getElementById('loadingSpinner');
        const tableContainer = document.getElementById('tableContainer');
        
        if (loading && tableContainer) {
            loading.style.display = show ? 'block' : 'none';
            tableContainer.style.display = show ? 'none' : 'block';
        }
    }
    
    showError(message) {
        const loading = document.getElementById('loadingSpinner');
        if (loading) {
            loading.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                    <button class="btn btn-outline-danger btn-sm ms-2" onclick="location.reload()">
                        Retry
                    </button>
                </div>
            `;
            loading.style.display = 'block';
        }
    }
    
    getPriceComparison(currentSymbol, currentPrice, priceType) {
        const previous = this.previousData.find(item => item.symbol === currentSymbol);
        
        if (!previous || !previous[priceType] || !currentPrice) {
            return 'neutral';
        }
        
        const currentValue = parseFloat(currentPrice);
        const previousValue = parseFloat(previous[priceType]);
        
        if (currentValue > previousValue) {
            return 'increase';
        } else if (currentValue < previousValue) {
            return 'decrease';
        }
        return 'neutral';
    }
    
    formatPrice(price) {
        if (!price || isNaN(price)) return '-';
        return parseFloat(price).toFixed(2);
    }
    
    formatChange(change) {
        if (!change || isNaN(change)) return '-';
        const value = parseFloat(change);
        return value >= 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
    }
    
    getPriceClass(comparison) {
        switch (comparison) {
            case 'increase':
                return 'price-red';
            case 'decrease':
                return 'price-green';
            default:
                return 'price-neutral';
        }
    }
    
    getChangeClass(change) {
        if (!change || isNaN(change)) return '';
        const value = parseFloat(change);
        if (value > 0) return 'change-positive price-green';
        if (value < 0) return 'change-negative price-red';
        return 'price-neutral';
    }
    
    renderTable() {
        const tbody = document.getElementById('instrumentTableBody');
        if (!tbody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="fas fa-search fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No instruments found matching your search.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pageData.map(item => {
            const bidComparison = this.getPriceComparison(item.symbol, item.bid, 'bid');
            const askComparison = this.getPriceComparison(item.symbol, item.ask, 'ask');
            const changeComparison = this.getPriceComparison(item.symbol, item.dailyChange, 'dailyChange');
            
            return `
                <tr>
                    <td>
                        <span class="symbol-name">${item.symbol || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="${this.getPriceClass(bidComparison)}">
                            ${this.formatPrice(item.bid)}
                        </span>
                    </td>
                    <td>
                        <span class="${this.getPriceClass(askComparison)}">
                            ${this.formatPrice(item.ask)}
                        </span>
                    </td>
                    <td>
                        <span class="${this.getChangeClass(item.dailyChange)}">
                            ${this.formatChange(item.dailyChange)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add animation to new rows
        tbody.querySelectorAll('tr').forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // Add click events to pagination links
        pagination.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.closest('a').dataset.page);
                if (page && page !== this.currentPage && page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderTable();
                    this.renderPagination();
                    this.scrollToTable();
                }
            });
        });
    }
    
    scrollToTable() {
        const tableSection = document.getElementById('instruments');
        if (tableSection) {
            tableSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize trading platform
    const platform = new TradingPlatform();
    
    // Add some additional interactive features
    initializeAdditionalFeatures();
    
    // Handle page visibility change to pause/resume data refresh
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            platform.stopDataRefresh();
        } else {
            platform.startDataRefresh();
        }
    });
});

function initializeAdditionalFeatures() {
    // Add scroll effects
    addScrollEffects();
    
    // Add form validation
    addFormValidation();
    
    // Add performance optimizations
    addPerformanceOptimizations();
}

function addScrollEffects() {
    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    document.querySelectorAll('.instrument-card, .step-card, .feature-card').forEach(el => {
        observer.observe(el);
    });
}

function addFormValidation() {
    // Add basic form validation for sign-up buttons
    document.querySelectorAll('.btn-signup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Add ripple effect
            createRipple(e);
        });
    });
}

function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function addPerformanceOptimizations() {
    // Lazy load images
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    // Reduce animations on low-power devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduce-motion');
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add CSS classes for animations and effects
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .animate-in {
        animation: slideInUp 0.8s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleAnimation 0.6s linear;
    }
    
    @keyframes rippleAnimation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn-signup {
        position: relative;
        overflow: hidden;
    }
    
    .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(style);