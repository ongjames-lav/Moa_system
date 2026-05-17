// API Configuration
let API_URL = import.meta.env.VITE_API_URL || '/api';
if (API_URL.includes('onrender.com') || window.location.hostname.includes('vercel.app')) {
  API_URL = '/api';
}

// State
const token = localStorage.getItem('authToken');
let user = null;
let studentsData = [];
let currentStatusFilter = 'all';

// DOM Elements
const userDisplay = document.getElementById('userDisplay');
const moaDirectoryBtn = document.getElementById('moaDirectoryBtn');
const logoutBtn = document.getElementById('logoutBtn');
const filterButtons = document.querySelectorAll('.status-filter-btn');
const pendingCountBadge = document.getElementById('pendingCountBadge');
const totalStudentsCount = document.getElementById('totalStudentsCount');
const approvedStudentsCount = document.getElementById('approvedStudentsCount');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.getElementById('tableContainer');
const approvalsTableBody = document.getElementById('approvalsTableBody');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    window.location.href = '/';
    return;
  }

  const success = await checkAuth();
  if (!success) {
    window.location.href = '/';
    return;
  }

  setupEventListeners();
  loadStudents();
});

async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      user = await response.json();
      if (user.role !== 'admin') {
        showNotification('Access denied: Administrator privileges required.', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return false;
      }
      userDisplay.textContent = user.username;
      return true;
    }
    return false;
  } catch (err) {
    console.error('Auth check failed:', err);
    return false;
  }
}

function setupEventListeners() {
  moaDirectoryBtn.addEventListener('click', () => {
    window.location.href = '/';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatusFilter = btn.dataset.status;
      renderStudents();
    });
  });
}

async function loadStudents() {
  loadingSpinner.style.display = 'block';
  emptyState.style.display = 'none';
  tableContainer.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/auth/users/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student accounts');
    }

    studentsData = await response.json();
    loadingSpinner.style.display = 'none';

    updateStatistics();
    renderStudents();
  } catch (err) {
    loadingSpinner.style.display = 'none';
    showNotification(err.message, 'error');
  }
}

function updateStatistics() {
  const pendingCount = studentsData.filter(s => s.approval_status === 'pending').length;
  const approvedCount = studentsData.filter(s => s.approval_status === 'approved').length;

  totalStudentsCount.textContent = studentsData.length;
  approvedStudentsCount.textContent = approvedCount;

  if (pendingCountBadge) {
    pendingCountBadge.textContent = pendingCount;
    pendingCountBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

function renderStudents() {
  approvalsTableBody.innerHTML = '';

  const filtered = studentsData.filter(student => {
    if (currentStatusFilter === 'all') return true;
    return student.approval_status === currentStatusFilter;
  });

  if (filtered.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tableContainer.style.display = 'block';

  filtered.forEach(student => {
    const tr = document.createElement('tr');

    let statusHtml = '';
    if (student.approval_status === 'pending') {
      statusHtml = `<span class="status-badge pending"><i class="fas fa-user-clock"></i> Pending</span>`;
    } else if (student.approval_status === 'approved') {
      statusHtml = `<span class="status-badge approved"><i class="fas fa-user-check"></i> Approved</span>`;
    } else {
      statusHtml = `<span class="status-badge declined"><i class="fas fa-user-times"></i> Declined</span>`;
    }

    let actionsHtml = '';
    if (student.approval_status === 'pending') {
      actionsHtml = `
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm approve-btn" data-id="${student.id}" style="padding: 6px 12px; font-size: 0.85rem;"><i class="fas fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm decline-btn" data-id="${student.id}" style="padding: 6px 12px; font-size: 0.85rem;"><i class="fas fa-times"></i> Decline</button>
        </div>
      `;
    } else {
      actionsHtml = `<span style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">No actions available</span>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHtml(student.username)}</strong></td>
      <td>${escapeHtml(student.email)}</td>
      <td><code style="background: var(--bg-surface-hover); padding: 4px 8px; border-radius: 4px;">${escapeHtml(student.student_id || 'N/A')}</code></td>
      <td>${formatDate(student.created_at)}</td>
      <td>${statusHtml}</td>
      <td style="text-align: right;">${actionsHtml}</td>
    `;

    if (student.approval_status === 'pending') {
      tr.querySelector('.approve-btn').addEventListener('click', async () => {
        await handleApprovalAction(student.id, 'approve');
      });
      tr.querySelector('.decline-btn').addEventListener('click', async () => {
        await handleApprovalAction(student.id, 'decline');
      });
    }

    approvalsTableBody.appendChild(tr);
  });
}

async function handleApprovalAction(userId, action) {
  try {
    const response = await fetch(`${API_URL}/auth/users/${userId}/${action}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Failed to ${action} user`);
    }

    showNotification(`Student account successfully ${action}d.`, 'success');
    
    // Update local state directly
    const studentIndex = studentsData.findIndex(s => s.id === userId);
    if (studentIndex !== -1) {
      studentsData[studentIndex].approval_status = action === 'approve' ? 'approved' : 'declined';
      studentsData[studentIndex].role = action === 'approve' ? 'student' : studentsData[studentIndex].role;
    }

    updateStatistics();
    renderStudents();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function showNotification(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  container.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
