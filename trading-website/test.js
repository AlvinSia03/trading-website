// Trading Platform JavaScript - Clean and Simple

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
        this.priceHistory = new Map();
        this.lastRenderedData = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupParallaxEffect();
        this.setupScrollAnimations();
        this.loadInitialData();
        this.startDataRefresh();
        this.initializeSparkles();
    }
    
    setupParallaxEffect() {
        const scene = document.getElementById('scene');
        if (scene && window.innerWidth > 768) {
            document.addEventListener('mousemove', (e) => {
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
            });
            
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                if (scene) {
                    scene.style.transform = `translateY(${rate}px)`;
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
    
    initializeSparkles() {
        const sparklesContainer = document.querySelector('.sparkles');
        if (sparklesContainer) {
            for (let i = 0; i < 15; i++) {
                const sparkle = document.createElement('div');
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.animationDelay = Math.random() * 3 + 's';
                sparkle.style.animationDuration = (2 + Math.random() * 2) + 's';
                sparklesContainer.appendChild(sparkle);
            }
        }
    }
    
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.filterData();
                this.currentPage = 1;
                this.renderTable();
                this.renderPagination();
                this.highlightSearchResults();
            }, 300));
        }
        
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    this.smoothScrollTo(target);
                }
            });
        });
        
        this.setupMobileMenu();
        this.setupTableSorting();
    }
    
    setupTableSorting() {
        document.querySelectorAll('.instrument-table th').forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(index);
            });
        });
    }
    
    sortTable(columnIndex) {
        const headers = ['symbol', 'bid', 'ask', 'dailyChange'];
        const sortKey = headers[columnIndex];
        
        this.sortDirection = this.lastSortedColumn === columnIndex ? 
            (this.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
        this.lastSortedColumn = columnIndex;
        
        this.filteredData.sort((a, b) => {
            let aVal = a[sortKey];
            let bVal = b[sortKey];
            
            if (columnIndex > 0) {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }
            
            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.renderTable();
        this.updateSortIndicators(columnIndex);
    }
    
    updateSortIndicators(activeColumn) {
        document.querySelectorAll('.instrument-table th').forEach((header, index) => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (index === activeColumn) {
                header.classList.add(`sorted-${this.sortDirection}`);
            }
        });
    }
    
    setupMobileMenu() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarNav = document.querySelector('#navbarNav');
        
        if (navbarToggler && navbarNav) {
            navbarToggler.addEventListener('click', () => {
                navbarNav.classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (!navbarNav.contains(e.target) && !navbarToggler.contains(e.target)) {
                    navbarNav.classList.remove('show');
                }
            });
        }
    }
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            const data = await this.fetchData();
            this.processData(data);
            this.showLoading(false);
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            this.handleDataError(error);
            this.stopDataRefresh();
        }
    }
    
    async fetchData() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const response2 = await fetch(this.apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response2.ok) {
                    throw new Error(`API returned status ${response2.status}`);
                }
                
                return await response2.json();
            }
            
            this.updateConnectionStatus('connected');
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            this.updateConnectionStatus('disconnected');
            throw error;
        }
    }
    
    updateConnectionStatus(status) {
        let statusIndicator = document.getElementById('connection-status');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'connection-status';
            statusIndicator.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusIndicator);
        }
        
        if (status === 'connected') {
            statusIndicator.innerHTML = '🟢 Live Data';
            statusIndicator.style.background = '#1DB954';
            statusIndicator.style.color = 'white';
        } else {
            statusIndicator.innerHTML = '🔴 API Disconnected';
            statusIndicator.style.background = '#FF1A50';
            statusIndicator.style.color = 'white';
        }
    }
    
    processData(data) {
        this.previousData = this.instrumentsData.map(item => ({...item}));
        this.instrumentsData = this.validateData(data);
        this.updatePriceHistory();
        this.filterData();
        this.applySorting();
    }
    
    validateData(data) {
        if (!Array.isArray(data)) {
            return [];
        }
        
        const validItems = data.filter(item => {
            const hasSymbol = item && (item.Symbol || item.symbol);
            const hasBid = item && (item.Bid !== undefined || item.bid !== undefined);
            const hasAsk = item && (item.Ask !== undefined || item.ask !== undefined);
            
            return hasSymbol && 
                   typeof (item.Symbol || item.symbol) === 'string' && 
                   (item.Symbol || item.symbol).trim() !== '' &&
                   hasBid && hasAsk;
        });
        
        return validItems.map(item => ({
            symbol: item.Symbol || item.symbol,
            bid: item.Bid || item.bid,
            ask: item.Ask || item.ask,
            dailyChange: item.Daily || item.DailyChange || item.dailyChange || item.Change || 0
        }));
    }
    
    updatePriceHistory() {
        this.instrumentsData.forEach(item => {
            const symbol = item.symbol;
            const currentPrices = {
                bid: parseFloat(item.bid),
                ask: parseFloat(item.ask),
                dailyChange: parseFloat(item.dailyChange)
            };
            
            if (this.priceHistory.has(symbol)) {
                const previous = this.priceHistory.get(symbol);
                item.bidChange = this.comparePrices(currentPrices.bid, previous.bid);
                item.askChange = this.comparePrices(currentPrices.ask, previous.ask);
                item.changeChange = this.comparePrices(currentPrices.dailyChange, previous.dailyChange);
            }
            
            this.priceHistory.set(symbol, currentPrices);
        });
    }
    
    comparePrices(current, previous) {
        if (current > previous) return 'increase';
        if (current < previous) return 'decrease';
        return 'same';
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
    
    applySorting() {
        if (this.lastSortedColumn !== undefined) {
            this.sortTable(this.lastSortedColumn);
        } else {
            this.filteredData.sort((a, b) => a.symbol.localeCompare(b.symbol));
        }
    }
    
    highlightSearchResults() {
        const tableRows = document.querySelectorAll('.instrument-table tbody tr');
        tableRows.forEach(row => {
            const symbolCell = row.querySelector('td:first-child');
            if (symbolCell && this.searchTerm) {
                const symbol = symbolCell.textContent;
                const highlighted = symbol.replace(
                    new RegExp(this.searchTerm, 'gi'),
                    match => `<mark>${match}</mark>`
                );
                symbolCell.innerHTML = highlighted;
            }
        });
    }
    
    startDataRefresh() {
        this.refreshInterval = setInterval(async () => {
            try {
                await this.loadInitialData();
            } catch (error) {
                this.handleRefreshError();
            }
        }, 1000);
    }
    
    handleRefreshError() {
        this.stopDataRefresh();
        setTimeout(() => {
            this.startDataRefresh();
        }, 5000);
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
            loading.style.display = show ? 'flex' : 'none';
            tableContainer.style.display = show ? 'none' : 'block';
        }
    }
    
    handleDataError(error) {
        const loading = document.getElementById('loadingSpinner');
        const tableContainer = document.getElementById('tableContainer');
        
        if (loading && tableContainer) {
            tableContainer.style.display = 'none';
            loading.style.display = 'flex';
            
            loading.innerHTML = `
                <div class="alert alert-danger text-center" role="alert">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                    <h4>Unable to Connect to API</h4>
                    <p class="mb-3">Cannot fetch data from the trading API.</p>
                    
                    <div class="mt-4">
                        <button class="btn btn-danger me-2" onclick="window.tradingPlatform.loadInitialData()">
                            <i class="fas fa-redo-alt"></i> Retry Connection
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    formatPrice(price) {
        if (!price || isNaN(price)) return '-';
        return parseFloat(price).toFixed(2);
    }
    
    formatChange(change) {
        if (!change || isNaN(change)) return '-';
        const value = parseFloat(change);
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(3)}`;
    }
    
    getPriceClass(change) {
        switch (change) {
            case 'increase': return 'price-red';
            case 'decrease': return 'price-green';
            default: return 'price-neutral';
        }
    }
    
    getChangeClass(change) {
        if (!change || isNaN(change)) return 'price-neutral';
        const value = parseFloat(change);
        if (value > 0) return 'price-green';
        if (value < 0) return 'price-red';
        return 'price-neutral';
    }
    
    renderTable() {
        const tbody = document.getElementById('instrumentTableBody');
        if (!tbody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tbody.innerHTML = this.getEmptyTableHTML();
            return;
        }
        
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer && tableContainer.style.display === 'none') {
            tableContainer.style.display = 'block';
        }
        
        // Preserve scroll position
        const tableWrapper = tbody.closest('.table-responsive');
        const scrollTop = tableWrapper ? tableWrapper.scrollTop : 0;
        
        // Check if data changed
        const currentDataString = JSON.stringify(pageData.map(item => ({
            symbol: item.symbol,
            bid: item.bid,
            ask: item.ask,
            dailyChange: item.dailyChange
        })));
        
        if (this.lastRenderedData === currentDataString && tbody.children.length > 0) {
            this.updatePriceChanges(pageData);
            return;
        }
        
        this.lastRenderedData = currentDataString;
        
        // Generate HTML for table rows
        const rowsHTML = pageData.map((item, index) => {
            return `
                <tr data-symbol="${item.symbol}">
                    <td>
                        <span class="symbol-name">${item.symbol || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="price-cell ${this.getPriceClass(item.bidChange)}" data-price="${item.bid}">
                            ${this.formatPrice(item.bid)}
                        </span>
                    </td>
                    <td>
                        <span class="price-cell ${this.getPriceClass(item.askChange)}" data-price="${item.ask}">
                            ${this.formatPrice(item.ask)}
                        </span>
                    </td>
                    <td>
                        <span class="price-cell ${this.getChangeClass(item.dailyChange)}" data-price="${item.dailyChange}">
                            ${this.formatChange(item.dailyChange)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = rowsHTML;
        
        // Restore scroll position
        if (tableWrapper) {
            tableWrapper.scrollTop = scrollTop;
        }
        
        this.highlightSearchResults();
    }
    
    updatePriceChanges(pageData) {
        const rows = document.querySelectorAll('#instrumentTableBody tr');
        
        pageData.forEach((item, index) => {
            if (rows[index]) {
                const row = rows[index];
                const bidCell = row.querySelector('td:nth-child(2) .price-cell');
                const askCell = row.querySelector('td:nth-child(3) .price-cell');
                const changeCell = row.querySelector('td:nth-child(4) .price-cell');
                
                if (bidCell && bidCell.dataset.price !== item.bid) {
                    bidCell.textContent = this.formatPrice(item.bid);
                    bidCell.dataset.price = item.bid;
                    bidCell.className = `price-cell ${this.getPriceClass(item.bidChange)}`;
                    this.flashPriceChange(bidCell, item.bidChange);
                }
                
                if (askCell && askCell.dataset.price !== item.ask) {
                    askCell.textContent = this.formatPrice(item.ask);
                    askCell.dataset.price = item.ask;
                    askCell.className = `price-cell ${this.getPriceClass(item.askChange)}`;
                    this.flashPriceChange(askCell, item.askChange);
                }
                
                if (changeCell && changeCell.dataset.price !== item.dailyChange) {
                    changeCell.textContent = this.formatChange(item.dailyChange);
                    changeCell.dataset.price = item.dailyChange;
                    changeCell.className = `price-cell ${this.getChangeClass(item.dailyChange)}`;
                    this.flashPriceChange(changeCell, item.dailyChange > 0 ? 'increase' : 'decrease');
                }
            }
        });
    }
    
    flashPriceChange(element, changeType) {
        // Slower, more subtle animation
        element.style.transition = 'background-color 0.8s ease';
        element.style.backgroundColor = changeType === 'increase' ? 
            'rgba(255, 26, 80, 0.08)' : 'rgba(29, 185, 84, 0.08)';
        
        setTimeout(() => {
            element.style.backgroundColor = 'transparent';
        }, 800);
    }
    
    getEmptyTableHTML() {
        return `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No instruments found</h5>
                    <p class="text-muted">
                        ${this.searchTerm ? 
                            `No results matching "${this.searchTerm}"` : 
                            'No data available at the moment'}
                    </p>
                </td>
            </tr>
        `;
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        pagination.innerHTML = this.generatePaginationHTML(totalPages);
        this.addPaginationEventListeners(totalPages);
    }
    
    generatePaginationHTML(totalPages) {
        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Next button
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        return html;
    }
    
    addPaginationEventListeners(totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
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
    
    smoothScrollTo(target) {
        const targetPosition = target.offsetTop - 80;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        requestAnimationFrame(animation);
    }
    
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    debounce(func, wait) {
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
}

// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradingPlatform = new TradingPlatform();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.tradingPlatform.stopDataRefresh();
        } else {
            window.tradingPlatform.startDataRefresh();
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        window.tradingPlatform.startDataRefresh();
    });
    
    window.addEventListener('offline', () => {
        window.tradingPlatform.stopDataRefresh();
    });
});

// Add utility styles
const style = document.createElement('style');
style.textContent = `
    mark {
        background-color: rgba(255, 26, 80, 0.3);
        padding: 0 2px;
        border-radius: 2px;
    }
    
    .instrument-table th.sorted-asc::after {
        content: '↑';
        margin-left: 8px;
        color: var(--primary-color);
    }
    
    .instrument-table th.sorted-desc::after {
        content: '↓';
        margin-left: 8px;
        color: var(--primary-color);
    }
    
    .fade-in-up {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .fade-in-up.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);