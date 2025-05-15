// Enhanced Instrument Table Implementation - Fixed and Optimized
class TradingPlatform {
    constructor() {
        this.apiUrl = 'http://18.143.79.95/api/priceData/technical-test';
        this.instrumentsData = [];
        this.filteredData = [];
        this.previousData = new Map(); // Use Map for efficient lookups
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = '';
        this.refreshInterval = null;
        this.isFirstLoad = true;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startDataRefresh();
        this.setupParallaxEffect();
        this.setupScrollAnimations();
    }

    setupParallaxEffect() {
        const scene = document.getElementById('scene');
        if (scene && window.innerWidth > 768) {
            let ticking = false;
            
            document.addEventListener('mousemove', (e) => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const mouseX = (e.clientX / window.innerWidth) - 0.5;
                        const mouseY = (e.clientY / window.innerHeight) - 0.5;
                        
                        const background = scene.querySelector('.background');
                        if (background) {
                            const bgX = mouseX * 30;
                            const bgY = mouseY * 15;
                            background.style.transform = `translate(${bgX}px, ${bgY}px)`;
                        }
                        
                        const mountainLayer = scene.querySelector('.mountain-layer');
                        if (mountainLayer) {
                            const mountainX = mouseX * 50;
                            const mountainY = mouseY * 25;
                            mountainLayer.style.transform = `translate(${mountainX}px, ${mountainY}px)`;
                        }
                        
                        ticking = false;
                    });
                    ticking = true;
                }
            });
            
            let scrollTicking = false;
            window.addEventListener('scroll', () => {
                if (!scrollTicking) {
                    requestAnimationFrame(() => {
                        const scrolled = window.pageYOffset;
                        const rate = scrolled * -0.5;
                        if (scene) {
                            scene.style.transform = `translateY(${rate}px)`;
                        }
                        scrollTicking = false;
                    });
                    scrollTicking = true;
                }
            });
        }
    }
    
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.instrument-card, .step-card, .stat-item, .section-title, .section-subtitle').forEach(el => {
            el.classList.add('fade-in-up');
            observer.observe(el);
        });
    }
    
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Debounce search input for better performance
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value.toLowerCase().trim();
                    this.filterData();
                    this.currentPage = 1;
                    this.renderTable();
                    this.renderPagination();
                }, 300);
            });
        }
        
        // Handle cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.stopRefresh();
        });
    }
    
    async loadInitialData() {
        try {
            // Only show loading spinner on first load
            if (this.isFirstLoad) {
                this.showLoading(true);
            }
            
            const data = await this.fetchData();
            this.processData(data);
            
            if (this.isFirstLoad) {
                this.showLoading(false);
                this.isFirstLoad = false;
            }
            
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            this.handleError(error);
        }
    }
    
    async fetchData() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - API took too long to respond');
            }
            throw error;
        }
    }
    
    processData(data) {
        // Store current data as previous for the next comparison
        const newPreviousData = new Map();
        this.instrumentsData.forEach(item => {
            newPreviousData.set(item.symbol, {
                bid: item.bid,
                ask: item.ask,
                dailyChange: item.dailyChange
            });
        });
        
        // Validate and normalize new data
        const validatedData = this.validateData(data);
        
        // Calculate price changes by comparing with previous data
        this.instrumentsData = validatedData.map(item => {
            const previousItem = newPreviousData.get(item.symbol);
            
            if (previousItem) {
                // Apply the color logic as specified in requirements
                item.bidChange = this.getPriceChange(item.bid, previousItem.bid);
                item.askChange = this.getPriceChange(item.ask, previousItem.ask);
                item.dailyChangeChange = this.getPriceChange(item.dailyChange, previousItem.dailyChange);
            } else {
                // No previous data available - neutral color
                item.bidChange = 'neutral';
                item.askChange = 'neutral';
                item.dailyChangeChange = 'neutral';
            }
            
            return item;
        });
        
        // Update previous data for next comparison
        this.previousData = newPreviousData;
        
        // Filter and sort data for display
        this.filterData();
    }
    
    validateData(data) {
        if (!Array.isArray(data)) {
            console.error('Invalid data format: expected array, got:', typeof data);
            return [];
        }
        
        return data
            .filter(item => {
                // Check required fields
                const hasSymbol = item && (item.Symbol || item.symbol);
                const hasBid = item && (item.Bid !== undefined || item.bid !== undefined);
                const hasAsk = item && (item.Ask !== undefined || item.ask !== undefined);
                return hasSymbol && hasBid && hasAsk;
            })
            .map(item => ({
                symbol: item.Symbol || item.symbol,
                bid: this.parseFloat(item.Bid || item.bid),
                ask: this.parseFloat(item.Ask || item.ask),
                dailyChange: this.parseFloat(item.Daily || item.DailyChange || item.dailyChange || item.Change || 0)
            }))
            .filter(item => 
                // Remove items with invalid numeric data
                !isNaN(item.bid) && !isNaN(item.ask) && item.symbol
            );
    }
    
    parseFloat(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    /**
     * Price comparison logic as per requirements:
     * - Green: current < latest (price went down)
     * - Red: current > latest (price went up)  
     * - Neutral: current = latest (price unchanged)
     */
    getPriceChange(current, latest) {
        if (current < latest) return 'green';
        if (current > latest) return 'red';
        return 'neutral';
    }
    
    filterData() {
        if (!this.searchTerm) {
            this.filteredData = [...this.instrumentsData];
        } else {
            this.filteredData = this.instrumentsData.filter(item => 
                item.symbol && item.symbol.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Sort by symbol for consistent display (prevents random jumping)
        this.filteredData.sort((a, b) => {
            if (!a.symbol || !b.symbol) return 0;
            return a.symbol.localeCompare(b.symbol);
        });
    }
    
    startDataRefresh() {
        // Clear any existing interval
        this.stopRefresh();
        
        // Refresh every 1 second as required
        this.refreshInterval = setInterval(async () => {
            try {
                await this.loadInitialData();
            } catch (error) {
                console.error('Refresh error:', error);
                // Continue refreshing even on error, don't break the cycle
            }
        }, 1000);
    }
    
    stopRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    showLoading(show) {
        const loading = document.getElementById('loadingSpinner');
        const tableContainer = document.getElementById('tableContainer');
        
        if (loading && tableContainer) {
            loading.style.display = show ? 'flex' : 'none';
            tableContainer.style.display = show ? 'none' : 'block';
        }
    }
    
    handleError(error) {
        console.error('API Error:', error);
        
        // Show error only on first load or if no data exists
        if (this.isFirstLoad || this.instrumentsData.length === 0) {
            const loading = document.getElementById('loadingSpinner');
            if (loading) {
                loading.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <h5>Error Loading Data</h5>
                        <p>${error.message}</p>
                        <p class="small">
                            ${error.message.includes('CORS') ? 
                                'Please install and enable the CORS extension mentioned in the instructions.' : 
                                'Verify that the API is accessible and the CORS extension is enabled.'
                            }
                        </p>
                        <button class="btn btn-danger" onclick="window.tradingPlatform.loadInitialData()">
                            Retry
                        </button>
                    </div>
                `;
            }
        } else {
            // If we have existing data, just continue with it and hide loading
            this.showLoading(false);
        }
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
                    <td colspan="4" class="text-center py-4 text-muted">
                        ${this.searchTerm ? 
                            `No results found for "${this.escapeHtml(this.searchTerm)}"` : 
                            'No data available'
                        }
                    </td>
                </tr>
            `;
            return;
        }
        
        // Preserve scroll position to prevent jumping
        const tableWrapper = tbody.closest('.table-responsive');
        const scrollTop = tableWrapper ? tableWrapper.scrollTop : 0;
        
        tbody.innerHTML = pageData.map(item => `
            <tr>
                <td>
                    <span class="symbol-name">${this.escapeHtml(item.symbol)}</span>
                </td>
                <td class="${this.getPriceClass(item.bidChange)}">
                    ${this.formatPrice(item.bid)}
                </td>
                <td class="${this.getPriceClass(item.askChange)}">
                    ${this.formatPrice(item.ask)}
                </td>
                <td class="${this.getPriceClass(item.dailyChangeChange)}">
                    ${this.formatChange(item.dailyChange)}
                </td>
            </tr>
        `).join('');
        
        // Restore scroll position to prevent jumping
        if (tableWrapper) {
            tableWrapper.scrollTop = scrollTop;
        }
    }
    
    getPriceClass(change) {
        switch (change) {
            case 'green': return 'price-green';
            case 'red': return 'price-red';
            case 'neutral': return 'price-neutral';
            default: return 'price-neutral';
        }
    }
    
    formatPrice(price) {
        if (isNaN(price)) return '0.00';
        return price.toFixed(2);
    }
    
    formatChange(change) {
        if (isNaN(change)) return '0.000';
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(3)}`;
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        // Smart pagination: show ellipsis for large page counts
        const delta = 2; // Number of pages to show around current page
        const range = [];
        const rangeWithDots = [];
        
        for (let i = Math.max(2, this.currentPage - delta);
             i <= Math.min(totalPages - 1, this.currentPage + delta);
             i++) {
            range.push(i);
        }
        
        if (this.currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }
        
        rangeWithDots.push(...range);
        
        if (this.currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }
        
        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}" 
                   ${this.currentPage === 1 ? 'tabindex="-1"' : ''}>
                    Previous
                </a>
            </li>
        `;
        
        // Page numbers with ellipsis
        rangeWithDots.forEach(page => {
            if (page === '...') {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            } else {
                html += `
                    <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${page}">${page}</a>
                    </li>
                `;
            }
        });
        
        // Next button
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}"
                   ${this.currentPage === totalPages ? 'tabindex="-1"' : ''}>
                    Next
                </a>
            </li>
        `;
        
        pagination.innerHTML = html;
        
        // Add click events to pagination links
        pagination.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                
                if (page && page !== this.currentPage && page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderTable();
                    this.renderPagination();
                    
                    // Smooth scroll to table top
                    const tableSection = document.getElementById('instruments');
                    if (tableSection) {
                        tableSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }
    
    // Public methods for manual control if needed
    refresh() {
        return this.loadInitialData();
    }
    
    destroy() {
        this.stopRefresh();
        // Remove event listeners if needed
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradingPlatform = new TradingPlatform();
});

// Global utility functions
window.refreshInstrumentTable = () => {
    if (window.tradingPlatform) {
        window.tradingPlatform.refresh();
    }
};

window.stopInstrumentTable = () => {
    if (window.tradingPlatform) {
        window.tradingPlatform.destroy();
    }
};