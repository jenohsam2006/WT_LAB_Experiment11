/**
 * EduCourse Portal - Frontend JavaScript
 * Experiment 11: Database Integration in Node.js Application Using MongoDB
 */

// State management
let allStudents = [];
let studentToDeleteId = null;

// DOM Elements
const dbStatusPill = document.getElementById('dbStatusPill');
const dbStatusDot = document.getElementById('dbStatusDot');
const dbStatusText = document.getElementById('dbStatusText');
const heroStudentCount = document.getElementById('heroStudentCount');
const statTotalStudents = document.getElementById('statTotalStudents');

const studentRegistrationForm = document.getElementById('studentRegistrationForm');
const btnSubmitRegistration = document.getElementById('btnSubmitRegistration');
const btnSubmitText = document.getElementById('btnSubmitText');
const submitSpinner = document.getElementById('submitSpinner');

const studentsTableBody = document.getElementById('studentsTableBody');
const emptyStudentsState = document.getElementById('emptyStudentsState');
const dashboardSearch = document.getElementById('dashboardSearch');
const courseFilter = document.getElementById('courseFilter');
const btnRefreshStudents = document.getElementById('btnRefreshStudents');

// Modals
const editModal = document.getElementById('editModal');
const editStudentForm = document.getElementById('editStudentForm');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelEdit = document.getElementById('btnCancelEdit');

const deleteModal = document.getElementById('deleteModal');
const deleteStudentName = document.getElementById('deleteStudentName');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

// Mobile Nav
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// ====================================================
// INITIALIZATION
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default enrollment date to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('enrollmentDate');
  if (dateInput) dateInput.value = today;

  // Initialize data and listeners
  checkDatabaseHealth();
  fetchStudents();
  setupEventListeners();
});

// ====================================================
// EVENT LISTENERS SETUP
// ====================================================
function setupEventListeners() {
  // Mobile menu toggle
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Course cards "Enroll Now" buttons
  document.querySelectorAll('.btn-enroll-now').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const courseName = e.currentTarget.getAttribute('data-course');
      const courseSelect = document.getElementById('studentCourse');
      if (courseSelect && courseName) {
        courseSelect.value = courseName;
      }
      const registerSection = document.getElementById('register');
      if (registerSection) {
        registerSection.scrollIntoView({ behavior: 'smooth' });
      }
      const nameInput = document.getElementById('studentName');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 500);
      }
    });
  });

  // Registration Form Submission (CREATE - insertOne)
  if (studentRegistrationForm) {
    studentRegistrationForm.addEventListener('submit', handleStudentRegistration);
  }

  // Dashboard Filters & Search (READ)
  if (dashboardSearch) {
    dashboardSearch.addEventListener('input', applyFilters);
  }
  if (courseFilter) {
    courseFilter.addEventListener('change', applyFilters);
  }
  if (btnRefreshStudents) {
    btnRefreshStudents.addEventListener('click', () => {
      fetchStudents(true);
    });
  }

  // Edit Modal Event Handlers (UPDATE - updateOne & $set)
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeEditModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditModal);
  if (editStudentForm) editStudentForm.addEventListener('submit', handleStudentUpdate);

  // Delete Modal Event Handlers (DELETE - deleteOne)
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
  if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', handleStudentDelete);

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
    if (e.target === deleteModal) closeDeleteModal();
  });
}

// ====================================================
// TOAST NOTIFICATIONS
// ====================================================
function showToast(message, type = 'info', title = '') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-solid fa-circle-info';
  let defaultTitle = 'Notification';
  if (type === 'success') {
    iconClass = 'fa-solid fa-circle-check';
    defaultTitle = 'Success';
  } else if (type === 'error') {
    iconClass = 'fa-solid fa-circle-exclamation';
    defaultTitle = 'Error';
  }

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-body">
      <div class="toast-title">${title || defaultTitle}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => toast.remove());

  toastContainer.appendChild(toast);

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ====================================================
// DATABASE HEALTH CHECK
// ====================================================
async function checkDatabaseHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    if (data.status === 'connected') {
      dbStatusDot.className = 'status-dot connected';
      dbStatusText.textContent = `MongoDB: Connected (${data.database}.${data.collection})`;
      dbStatusPill.title = `Host: 127.0.0.1:27017 | Database: ${data.database}`;
    } else {
      dbStatusDot.className = 'status-dot error';
      dbStatusText.textContent = 'MongoDB: Disconnected';
      showToast('MongoDB is disconnected. Please start local MongoDB server on port 27017.', 'error', 'Database Offline');
    }
  } catch (err) {
    dbStatusDot.className = 'status-dot error';
    dbStatusText.textContent = 'Server Unreachable';
  }
}

// ====================================================
// CRUD: READ ALL STUDENTS (GET /api/students)
// ====================================================
async function fetchStudents(showFeedback = false) {
  try {
    const res = await fetch('/api/students');
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      allStudents = result.data;
      updateStats(allStudents.length);
      applyFilters();
      if (showFeedback) {
        showToast(`Retrieved ${allStudents.length} student records from MongoDB.`, 'success', 'Data Refreshed');
      }
    } else {
      studentsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="color: var(--danger); padding: 2rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${result.error || 'Failed to load records from MongoDB'}
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Fetch students error:', error);
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--danger); padding: 2rem;">
          <i class="fa-solid fa-circle-exclamation"></i> Network error fetching students. Ensure server is active.
        </td>
      </tr>
    `;
  }
}

// ====================================================
// UPDATE STATS COUNTERS
// ====================================================
function updateStats(count) {
  if (heroStudentCount) heroStudentCount.textContent = count;
  if (statTotalStudents) statTotalStudents.textContent = count;
}

// ====================================================
// FILTER AND RENDER STUDENTS TABLE
// ====================================================
function applyFilters() {
  const query = dashboardSearch ? dashboardSearch.value.trim().toLowerCase() : '';
  const selectedCourse = courseFilter ? courseFilter.value : 'ALL';

  const filtered = allStudents.filter(student => {
    const matchQuery = !query || 
      (student.name && student.name.toLowerCase().includes(query)) ||
      (student.email && student.email.toLowerCase().includes(query)) ||
      (student.phone && student.phone.toLowerCase().includes(query)) ||
      (student.course && student.course.toLowerCase().includes(query));

    const matchCourse = (selectedCourse === 'ALL') || (student.course === selectedCourse);

    return matchQuery && matchCourse;
  });

  renderStudentsTable(filtered);
}

function renderStudentsTable(students) {
  if (!studentsTableBody) return;

  if (students.length === 0) {
    studentsTableBody.innerHTML = '';
    if (emptyStudentsState) {
      emptyStudentsState.classList.remove('d-none');
    }
    return;
  }

  if (emptyStudentsState) {
    emptyStudentsState.classList.add('d-none');
  }

  studentsTableBody.innerHTML = students.map((student, index) => {
    const initials = student.name
      ? student.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'ST';

    const safeId = student._id;
    const enrollDate = student.enrollmentDate || (student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A');

    return `
      <tr data-id="${safeId}">
        <td><strong>#${index + 1}</strong></td>
        <td>
          <div class="student-name-cell">
            <div class="student-avatar">${escapeHtml(initials)}</div>
            <div class="student-info-text">
              <strong>${escapeHtml(student.name || 'Unnamed')}</strong>
              <span class="student-id-badge" title="MongoDB ObjectId">ID: ${escapeHtml(String(safeId))}</span>
            </div>
          </div>
        </td>
        <td>
          <div><i class="fa-regular fa-envelope text-primary"></i> ${escapeHtml(student.email || 'N/A')}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-phone"></i> ${escapeHtml(student.phone || 'N/A')}</div>
        </td>
        <td>
          <span class="badge-course">${escapeHtml(student.course || 'Unassigned')}</span>
        </td>
        <td>
          <span class="badge-mode">${escapeHtml(student.learningMode || 'Online Live')}</span>
        </td>
        <td>
          <i class="fa-regular fa-calendar"></i> ${escapeHtml(enrollDate)}
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-action btn-edit" onclick="openEditModal('${safeId}')" title="Modify Course Details (updateOne & $set)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-action btn-delete" onclick="openDeleteModal('${safeId}', '${escapeHtml(student.name || 'Student')}')" title="Delete Student Record (deleteOne)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ====================================================
// CRUD: CREATE STUDENT (POST /api/students)
// ====================================================
async function handleStudentRegistration(e) {
  e.preventDefault();

  const nameInput = document.getElementById('studentName');
  const emailInput = document.getElementById('studentEmail');
  const phoneInput = document.getElementById('studentPhone');
  const courseInput = document.getElementById('studentCourse');
  const modeInput = document.getElementById('learningMode');
  const dateInput = document.getElementById('enrollmentDate');
  const notesInput = document.getElementById('studentNotes');

  // Clear previous validation styling
  [nameInput, emailInput, phoneInput, courseInput].forEach(inp => {
    if (inp) inp.classList.remove('is-invalid');
  });

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const course = courseInput.value;
  const learningMode = modeInput ? modeInput.value : 'Online Live';
  const enrollmentDate = dateInput ? dateInput.value : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  // Validation
  let hasError = false;
  if (!name) {
    nameInput.classList.add('is-invalid');
    document.getElementById('nameError').textContent = 'Please enter student full name.';
    hasError = true;
  } else {
    document.getElementById('nameError').textContent = '';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    emailInput.classList.add('is-invalid');
    document.getElementById('emailError').textContent = 'Please enter a valid email address.';
    hasError = true;
  } else {
    document.getElementById('emailError').textContent = '';
  }

  if (!phone) {
    phoneInput.classList.add('is-invalid');
    document.getElementById('phoneError').textContent = 'Please enter contact phone number.';
    hasError = true;
  } else {
    document.getElementById('phoneError').textContent = '';
  }

  if (!course) {
    courseInput.classList.add('is-invalid');
    document.getElementById('courseError').textContent = 'Please choose a course.';
    hasError = true;
  } else {
    document.getElementById('courseError').textContent = '';
  }

  if (hasError) {
    showToast('Please fix required fields highlighted in red.', 'error', 'Validation Failed');
    return;
  }

  // Set loading state
  btnSubmitRegistration.disabled = true;
  btnSubmitRegistration.classList.add('loading');
  btnSubmitText.textContent = 'Saving to MongoDB...';

  try {
    const payload = { name, email, phone, course, learningMode, enrollmentDate, notes };
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast(`Student registered successfully with MongoDB ID: ${result.studentId}`, 'success', 'MongoDB insertOne() Succeeded');
      studentRegistrationForm.reset();
      // Reset default date
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      // Refresh list
      await fetchStudents();
      // Scroll smoothly to dashboard
      const dashboardSection = document.getElementById('dashboard');
      if (dashboardSection) {
        dashboardSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      showToast(result.error || 'Failed to save student record.', 'error', 'Registration Error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Failed to connect to server. Check MongoDB connection.', 'error', 'Network Error');
  } finally {
    btnSubmitRegistration.disabled = false;
    btnSubmitRegistration.classList.remove('loading');
    btnSubmitText.textContent = 'Register Student (Save to MongoDB)';
  }
}

// ====================================================
// CRUD: UPDATE STUDENT (PUT /api/students/:id)
// ====================================================
window.openEditModal = function(id) {
  const student = allStudents.find(s => String(s._id) === String(id));
  if (!student) {
    showToast('Student record not found.', 'error');
    return;
  }

  document.getElementById('editStudentId').value = student._id;
  document.getElementById('editStudentName').value = student.name || '';
  document.getElementById('editStudentEmail').value = student.email || '';
  document.getElementById('editStudentPhone').value = student.phone || '';
  document.getElementById('editStudentCourse').value = student.course || '';
  document.getElementById('editLearningMode').value = student.learningMode || 'Online Live';
  document.getElementById('editEnrollmentDate').value = student.enrollmentDate || '';

  editModal.classList.remove('d-none');
};

function closeEditModal() {
  if (editModal) editModal.classList.add('d-none');
}

async function handleStudentUpdate(e) {
  e.preventDefault();

  const id = document.getElementById('editStudentId').value;
  const name = document.getElementById('editStudentName').value.trim();
  const email = document.getElementById('editStudentEmail').value.trim();
  const phone = document.getElementById('editStudentPhone').value.trim();
  const course = document.getElementById('editStudentCourse').value;
  const learningMode = document.getElementById('editLearningMode').value;
  const enrollmentDate = document.getElementById('editEnrollmentDate').value;

  if (!id || !name || !email || !course) {
    showToast('Name, Email, and Course are required.', 'error');
    return;
  }

  const btnSaveEdit = document.getElementById('btnSaveEdit');
  btnSaveEdit.disabled = true;
  btnSaveEdit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating in MongoDB...';

  try {
    const payload = { name, email, phone, course, learningMode, enrollmentDate };
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Student course details updated in MongoDB successfully via updateOne().', 'success', 'Update Complete');
      closeEditModal();
      await fetchStudents();
    } else {
      showToast(result.error || 'Failed to update student details.', 'error');
    }
  } catch (error) {
    console.error('Update student error:', error);
    showToast('Network error while updating record.', 'error');
  } finally {
    btnSaveEdit.disabled = false;
    btnSaveEdit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Details (MongoDB $set)';
  }
}

// ====================================================
// CRUD: DELETE STUDENT (DELETE /api/students/:id)
// ====================================================
window.openDeleteModal = function(id, name) {
  studentToDeleteId = id;
  if (deleteStudentName) deleteStudentName.textContent = `"${name}"`;
  if (deleteModal) deleteModal.classList.remove('d-none');
};

function closeDeleteModal() {
  studentToDeleteId = null;
  if (deleteModal) deleteModal.classList.add('d-none');
}

async function handleStudentDelete() {
  if (!studentToDeleteId) return;

  btnConfirmDelete.disabled = true;
  btnConfirmDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

  try {
    const res = await fetch(`/api/students/${studentToDeleteId}`, {
      method: 'DELETE'
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Student record deleted from MongoDB successfully via deleteOne().', 'success', 'Record Deleted');
      closeDeleteModal();
      await fetchStudents();
    } else {
      showToast(result.error || 'Failed to delete student.', 'error');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Network error while deleting record.', 'error');
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Record';
  }
}

// ====================================================
// UTILITY: ESCAPE HTML
// ====================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

