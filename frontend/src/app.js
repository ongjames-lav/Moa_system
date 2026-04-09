// API Configuration (Sync Heartbeat: 2026-04-09 22:50)
let API_URL = import.meta.env.VITE_API_URL || '/api';

// Emergency Override: Force use of Vercel API if dashboard has an old Render URL
if (API_URL.includes('onrender.com') || window.location.hostname.includes('vercel.app')) {
  API_URL = '/api';
}

// State
let token = localStorage.getItem('authToken');
let user = null;
let currentPage = 1;
const itemsPerPage = 20;
let selectedMOAs = new Set();
let currentSort = 'uploadDate_DESC';
let currentStatusFilter = 'all';
let currentCollegeFilter = '';
let currentPartnerTypeFilter = '';
let currentViewMode = localStorage.getItem('moaViewMode') || 'tile';
let moasData = [];
let deleteId = null;

// DOM Elements - Auth
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = document.getElementById('authTabs');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const userDisplay = document.getElementById('userDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// DOM Elements - Main UI
const uploadBtn = document.getElementById('uploadBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const searchInput = document.getElementById('searchInput');
const sortBySelect = document.getElementById('sortBy');
const moaList = document.getElementById('moaList');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const totalCount = document.getElementById('totalCount');
const totalCountLabel = document.getElementById('totalCountLabel');
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const container = document.querySelector('.container');

// DOM Elements - Modals
const uploadModal = document.getElementById('uploadModal');
const detailModal = document.getElementById('detailModal');
const infoModal = document.getElementById('infoModal');
const confirmModal = document.getElementById('confirmModal');
const infoCardContainer = document.getElementById('infoCardContainer');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  if (token) {
    const success = await checkAuth();
    if (success) {
      showApp();
    } else {
      showLogin();
    }
  } else {
    showLogin();
  }
});

function setupEventListeners() {
  // Auth Tabs
  authTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      authTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
      } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
      }
    });
  });

  // Forms
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);

  // Sidebar & Header Actions
  uploadBtn.addEventListener('click', () => openModal(uploadModal));
  settingsToggleBtn.addEventListener('click', toggleSettingsPanel);
  sortBySelect.addEventListener('change', () => { currentPage = 1; loadMOAs(); });
  searchInput.addEventListener('input', debounce(() => { currentPage = 1; loadMOAs(); }, 400));

  // Status Filters
  document.getElementById('allStatusBtn').addEventListener('click', () => setStatusFilter('all'));
  document.getElementById('activeStatusBtn').addEventListener('click', () => setStatusFilter('active'));
  document.getElementById('dueForRenewalBtn').addEventListener('click', () => setStatusFilter('dueForRenewal'));
  document.getElementById('expiredStatusBtn').addEventListener('click', () => setStatusFilter('expired'));

  // Other Filters
  document.getElementById('collegeFilter').addEventListener('change', (e) => {
    currentCollegeFilter = e.target.value;
    currentPage = 1;
    loadMOAs();
  });
  document.getElementById('partnerTypeFilter').addEventListener('change', (e) => {
    currentPartnerTypeFilter = e.target.value;
    currentPage = 1;
    loadMOAs();
  });

  // View Mode
  document.getElementById('tileViewBtn').addEventListener('click', () => setViewMode('tile'));
  document.getElementById('listViewBtn').addEventListener('click', () => setViewMode('list'));

  // Pagination
  document.getElementById('prevPageBtn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadMOAs(); } });
  document.getElementById('nextPageBtn').addEventListener('click', () => { currentPage++; loadMOAs(); });

  // Bulk Actions
  selectAllBtn.addEventListener('click', handleSelectAll);
  deleteSelectedBtn.addEventListener('click', () => {
    if (selectedMOAs.size > 0) {
      deleteId = 'bulk';
      document.getElementById('confirmMessage').textContent = `Are you sure you want to delete ${selectedMOAs.size} selected MOAs?`;
      openModal(confirmModal);
    }
  });

  // Modal Close buttons
  document.querySelectorAll('.modal-close, .modal-close-btn, #closeModalBtn, #confirmCancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Upload Form
  document.getElementById('uploadForm').addEventListener('submit', handleUpload);

  // Save Edit Form
  document.getElementById('saveMetadataBtn').addEventListener('click', handleSaveEdit);

  // Confirm Delete
  document.getElementById('confirmDelete').addEventListener('click', handleDeleteConfirm);

  // Global Modal Click (close on backdrop)
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
}

// Authentication Functions
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      user = await response.json();
      userDisplay.textContent = user.username;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  loginError.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`Server returned unexpected format: ${response.status}`);
    }

    if (response.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('authToken', token);
      userDisplay.textContent = user.username;
      showApp();
    } else {
      loginError.textContent = data.error || `Login failed (${response.status})`;
      loginError.classList.add('show');
    }
  } catch (error) {
    loginError.textContent = 'Connection error';
    loginError.classList.add('show');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  registerError.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`Server returned unexpected format: ${response.status}`);
    }

    if (response.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('authToken', token);
      userDisplay.textContent = user.username;
      showApp();
    } else {
      registerError.textContent = data.error || `Registration failed (${response.status})`;
      registerError.classList.add('show');
    }
  } catch (error) {
    registerError.textContent = 'Connection error';
    registerError.classList.add('show');
  }
}

function handleLogout() {
  token = null;
  user = null;
  localStorage.removeItem('authToken');
  showLogin();
}

function showLogin() {
  loginScreen.classList.add('active');
  appScreen.classList.remove('active');
}

function showApp() {
  loginScreen.classList.remove('active');
  appScreen.classList.add('active');
  loadMOAs();
}

// Main Logic Functions
async function loadMOAs() {
  if (!token) return;
  showLoading(true);

  try {
    const [sortBy, sortOrder] = sortBySelect.value.split('_');
    // Map frontend sort names to backend column names
    const fieldMap = {
      'uploadDate': 'upload_date',
      'companyName': 'company_name',
      'startDate': 'start_date',
      'endDate': 'end_date'
    };
    const mappedSortBy = fieldMap[sortBy] || 'upload_date';
    const search = searchInput.value.trim();

    let url = `${API_URL}/moas?page=${currentPage}&limit=${itemsPerPage}&sortBy=${mappedSortBy}&sortOrder=${sortOrder}`;

    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (currentCollegeFilter) url += `&college=${encodeURIComponent(currentCollegeFilter)}`;
    if (currentPartnerTypeFilter) url += `&partnerType=${encodeURIComponent(currentPartnerTypeFilter)}`;
    if (currentStatusFilter && currentStatusFilter !== 'all') url += `&status=${currentStatusFilter}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) return handleLogout();

    const result = await response.json();
    moasData = result.data || [];
    const total = result.pagination ? result.pagination.total : 0;

    displayMOAs(moasData);
    updatePagination(total);
    totalCount.textContent = total;

    // Update label
    totalCountLabel.textContent = (search || currentCollegeFilter || currentPartnerTypeFilter || currentStatusFilter !== 'all') ? 'Filtered MOAs:' : 'Total MOAs:';

  } catch (error) {
    console.error('Load Error:', error);
    showNotification('Failed to load MOAs', 'error');
  } finally {
    showLoading(false);
  }
}

function displayMOAs(moas) {
  moaList.innerHTML = '';
  moaList.className = `moa-list moa-${currentViewMode}-view`;

  if (moas.length === 0) {
    emptyState.style.display = 'block';
    moaList.style.display = 'none';

    const search = searchInput.value.trim();
    if (search) {
      document.getElementById('emptyStateTitle').textContent = 'No results found';
      document.getElementById('emptyStateMessage').textContent = `We couldn't find any documents matching "${search}".`;
    } else {
      document.getElementById('emptyStateTitle').textContent = 'No MOAs Yet';
      document.getElementById('emptyStateMessage').textContent = 'Start by uploading your first MOA document.';
    }
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
  card.className = `moa-card ${selectedMOAs.has(moa.id) ? 'selected' : ''}`;

  // Status Logic (match Electron)
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
  const partnerType = moa.partner_type || moa.partnerType || '';
  const partnerBadge = partnerType ? `<span class="status-badge partner-badge partner-${partnerType.toLowerCase().replace(/ /g, '-')}">${partnerType}</span>` : '';

  card.innerHTML = `
        <div class="moa-card-header">
            <input type="checkbox" class="moa-checkbox" data-id="${moa.id}" ${selectedMOAs.has(moa.id) ? 'checked' : ''}>
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
                <div class="date-item"><span class="date-label">Start:</span><span class="date-value">${formatDate(moa.start_date || moa.startDate)}</span></div>
                <div class="date-item"><span class="date-label">End:</span><span class="date-value">${formatDate(moa.end_date || moa.endDate)}</span></div>
            </div>
            <p class="moa-notes">${escapeHtml(moa.notes || 'No notes')}</p>
        </div>
        <div class="moa-card-footer">
            <div class="moa-meta">
                <span class="meta-item"><i class="fas fa-file-pdf"></i> ${escapeHtml(moa.filename || moa.pdfOriginalName || 'moa.pdf')}</span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${formatDate(moa.upload_date || moa.uploadDate)}</span>
            </div>
            <div class="moa-actions">
                <button class="btn-icon btn-view" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-download" title="Download"><i class="fas fa-download"></i></button>
                <button class="btn-icon btn-delete danger" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;

  // Events
  card.querySelector('.moa-checkbox').addEventListener('change', (e) => {
    if (e.target.checked) selectedMOAs.add(moa.id);
    else selectedMOAs.delete(moa.id);
    card.classList.toggle('selected', e.target.checked);
    updateBulkUI();
  });

  card.querySelector('.btn-view').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(moa);
  });

  card.querySelector('.btn-download').addEventListener('click', (e) => {
    e.stopPropagation();
    downloadMOA(moa.id);
  });

  card.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteId = moa.id;
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this MOA?';
    openModal(confirmModal);
  });

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.moa-actions') && !e.target.closest('.moa-checkbox')) {
      openInfoModal(moa);
    }
  });

  return card;
}

// Action Handlers
async function handleUpload(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const errorEl = document.getElementById('uploadError');
  errorEl.classList.remove('show');
  
  const file = formData.get('pdf');
  if (!file || file.size === 0) {
    errorEl.textContent = 'No PDF file provided';
    errorEl.classList.add('show');
    return;
  }

  showLoading(true);

  try {
    // 1. Get Presigned Upload URL from our Backend
    const urlResponse = await fetch(`${API_URL}/moas/upload-url`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ originalName: file.name })
    });

    if (!urlResponse.ok) {
      const data = await urlResponse.json();
      throw new Error(data.error || 'Failed to get upload authorization');
    }

    const { signedUrl, fileName } = await urlResponse.json();

    // 2. Upload file directly to Supabase
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // 3. Save metadata to database via our Backend
    const metadata = {
      companyName: formData.get('companyName'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      notes: formData.get('notes'),
      college: formData.get('college'),
      partnerType: formData.get('partnerType'),
      fileName: fileName,
      originalName: file.name,
      fileSize: file.size
    };

    const dbResponse = await fetch(`${API_URL}/moas`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (dbResponse.ok) {
      showNotification('MOA uploaded successfully', 'success');
      closeAllModals();
      e.target.reset();
      loadMOAs();
    } else {
      const data = await dbResponse.json();
      throw new Error(data.error || 'Failed to save record context');
    }
  } catch (error) {
    console.error('Upload Error:', error);
    errorEl.textContent = error.message || 'Connection error';
    errorEl.classList.add('show');
  } finally {
    showLoading(false);
  }
}

async function handleSaveEdit() {
  const id = document.getElementById('editId').value;
  const metadata = {
    companyName: document.getElementById('metadataCompanyName').value,
    startDate: document.getElementById('metadataStartDate').value,
    endDate: document.getElementById('metadataEndDate').value,
    notes: document.getElementById('metadataNotes').value,
    college: document.getElementById('metadataCollege').value || null,
    partnerType: document.getElementById('metadataPartnerType').value || null
  };

  try {
    const response = await fetch(`${API_URL}/moas/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (response.ok) {
      showNotification('MOA updated successfully', 'success');
      closeAllModals();
      loadMOAs();
    } else {
      showNotification('Failed to update MOA', 'error');
    }
  } catch (error) {
    showNotification('Connection error', 'error');
  }
}

async function handleDeleteConfirm() {
  try {
    let response;
    if (deleteId === 'bulk') {
      response = await fetch(`${API_URL}/moas/delete-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: Array.from(selectedMOAs) })
      });
    } else {
      response = await fetch(`${API_URL}/moas/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    if (response.ok) {
      showNotification('Deleted successfully', 'success');
      if (deleteId === 'bulk') selectedMOAs.clear();
      else selectedMOAs.delete(deleteId);
      closeAllModals();
      loadMOAs();
      updateBulkUI();
    } else {
      showNotification('Delete failed', 'error');
    }
  } catch (error) {
    showNotification('Connection error', 'error');
  }
}

async function downloadMOA(id) {
  try {
    const response = await fetch(`${API_URL}/moas/${id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Download failed');

    // Backend returns { url: signedUrl } — open the signed URL directly
    const data = await response.json();
    if (!data.url) throw new Error('No download URL returned');

    const a = document.createElement('a');
    a.href = data.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    showNotification('Failed to download file', 'error');
  }
}

// UI Helpers
function openModal(modal) {
  modal.style.display = 'flex';
  document.body.classList.add('no-scroll');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  document.body.classList.remove('no-scroll');
  deleteId = null;
}

function openEditModal(moa) {
  document.getElementById('editId').value = moa.id;
  document.getElementById('modalTitle').textContent = `Edit: ${moa.company_name || moa.companyName}`;
  document.getElementById('metadataCompanyName').value = moa.company_name || moa.companyName;
  document.getElementById('metadataStartDate').value = formatDateForInput(moa.start_date || moa.startDate);
  document.getElementById('metadataEndDate').value = formatDateForInput(moa.end_date || moa.endDate);
  document.getElementById('metadataNotes').value = moa.notes || '';
  document.getElementById('metadataCollege').value = moa.college || '';
  document.getElementById('metadataPartnerType').value = moa.partner_type || moa.partnerType || '';
  document.getElementById('metadataPDFName').textContent = moa.filename || moa.pdfOriginalName || 'moa.pdf';
  document.getElementById('metadataFileSize').textContent = moa.filesize || moa.pdfFileSize || 'N/A';
  document.getElementById('metadataDate').textContent = formatDate(moa.upload_date || moa.uploadDate);

  openModal(detailModal);
}

function openInfoModal(moa) {
  // Ported from Electron renderer.js
  const startDate = formatDate(moa.start_date || moa.startDate);
  const endDate = formatDate(moa.end_date || moa.endDate);
  const uploadDate = formatDate(moa.upload_date || moa.uploadDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDateObj = new Date(moa.start_date || moa.startDate);
  const endDateObj = new Date(moa.end_date || moa.endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const timeDiff = endDateObj - today;
  const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  const isActive = today >= startDateObj && today <= endDateObj;
  const isDueForRenewal = daysUntilExpiry > 0 && daysUntilExpiry <= 31;

  const statusBadge = isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Expired</span>';
  const renewalBadge = isDueForRenewal ? '<span class="status-badge status-renewal">Due for Renewal</span>' : '';
  const college = moa.college || '';
  const collegeBadge = college ? `<span class="status-badge college-badge college-${college.toLowerCase()}">${college}</span>` : '';
  const pType = moa.partner_type || moa.partnerType || '';
  const partnerBadge = pType ? `<span class="status-badge partner-badge partner-${pType.toLowerCase().replace(/ /g, '-')}">${pType}</span>` : '';

  infoCardContainer.innerHTML = `
        <div class="moa-card">
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
                    <div class="date-item"><span class="date-label">Start Date:</span><span class="date-value">${startDate}</span></div>
                    <div class="date-item"><span class="date-label">End Date:</span><span class="date-value">${endDate}</span></div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">NOTES:</p>
                    <p style="color: var(--text-primary); line-height: 1.5; margin: 0;">${escapeHtml(moa.notes || 'No notes added')}</p>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">FILE:</p><p style="color: var(--text-primary); word-break: break-word;">${escapeHtml(moa.filename || moa.pdfOriginalName || 'moa.pdf')}</p></div>
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">UPLOADED:</p><p style="color: var(--text-primary);">${uploadDate}</p></div>
                    </div>
                </div>
            </div>
            <div class="moa-card-footer">
                <div class="moa-actions">
                    <button class="btn btn-secondary btn-icon-edit"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-primary btn-icon-download"><i class="fas fa-download"></i> Download</button>
                </div>
            </div>
        </div>
    `;

  infoCardContainer.querySelector('.btn-icon-edit').addEventListener('click', () => {
    closeAllModals();
    openEditModal(moa);
  });
  infoCardContainer.querySelector('.btn-icon-download').addEventListener('click', () => {
    downloadMOA(moa.id);
  });

  openModal(infoModal);
}

function updateBulkUI() {
  const count = selectedMOAs.size;
  selectAllBtn.style.display = count > 0 ? 'block' : 'none';
  deleteSelectedBtn.style.display = count > 0 ? 'block' : 'none';
  uploadBtn.style.display = count > 0 ? 'none' : 'block';
}

function handleSelectAll() {
  const allIds = moasData.map(m => m.id);
  const allInCurrentSelected = allIds.every(id => selectedMOAs.has(id));

  if (allInCurrentSelected) {
    allIds.forEach(id => selectedMOAs.delete(id));
  } else {
    allIds.forEach(id => selectedMOAs.add(id));
  }

  displayMOAs(moasData);
  updateBulkUI();
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

function setStatusFilter(status) {
  currentStatusFilter = status;
  document.querySelectorAll('.status-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
  currentPage = 1;
  loadMOAs();
}

function toggleSettingsPanel() {
  settingsPanel.classList.toggle('open');
  settingsToggleBtn.classList.toggle('open');
  container.classList.toggle('settings-open');
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

// Formatters
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
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
