console.log('=== RENDERER SCRIPT LOADING ===');
import './index.css';

console.log('window object available:', !!window);
console.log('window.moaAPI available at load:', !!window.moaAPI);

let moaAPI;

// Wait for moaAPI to be available (might be injected in dev mode)
if (window.moaAPI) {
  moaAPI = window.moaAPI;
  console.log('✅ moaAPI found on window immediately');
} else {
  console.warn('⚠️  moaAPI not found at script load - waiting for injection...');
  
  // Wait for the API to be injected (for dev mode)
  window.addEventListener('moaAPIReady', () => {
    moaAPI = window.moaAPI;
    console.log('✅ moaAPI injected and ready');
  });
}

// State
let currentPage = 0;
const itemsPerPage = 20;
let selectedMOAIds = new Set();
let currentMetadataMOAId = null;
let currentSortBy = 'uploadDate';
let currentSortOrder = 'DESC';
let currentStatusFilter = 'all'; // 'all', 'active', 'expired', 'dueForRenewal'
let currentCollegeFilter = ''; // empty string means all colleges
let currentPartnerTypeFilter = ''; // empty string means all partner types
let currentViewMode = 'tile'; // 'tile' or 'list'

// DOM Elements
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
const detailModal = document.getElementById('detailModal');
const modalClose = document.querySelector('#detailModal .modal-close');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveMetadataBtn = document.getElementById('saveMetadataBtn');
const metadataCompanyName = document.getElementById('metadataCompanyName');
const metadataStartDate = document.getElementById('metadataStartDate');
const metadataEndDate = document.getElementById('metadataEndDate');
const metadataNotes = document.getElementById('metadataNotes');
const metadataCollege = document.getElementById('metadataCollege');
const metadataPartnerType = document.getElementById('metadataPartnerType');
const metadataPDFName = document.getElementById('metadataPDFName');
const metadataFileSize = document.getElementById('metadataFileSize');
const metadataDate = document.getElementById('metadataDate');
const paginationControls = document.getElementById('paginationControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const allStatusBtn = document.getElementById('allStatusBtn');
const activeStatusBtn = document.getElementById('activeStatusBtn');
const dueForRenewalBtn = document.getElementById('dueForRenewalBtn');
const expiredStatusBtn = document.getElementById('expiredStatusBtn');
const infoModal = document.getElementById('infoModal');
const infoModalClose = document.querySelector('.info-modal-close');
const infoCardContainer = document.getElementById('infoCardContainer');
const tileViewBtn = document.getElementById('tileViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const collegeFilter = document.getElementById('collegeFilter');
const partnerTypeFilter = document.getElementById('partnerTypeFilter');
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const container = document.querySelector('.container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOMContentLoaded FIRED ===');
  console.log('moaAPI available:', !!moaAPI);
  console.log('window.moaAPI available:', !!window.moaAPI);
  
  // If moaAPI exists on window but not in our variable, use it
  if (!moaAPI && window.moaAPI) {
    moaAPI = window.moaAPI;
    console.log('✅ Using moaAPI from window');
  }
  
  if (!moaAPI) {
    console.error('❌ FATAL: moaAPI is still not available!');
    showNotification('Fatal Error: API bridge not available. Please restart the app.', 'error');
    return;
  }
  
  console.log('moaAPI.getMOAList available:', !!moaAPI?.getMOAList);
  
  // Event Listeners - moved inside DOMContentLoaded to ensure DOM is ready
  uploadBtn.addEventListener('click', handleUpload);
  selectAllBtn.addEventListener('click', handleSelectAll);
  deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
  searchInput.addEventListener('input', handleSearch);
  sortBySelect.addEventListener('change', handleSortChange);
  modalClose.addEventListener('click', closeModal);
  closeModalBtn.addEventListener('click', closeModal);
  infoModalClose.addEventListener('click', closeInfoModal);
  infoModal.addEventListener('click', (e) => {
    // Close when clicking the modal backdrop (not the content)
    if (e.target === infoModal) {
      closeInfoModal();
    }
  });
  saveMetadataBtn.addEventListener('click', handleSaveMetadata);
  prevPageBtn.addEventListener('click', () => previousPage());
  nextPageBtn.addEventListener('click', () => nextPage());
  allStatusBtn.addEventListener('click', () => handleStatusFilterChange('all'));
  activeStatusBtn.addEventListener('click', () => handleStatusFilterChange('active'));
  dueForRenewalBtn.addEventListener('click', () => handleStatusFilterChange('dueForRenewal'));
  expiredStatusBtn.addEventListener('click', () => handleStatusFilterChange('expired'));
  tileViewBtn.addEventListener('click', () => handleViewModeChange('tile'));
  listViewBtn.addEventListener('click', () => handleViewModeChange('list'));
  collegeFilter.addEventListener('change', handleCollegeFilterChange);
  partnerTypeFilter.addEventListener('change', handlePartnerTypeFilterChange);
  settingsToggleBtn.addEventListener('click', () => toggleSettingsPanel());

  // Close settings panel when clicking in main content area
  const mainContent = document.querySelector('.main-content');
  mainContent.addEventListener('click', () => {
    if (settingsPanel.classList.contains('open')) {
      toggleSettingsPanel();
    }
  });

  // Listen for updates from main process
  moaAPI.onMOAsUpdated(() => {
    currentPage = 0;
    selectedMOAIds.clear();
    loadMOAs();
  });

  moaAPI.onMOADeleted(({ id }) => {
    selectedMOAIds.delete(id);
    loadMOAs();
  });

  // Listen for notification click to open MOA details
  moaAPI.onOpenMOADetails(({ id }) => {
    openDetailsModal(id);
  });
  
  // Load view mode from localStorage
  const savedViewMode = localStorage.getItem('moaViewMode');
  if (savedViewMode && (savedViewMode === 'tile' || savedViewMode === 'list')) {
    currentViewMode = savedViewMode;
    // Update button styles to match saved view mode
    if (currentViewMode === 'tile') {
      tileViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    } else {
      listViewBtn.classList.add('active');
      tileViewBtn.classList.remove('active');
    }
  }
  
  console.log('About to call loadMOAs from DOMContentLoaded');
  loadMOAs();
  console.log('loadMOAs called from DOMContentLoaded');
});

async function handleUpload() {
  try {
    const result = await moaAPI.uploadMOA();
    if (result) {
      showNotification('MOA uploaded successfully!', 'success');
      currentPage = 0;
      await loadMOAs();
      // Automatically open the details modal for the newly uploaded MOA
      if (result.id) {
        setTimeout(() => openDetailsModal(result.id), 500);
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Error uploading MOA', 'error');
  }
}

async function loadMOAs() {
  try {
    console.log('=== LOAD MOAs CALLED ===');
    console.log('moaAPI available:', !!moaAPI);
    console.log('moaAPI.getMOAList available:', !!moaAPI?.getMOAList);
    
    showLoading(true);

    // Parse sort selection
    const [sortBy, sortOrder] = sortBySelect.value.split('_');
    currentSortBy = sortBy;
    currentSortOrder = sortOrder;

    console.log('Calling getMOAList with:', { itemsPerPage, offset: currentPage * itemsPerPage, sortBy, sortOrder });
    
    console.log('Making API call...');
    const response = await moaAPI.getMOAList(
      itemsPerPage,
      currentPage * itemsPerPage,
      sortBy,
      sortOrder
    );

    console.log('✅ Received response from API');
    console.log('Received from API:', response);
    console.log('MOAs count:', response?.moas?.length);
    console.log('Total:', response?.total);

    if (!response || !response.moas) {
      throw new Error('Invalid response from MOA API: ' + JSON.stringify(response));
    }

    const { moas, total } = response;

    // Apply status filter
    let filteredMoas = moas;
    if (currentStatusFilter !== 'all') {
      filteredMoas = moas.filter(moa => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight local time
        
        const startDateObj = new Date(moa.startDate);
        startDateObj.setHours(0, 0, 0, 0);
        const endDateObj = new Date(moa.endDate);
        endDateObj.setHours(23, 59, 59, 999); // Set to end of day
        
        const timeDiff = endDateObj - today;
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        const isActive = today >= startDateObj && today <= endDateObj;
        
        if (currentStatusFilter === 'active') {
          return isActive;
        } else if (currentStatusFilter === 'expired') {
          return !isActive;
        } else if (currentStatusFilter === 'dueForRenewal') {
          // Due for renewal: expires within 31 days but hasn't expired yet
          return daysUntilExpiry > 0 && daysUntilExpiry <= 31;
        }
        return true;
      });
    }

    // Apply college filter
    if (currentCollegeFilter) {
      if (currentCollegeFilter === 'none') {
        // Filter for MOAs with no college (null or empty)
        filteredMoas = filteredMoas.filter(moa => !moa.college || moa.college.trim() === '');
      } else {
        // Filter for MOAs with specific college
        filteredMoas = filteredMoas.filter(moa => moa.college === currentCollegeFilter);
      }
    }

    // Apply partner type filter
    if (currentPartnerTypeFilter) {
      if (currentPartnerTypeFilter === 'none') {
        // Filter for MOAs with no partner type (null or empty)
        filteredMoas = filteredMoas.filter(moa => !moa.partnerType || moa.partnerType.trim() === '');
      } else {
        // Filter for MOAs with specific partner type
        filteredMoas = filteredMoas.filter(moa => moa.partnerType === currentPartnerTypeFilter);
      }
    }

    totalCount.textContent = filteredMoas.length;

    // Update label based on filter state
    const isFiltered = currentStatusFilter !== 'all' || currentCollegeFilter !== '' || currentPartnerTypeFilter !== '';
    totalCountLabel.textContent = isFiltered ? 'MOA Count:' : 'Total MOAs:';

    if (filteredMoas.length === 0 && currentPage === 0) {
      emptyState.style.display = 'block';
      moaList.style.display = 'none';
      paginationControls.style.display = 'none';
      
      // Check if database is completely empty or if filters returned no results
      if (moas.length === 0) {
        // Database is completely empty
        emptyStateTitle.textContent = 'No MOAs Yet';
        emptyStateMessage.textContent = 'Start by uploading your first MOA document using the upload button.';
      } else {
        // MOAs exist but filters returned no results
        emptyStateTitle.textContent = 'No results found';
        emptyStateMessage.textContent = 'We couldn\'t find any documents matching your current filters. Try adjusting your search or clearing the filters.';
      }
      
      showLoading(false);
      return;
    }

    emptyState.style.display = 'none';
    moaList.style.display = 'grid';

    renderMOAList(filteredMoas, filteredMoas.length);
    updatePagination(filteredMoas.length);
    showLoading(false);

    // Show/hide bulk actions
    updateBulkActionButtons();
  } catch (error) {
    console.error('Error loading MOAs:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    showNotification(`Error loading MOAs: ${error?.message || 'Unknown error'}`, 'error');
    showLoading(false);
  }
}

function renderMOAList(moas, total) {
  moaList.innerHTML = '';
  moaList.className = `moa-list moa-${currentViewMode}-view`;

  moas.forEach(moa => {
    const moaCard = document.createElement('div');
    moaCard.className = `moa-card ${selectedMOAIds.has(moa.id) ? 'selected' : ''}`;
    
    const startDate = formatDate(moa.startDate);
    const endDate = formatDate(moa.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight local time
    
    const startDateObj = new Date(moa.startDate);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(moa.endDate);
    endDateObj.setHours(23, 59, 59, 999); // Set to end of day to include the end date
    
    const timeDiff = endDateObj - today;
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const isActive = today >= startDateObj && today <= endDateObj;
    const isDueForRenewal = daysUntilExpiry > 0 && daysUntilExpiry <= 31;
    
    const statusBadge = isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Expired</span>';
    const renewalBadge = isDueForRenewal ? '<span class="status-badge status-renewal">Due for Renewal</span>' : '';
    const collegeBadge = moa.college ? `<span class="status-badge college-badge college-${moa.college.toLowerCase()}">${moa.college}</span>` : '';
    const partnerTypeBadge = moa.partnerType ? `<span class="status-badge partner-badge partner-${moa.partnerType.toLowerCase().replace(' ', '-')}">${moa.partnerType}</span>` : '';

    moaCard.innerHTML = `
      <div class="moa-card-header">
        <input 
          type="checkbox" 
          class="moa-checkbox" 
          data-id="${moa.id}"
          ${selectedMOAIds.has(moa.id) ? 'checked' : ''}
        />
        <div class="moa-header-content">
          <h3 class="moa-company-name">${escapeHtml(moa.companyName)}</h3>
          <div class="badges-wrapper">
            <div class="category-badges">
              ${collegeBadge}
              ${partnerTypeBadge}
            </div>
            <div class="status-badges">
              ${renewalBadge}
              ${statusBadge}
            </div>
          </div>
        </div>
      </div>
      <div class="moa-card-body">
        <div class="moa-dates">
          <div class="date-item">
            <span class="date-label">Start:</span>
            <span class="date-value">${startDate}</span>
          </div>
          <div class="date-item">
            <span class="date-label">End:</span>
            <span class="date-value">${endDate}</span>
          </div>
        </div>
        <p class="moa-notes">${escapeHtml(moa.notes || 'No notes')}</p>
      </div>
      <div class="moa-card-footer">
        <div class="moa-meta">
          <span class="meta-item">📄 ${escapeHtml(moa.pdfOriginalName)}</span>
          <span class="meta-item">📦 ${moa.pdfFileSize}</span>
          <span class="meta-item">📅 ${formatDate(moa.uploadDate)}</span>
        </div>
        <div class="moa-actions">
          <button class="btn-icon btn-view" data-id="${moa.id}" title="View and Edit Details">📝</button>
          <button class="btn-icon btn-open" data-id="${moa.id}" title="Open PDF">🖨️</button>
          <button class="btn-icon btn-delete" data-id="${moa.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;

    const checkbox = moaCard.querySelector('.moa-checkbox');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedMOAIds.add(moa.id);
      } else {
        selectedMOAIds.delete(moa.id);
      }
      updateMOACardSelection(moa.id, e.target.checked);
      updateBulkActionButtons();
    });

    const viewBtn = moaCard.querySelector('.btn-view');
    viewBtn.addEventListener('click', () => openDetailsModal(moa.id));

    const openBtn = moaCard.querySelector('.btn-open');
    openBtn.addEventListener('click', () => handleOpenPDF(moa.id));

    const deleteBtn = moaCard.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => handleDeleteMOA(moa.id));

    // Card click handler (not on buttons)
    moaCard.addEventListener('click', (e) => {
      // Don't trigger if clicking on buttons or checkbox
      if (!e.target.closest('.btn-icon') && !e.target.closest('.moa-checkbox')) {
        openInfoModal(moa);
      }
    });

    moaList.appendChild(moaCard);
  });
}

function updateMOACardSelection(id, selected) {
  const card = document.querySelector(`.moa-card:has([data-id="${id}"])`);
  if (card) {
    if (selected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  }
}

function updateBulkActionButtons() {
  const hasSelection = selectedMOAIds.size > 0;
  selectAllBtn.style.display = hasSelection ? 'block' : 'none';
  deleteSelectedBtn.style.display = hasSelection ? 'block' : 'none';
  uploadBtn.style.display = hasSelection ? 'none' : 'block';
}

function updatePagination(total) {
  const totalPages = Math.ceil(total / itemsPerPage);
  const hasMultiplePages = totalPages > 1;

  if (hasMultiplePages) {
    paginationControls.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage >= totalPages - 1;
  } else {
    paginationControls.style.display = 'none';
  }
}

function previousPage() {
  if (currentPage > 0) {
    currentPage--;
    loadMOAs();
    window.scrollTo(0, 0);
  }
}

function nextPage() {
  currentPage++;
  loadMOAs();
  window.scrollTo(0, 0);
}

async function handleSearch(e) {
  const query = e.target.value.trim();

  if (!query) {
    currentPage = 0;
    loadMOAs();
    return;
  }

  try {
    showLoading(true);
    const moas = await moaAPI.searchMOAs(query);

    totalCount.textContent = moas.length;

    if (moas.length === 0) {
      emptyState.innerHTML = `
        <div class="empty-icon">🔍</div>
        <h2>No Results</h2>
        <p>No MOAs match your search query.</p>
      `;
      emptyState.style.display = 'block';
      moaList.style.display = 'none';
      paginationControls.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      moaList.style.display = 'grid';
      renderMOAList(moas, moas.length);
      paginationControls.style.display = 'none';
    }

    showLoading(false);
  } catch (error) {
    console.error('Search error:', error);
    showNotification('Error searching MOAs', 'error');
    showLoading(false);
  }
}

function handleSortChange() {
  currentPage = 0;
  loadMOAs();
}

function handleViewModeChange(mode) {
  currentViewMode = mode;
  currentPage = 0;
  
  // Save view mode to localStorage
  localStorage.setItem('moaViewMode', mode);
  
  // Update button styles
  if (mode === 'tile') {
    tileViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
  } else {
    listViewBtn.classList.add('active');
    tileViewBtn.classList.remove('active');
  }
  
  loadMOAs();
}

function handleStatusFilterChange(status) {
  currentStatusFilter = status;
  currentPage = 0;
  
  // Update button styles
  const buttons = [allStatusBtn, activeStatusBtn, dueForRenewalBtn, expiredStatusBtn];
  buttons.forEach(btn => {
    if (btn.getAttribute('data-status') === status) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  loadMOAs();
}

function handleCollegeFilterChange() {
  currentCollegeFilter = collegeFilter.value;
  currentPage = 0;
  loadMOAs();
}

function handlePartnerTypeFilterChange() {
  currentPartnerTypeFilter = partnerTypeFilter.value;
  currentPage = 0;
  loadMOAs();
}

function handleSelectAll() {
  const checkboxes = document.querySelectorAll('.moa-checkbox');
  const allSelected = selectedMOAIds.size === checkboxes.length;

  checkboxes.forEach(checkbox => {
    const id = parseInt(checkbox.getAttribute('data-id'));
    checkbox.checked = !allSelected;

    if (!allSelected) {
      selectedMOAIds.add(id);
    } else {
      selectedMOAIds.delete(id);
    }
  });

  document.querySelectorAll('.moa-card').forEach(card => {
    card.classList.toggle('selected');
  });

  updateBulkActionButtons();
}

async function handleDeleteSelected() {
  if (selectedMOAIds.size === 0) return;

  if (!confirm(`Delete ${selectedMOAIds.size} MOA(s)?`)) return;

  try {
    const ids = Array.from(selectedMOAIds);
    await moaAPI.deleteMOAs(ids);
    selectedMOAIds.clear();
    showNotification(`${ids.length} MOA(s) deleted successfully!`, 'success');
    loadMOAs();
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Error deleting MOAs', 'error');
  }
}

async function handleDeleteMOA(id) {
  if (!confirm('Delete this MOA?')) return;

  try {
    await moaAPI.deleteMOA(id);
    showNotification('MOA deleted successfully!', 'success');
    loadMOAs();
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Error deleting MOA', 'error');
  }
}

async function handleOpenPDF(id) {
  try {
    const pdfPath = await moaAPI.openMOA(id);
    if (pdfPath) {
      // const { shell } = require('electron');
      // This won't work from renderer, but we can show notification
      showNotification(`Opening PDF`, 'info');
    } else {
      showNotification('Could not open PDF', 'error');
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    showNotification('Error opening PDF', 'error');
  }
}

async function openDetailsModal(id) {
  try {
    currentMetadataMOAId = id;
    const metadata = await moaAPI.getMOAMetadata(id);

    if (!metadata) {
      showNotification('Could not load MOA details', 'error');
      return;
    }

    document.getElementById('modalTitle').textContent = `Edit: ${metadata.companyName}`;
    metadataCompanyName.value = metadata.companyName;
    metadataStartDate.value = metadata.startDate;
    metadataEndDate.value = metadata.endDate;
    metadataNotes.value = metadata.notes;
    metadataCollege.value = metadata.college || '';
    metadataPartnerType.value = metadata.partnerType || '';
    metadataPDFName.textContent = escapeHtml(metadata.pdfOriginalName);
    metadataFileSize.textContent = metadata.pdfFileSize;
    metadataDate.textContent = formatDate(metadata.uploadDate);

    detailModal.style.display = 'flex';
    document.body.classList.add('no-scroll');
  } catch (error) {
    console.error('Error opening details:', error);
    showNotification('Error loading MOA details', 'error');
  }
}

async function handleSaveMetadata() {
  if (!currentMetadataMOAId) return;

  // Validate dates
  if (new Date(metadataStartDate.value) > new Date(metadataEndDate.value)) {
    showNotification('Start date must be before end date', 'error');
    return;
  }

  try {
    // Build metadata object with explicit college handling
    const metadata = {
      companyName: metadataCompanyName.value,
      startDate: metadataStartDate.value,
      endDate: metadataEndDate.value,
      notes: metadataNotes.value,
    };

    // Only include college if it has a value
    if (metadataCollege.value && metadataCollege.value.trim()) {
      metadata.college = metadataCollege.value.trim();
    } else {
      metadata.college = null;
    }

    // Only include partner type if it has a value
    if (metadataPartnerType.value && metadataPartnerType.value.trim()) {
      metadata.partnerType = metadataPartnerType.value.trim();
    } else {
      metadata.partnerType = null;
    }

    await moaAPI.updateMOAMetadata(currentMetadataMOAId, metadata);

    showNotification('MOA details saved successfully!', 'success');
    closeModal();
    loadMOAs();
  } catch (error) {
    console.error('Error saving metadata:', error);
    showNotification('Error saving MOA metadata', 'error');
  }
}

function openInfoModal(moa) {
  // Create a display card similar to the MOA card but in modal format
  const startDate = formatDate(moa.startDate);
  const endDate = formatDate(moa.endDate);
  const uploadDate = formatDate(moa.uploadDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDateObj = new Date(moa.startDate);
  startDateObj.setHours(0, 0, 0, 0);
  const endDateObj = new Date(moa.endDate);
  endDateObj.setHours(23, 59, 59, 999);
  
  const timeDiff = endDateObj - today;
  const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  const isActive = today >= startDateObj && today <= endDateObj;
  const isDueForRenewal = daysUntilExpiry > 0 && daysUntilExpiry <= 31;
  
  // Limit company name to 200 characters
  let displayName = moa.companyName;
  if (displayName.length > 200) {
    displayName = displayName.substring(0, 200) + '...';
  }
  
  const statusBadge = isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Expired</span>';
  const renewalBadge = isDueForRenewal ? '<span class="status-badge status-renewal">Due for Renewal</span>' : '';
  const collegeBadge = moa.college ? `<span class="status-badge college-badge college-${moa.college.toLowerCase()}">${moa.college}</span>` : '';
  const partnerTypeBadge = moa.partnerType ? `<span class="status-badge partner-badge partner-${moa.partnerType.toLowerCase().replace(' ', '-')}">${moa.partnerType}</span>` : '';

  infoCardContainer.innerHTML = `
    <div class="moa-card">
      <div class="moa-card-header">
        <div class="moa-header-content">
          <h3 class="moa-company-name">${escapeHtml(displayName)}</h3>
          <div class="badges-wrapper">
            <div class="category-badges">
              ${collegeBadge}
              ${partnerTypeBadge}
            </div>
            <div class="status-badges">
              ${renewalBadge}
              ${statusBadge}
            </div>
          </div>
        </div>
      </div>
      <div class="moa-card-body">
        <div class="moa-dates">
          <div class="date-item">
            <span class="date-label">Start Date:</span>
            <span class="date-value">${startDate}</span>
          </div>
          <div class="date-item">
            <span class="date-label">End Date:</span>
            <span class="date-value">${endDate}</span>
          </div>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">NOTES:</p>
          <p style="color: var(--text-primary); line-height: 1.5; margin: 0;">${escapeHtml(moa.notes || 'No notes added')}</p>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <p style="font-weight: 600; margin-bottom: 0.25rem;">PDF FILE:</p>
              <p style="color: var(--text-primary); word-break: break-word;">${escapeHtml(moa.pdfOriginalName)}</p>
            </div>
            <div>
              <p style="font-weight: 600; margin-bottom: 0.25rem;">FILE SIZE:</p>
              <p style="color: var(--text-primary);">${moa.pdfFileSize}</p>
            </div>
          </div>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
            <p style="font-weight: 600; margin-bottom: 0.25rem;">UPLOADED:</p>
            <p style="color: var(--text-primary);">${uploadDate}</p>
          </div>
        </div>
      </div>
      <div class="moa-card-footer">
        <div class="moa-actions">
          <button class="btn-icon btn-edit-info" data-id="${moa.id}" title="Edit Details">✏️ Edit</button>
          <button class="btn-icon btn-open-info" data-id="${moa.id}" title="Open PDF">🖨️ Open PDF</button>
          <button class="btn-icon btn-delete-info" data-id="${moa.id}" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `;

  // Add event listeners for the action buttons in modal
  const editBtn = infoCardContainer.querySelector('.btn-edit-info');
  editBtn.addEventListener('click', () => {
    closeInfoModal();
    openDetailsModal(moa.id);
  });

  const openPdfBtn = infoCardContainer.querySelector('.btn-open-info');
  openPdfBtn.addEventListener('click', () => {
    closeInfoModal();
    handleOpenPDF(moa.id);
  });

  const deleteBtn = infoCardContainer.querySelector('.btn-delete-info');
  deleteBtn.addEventListener('click', () => {
    closeInfoModal();
    handleDeleteMOA(moa.id);
  });

  infoModal.style.display = 'flex';
}

function closeInfoModal() {
  infoModal.style.display = 'none';
  infoCardContainer.innerHTML = '';
}

function closeModal() {
  detailModal.style.display = 'none';
  currentMetadataMOAId = null;
}

function showLoading(show) {
  loadingSpinner.style.display = show ? 'block' : 'none';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function toggleSettingsPanel() {
  settingsPanel.classList.toggle('open');
  settingsToggleBtn.classList.toggle('open');
  container.classList.toggle('settings-open');
}

console.log('👋 MOA Management System loaded!');
