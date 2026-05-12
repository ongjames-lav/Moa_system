// Public API Configuration
const API_URL = '/api';

// State
let currentPage = 1;
const itemsPerPage = 20;
let currentSort = 'uploadDate_DESC';
let currentStatusFilter = 'all';
let currentCollegeFilter = '';
let currentPartnerTypeFilter = '';
let currentViewMode = localStorage.getItem('moaViewMode') || 'tile';
let moasData = [];

// DOM Elements
const moaList = document.getElementById('moaList');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const totalCount = document.getElementById('totalCount');
const searchInput = document.getElementById('searchInput');
const sortBySelect = document.getElementById('sortBy');
const collegeFilter = document.getElementById('collegeFilter');
const partnerTypeFilter = document.getElementById('partnerTypeFilter');
const infoModal = document.getElementById('infoModal');
const infoCardContainer = document.getElementById('infoCardContainer');
const infoDownloadBtn = document.getElementById('infoDownloadBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadMOAs();
});

function setupEventListeners() {
    // Search & Sort
    sortBySelect.addEventListener('change', () => { currentPage = 1; loadMOAs(); });
    searchInput.addEventListener('input', debounce(() => { currentPage = 1; loadMOAs(); }, 400));

    // Filters
    collegeFilter.addEventListener('change', (e) => {
        currentCollegeFilter = e.target.value;
        currentPage = 1;
        loadMOAs();
    });
    partnerTypeFilter.addEventListener('change', (e) => {
        currentPartnerTypeFilter = e.target.value;
        currentPage = 1;
        loadMOAs();
    });

    // Status Filter Buttons
    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            currentStatusFilter = status;
            document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            loadMOAs();
        });
    });

    // View Mode
    document.getElementById('tileViewBtn').addEventListener('click', () => setViewMode('tile'));
    document.getElementById('listViewBtn').addEventListener('click', () => setViewMode('list'));

    // Pagination
    document.getElementById('prevPageBtn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadMOAs(); } });
    document.getElementById('nextPageBtn').addEventListener('click', () => { currentPage++; loadMOAs(); });

    // Settings Toggle (Match Admin)
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const container = document.querySelector('.container');
    
    if (settingsToggleBtn && settingsPanel && container) {
        settingsToggleBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
            settingsToggleBtn.classList.toggle('open');
            container.classList.toggle('settings-open');
        });
    }

    // Modals
    document.querySelectorAll('.modal-close, .info-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });
}

async function loadMOAs() {
    showLoading(true);
    try {
        const [sortBy, sortOrder] = sortBySelect.value.split('_');
        const fieldMap = {
            'uploadDate': 'upload_date',
            'companyName': 'company_name',
            'startDate': 'start_date',
            'endDate': 'end_date'
        };
        const mappedSortBy = fieldMap[sortBy] || 'upload_date';
        const search = searchInput.value.trim();

        let url = `${API_URL}/public/moas?page=${currentPage}&limit=${itemsPerPage}&sortBy=${mappedSortBy}&sortOrder=${sortOrder}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (currentCollegeFilter) url += `&college=${encodeURIComponent(currentCollegeFilter)}`;
        if (currentPartnerTypeFilter) url += `&partnerType=${encodeURIComponent(currentPartnerTypeFilter)}`;
        if (currentStatusFilter && currentStatusFilter !== 'all') url += `&status=${currentStatusFilter}`;

        const response = await fetch(url);
        const result = await response.json();
        
        moasData = result.data || [];
        const total = result.pagination ? result.pagination.total : 0;

        displayMOAs(moasData);
        updatePagination(total);
        totalCount.textContent = total;
    } catch (error) {
        console.error('Load Error:', error);
        showNotification('Failed to load MOAs', 'error');
    } finally {
        showLoading(false);
    }
}

function displayMOAs(moas) {
    moaList.innerHTML = '';
    moaList.className = `moa-list moa-${currentViewMode}-view guest-card`;

    if (moas.length === 0) {
        emptyState.style.display = 'block';
        moaList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    moaList.style.display = currentViewMode === 'list' ? 'flex' : 'grid';

    moas.forEach(moa => {
        const card = createMOACard(moa);
        moaList.appendChild(card);
    });
}

function createMOACard(moa) {
    const card = document.createElement('div');
    card.className = 'moa-card';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(moa.start_date || moa.startDate);
    const endDate = new Date(moa.end_date || moa.endDate);
    endDate.setHours(23, 59, 59, 999);

    const timeDiff = endDate - today;
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const isActive = today >= startDate && today <= endDate;
    const isDueForRenewal = daysUntilExpiry > 0 && daysUntilExpiry <= 31;

    const statusBadge = isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Expired</span>';
    const renewalBadge = isDueForRenewal ? '<span class="status-badge status-renewal">Due for Renewal</span>' : '';
    const college = moa.college || '';
    const collegeBadge = college ? `<span class="status-badge college-badge college-${college.toLowerCase()}">${college}</span>` : '';
    const pType = moa.partner_type || moa.partnerType || '';
    const partnerBadge = pType ? `<span class="status-badge partner-badge partner-${pType.toLowerCase().replace(/ /g, '-')}">${pType}</span>` : '';

    card.innerHTML = `
        <div class="moa-card-header">
            <div class="moa-header-content">
                <h3 class="moa-company-name">${escapeHtml(moa.company_name || moa.companyName)}</h3>
                <div class="badges-wrapper">
                    <div class="category-badges">${collegeBadge}${partnerBadge}</div>
                    <div class="status-badges">${renewalBadge}${statusBadge}</div>
                </div>
            </div>
        </div>
        <div class="moa-card-body">
            <div class="moa-dates">
                <div class="date-item"><span class="date-label">Start:</span><span class="date-value">${formatDate(moa.start_date)}</span></div>
                <div class="date-item"><span class="date-label">End:</span><span class="date-value">${formatDate(moa.end_date)}</span></div>
            </div>
            <p class="moa-notes">${escapeHtml(moa.notes || 'No notes')}</p>
        </div>
        <div class="moa-card-footer">
            <div class="moa-meta">
                <span class="meta-item"><i class="fas fa-file-pdf"></i> PDF Available</span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${formatDate(moa.upload_date)}</span>
            </div>
            <div class="moa-actions">
                <button class="btn-icon btn-download" title="Download"><i class="fas fa-download"></i></button>
            </div>
        </div>
    `;

    card.querySelector('.btn-download').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadMOA(moa.id);
    });

    card.addEventListener('click', () => openInfoModal(moa));

    return card;
}

function openInfoModal(moa) {
    const startDate = formatDate(moa.start_date);
    const endDate = formatDate(moa.end_date);
    const uploadDate = formatDate(moa.upload_date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateObj = new Date(moa.start_date);
    const endDateObj = new Date(moa.end_date);
    endDateObj.setHours(23, 59, 59, 999);

    const timeDiff = endDateObj - today;
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const isActive = today >= startDateObj && today <= endDateObj;
    const isDueForRenewal = daysUntilExpiry > 0 && daysUntilExpiry <= 31;

    const statusBadge = isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Expired</span>';
    const renewalBadge = isDueForRenewal ? '<span class="status-badge status-renewal">Due for Renewal</span>' : '';
    const college = moa.college || '';
    const collegeBadge = college ? `<span class="status-badge college-badge college-${college.toLowerCase()}">${college}</span>` : '';
    const pType = moa.partner_type || '';
    const partnerBadge = pType ? `<span class="status-badge partner-badge partner-${pType.toLowerCase().replace(/ /g, '-')}">${pType}</span>` : '';

    infoCardContainer.innerHTML = `
        <div class="moa-card">
            <div class="moa-card-header">
                <div class="moa-header-content">
                    <h3 class="moa-company-name">${escapeHtml(moa.company_name)}</h3>
                    <div class="badges-wrapper">
                        <div class="category-badges">${collegeBadge}${partnerBadge}</div>
                        <div class="status-badges">${renewalBadge}${statusBadge}</div>
                    </div>
                </div>
            </div>
            <div class="moa-card-body">
                <div class="moa-dates">
                    <div class="date-item"><span class="date-label">Start Date:</span><span class="date-value">${startDate}</span></div>
                    <div class="date-item"><span class="date-label">End Date:</span><span class="date-value">${endDate}</span></div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">NOTES:</p>
                    <p style="color: var(--text-primary); line-height: 1.5; margin: 0;">${escapeHtml(moa.notes || 'No notes added')}</p>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">FILE STATUS:</p><p style="color: var(--text-primary);">Available for Download</p></div>
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">UPLOADED:</p><p style="color: var(--text-primary);">${uploadDate}</p></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    infoDownloadBtn.onclick = () => downloadMOA(moa.id);
    infoModal.style.display = 'flex';
}

async function downloadMOA(id) {
    try {
        const response = await fetch(`${API_URL}/public/moas/${id}/download`);
        const data = await response.json();
        if (data.url) {
            // Match admin behavior: open in new tab via temporary anchor
            const a = document.createElement('a');
            a.href = data.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            showNotification('Failed to get download link: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Download Error:', error);
        showNotification('Download failed', 'error');
    }
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    if (totalPages > 1) {
        paginationControls.style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
}

function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem('moaViewMode', mode);
    document.getElementById('tileViewBtn').classList.toggle('active', mode === 'tile');
    document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
    displayMOAs(moasData);
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Helpers
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
