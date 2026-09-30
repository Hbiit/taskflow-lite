/**
 * Taskflow Lite — Ultra-Lightweight Smart Todo Logic
 * Features: Drag-and-drop, Reminders, Recurrence, Filters, Local Storage, JSON Backup
 */

(function () {
  'use strict';

  // --- Constants & Storage ---
  const STORAGE_KEY = 'taskflow_lite_todos_v1';

  // Default sample tasks if storage is empty
  const DEFAULT_TODOS = [
    {
      id: 'task-1',
      title: 'Welcome to Taskflow Lite! 🚀',
      description: 'Zero dependencies, fast, and deploys anywhere in 1 click.',
      category: 'General',
      priority: 'high',
      completed: false,
      completed_at: null,
      reminder_at: null,
      recurrence: 'none',
      position: 1024,
      created_at: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Try Drag & Drop reordering ⠿',
      description: 'Grab the grip handle on the left and drag items to rearrange your priorities.',
      category: 'Work',
      priority: 'medium',
      completed: false,
      completed_at: null,
      reminder_at: null,
      recurrence: 'none',
      position: 2048,
      created_at: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Test scheduled reminder and audio chime',
      description: 'Click the pencil icon to set a reminder 1 minute ahead to see desktop and toast alerts.',
      category: 'Study',
      priority: 'low',
      completed: false,
      completed_at: null,
      reminder_at: new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16),
      recurrence: 'daily',
      position: 3072,
      created_at: new Date().toISOString()
    }
  ];

  // --- State ---
  let todos = loadTodos();
  let currentFilter = 'all'; // all, active, completed, scheduled
  let currentCategory = 'all'; // all, Work, Personal, etc.
  let currentSearch = '';
  const triggeredReminders = new Set();
  let draggedTaskId = null;

  // --- DOM Elements ---
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const taskForm = document.getElementById('taskForm');
  const taskTitle = document.getElementById('taskTitle');
  const taskDesc = document.getElementById('taskDesc');
  const taskCategory = document.getElementById('taskCategory');
  const taskPriority = document.getElementById('taskPriority');
  const taskReminder = document.getElementById('taskReminder');
  const taskRecurrence = document.getElementById('taskRecurrence');
  const taskDetailsDrawer = document.getElementById('taskDetailsDrawer');

  // Stats
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressRatio = document.getElementById('progressRatio');
  const totalCountEl = document.getElementById('totalCount');
  const activeCountEl = document.getElementById('activeCount');
  const completedCountEl = document.getElementById('completedCount');
  const scheduledCountEl = document.getElementById('scheduledCount');

  // Filters & Search
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const categoryChips = document.querySelectorAll('.cat-chip');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');

  // Actions
  const notifyBtn = document.getElementById('notifyBtn');
  const notifyBtnText = document.getElementById('notifyBtnText');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');

  // Modal
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editTaskId = document.getElementById('editTaskId');
  const editTitle = document.getElementById('editTitle');
  const editDesc = document.getElementById('editDesc');
  const editCategory = document.getElementById('editCategory');
  const editPriority = document.getElementById('editPriority');
  const editReminder = document.getElementById('editReminder');
  const editRecurrence = document.getElementById('editRecurrence');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');

  // Toast
  const toastContainer = document.getElementById('toastContainer');

  // --- Persistence ---
  function loadTodos() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_TODOS;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return DEFAULT_TODOS;
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
    render();
  }

  // --- Web Audio Chime (Zero External Audio File) ---
  function playReminderChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(587.33, 0, 0.25); // D5
      playTone(880.00, 0.12, 0.4); // A5
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // --- Notifications Helper ---
  function updateNotifyButtonState() {
    if (!('Notification' in window)) {
      notifyBtn.style.display = 'none';
      return;
    }
    if (Notification.permission === 'granted') {
      notifyBtnText.textContent = 'Alerts On';
      notifyBtn.style.color = '#34d399';
    } else if (Notification.permission === 'denied') {
      notifyBtnText.textContent = 'Alerts Blocked';
      notifyBtn.style.color = '#f87171';
    } else {
      notifyBtnText.textContent = 'Enable Alerts';
      notifyBtn.style.color = '';
    }
  }

  notifyBtn.addEventListener('click', () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(() => {
        updateNotifyButtonState();
        if (Notification.permission === 'granted') {
          showToast('Notifications enabled!', 'You will receive desktop alerts for scheduled tasks.');
        }
      });
    }
  });

  function showToast(title, message) {
    playReminderChime();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <div class="toast-body">
        <div class="toast-title">${escapeHTML(title)}</div>
        <div class="toast-desc">${escapeHTML(message)}</div>
      </div>
      <button class="toast-close" title="Dismiss">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    toastContainer.appendChild(toast);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 6000);

    // Browser Native Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>'
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }

  // --- Task Recurrence Logic ---
  function computeNextRecurrenceDate(baseDateStr, recurrence) {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const next = new Date(base.getTime());

    if (recurrence === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (recurrence === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (recurrence === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString().slice(0, 16);
  }

  function handleRecurringSpawn(todo) {
    if (!todo.recurrence || todo.recurrence === 'none') return;

    const nextReminder = computeNextRecurrenceDate(todo.reminder_at, todo.recurrence);
    const maxPos = todos.reduce((max, t) => Math.max(max, t.position || 0), 0);

    const recurringTask = {
      id: 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: todo.title,
      description: todo.description,
      category: todo.category,
      priority: todo.priority,
      completed: false,
      completed_at: null,
      reminder_at: nextReminder,
      recurrence: todo.recurrence,
      position: maxPos + 1024,
      created_at: new Date().toISOString()
    };

    todos.push(recurringTask);
    showToast(`Recurring task repeated: "${todo.title}"`, `Next occurrence scheduled for ${nextReminder.replace('T', ' ')}.`);
  }

  // --- Task Form Submission ---
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) return;

    const maxPos = todos.reduce((max, t) => Math.max(max, t.position || 0), 0);

    const newTodo = {
      id: 'task-' + Date.now(),
      title: title,
      description: taskDesc.value.trim(),
      category: taskCategory.value,
      priority: taskPriority.value,
      completed: false,
      completed_at: null,
      reminder_at: taskReminder.value ? taskReminder.value : null,
      recurrence: taskRecurrence.value,
      position: maxPos + 1024,
      created_at: new Date().toISOString()
    };

    todos.unshift(newTodo); // Add to top visually
    saveTodos();

    // Reset Form
    taskTitle.value = '';
    taskDesc.value = '';
    taskReminder.value = '';
    taskRecurrence.value = 'none';
    taskDetailsDrawer.removeAttribute('open');
    taskTitle.focus();
  });

  // --- Toggle Completion ---
  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    if (todo.completed) {
      todo.completed_at = new Date().toISOString();
      handleRecurringSpawn(todo);
    } else {
      todo.completed_at = null;
    }
    saveTodos();
  }

  // --- Delete Todo ---
  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
  }

  // --- Edit Modal Logic ---
  function openEditModal(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    editTaskId.value = todo.id;
    editTitle.value = todo.title;
    editDesc.value = todo.description || '';
    editCategory.value = todo.category || 'General';
    editPriority.value = todo.priority || 'medium';
    editReminder.value = todo.reminder_at || '';
    editRecurrence.value = todo.recurrence || 'none';

    editModal.style.display = 'grid';
    editTitle.focus();
  }

  function closeEditModal() {
    editModal.style.display = 'none';
  }

  modalCloseBtn.addEventListener('click', closeEditModal);
  modalCancelBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editTaskId.value;
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    todo.title = editTitle.value.trim();
    todo.description = editDesc.value.trim();
    todo.category = editCategory.value;
    todo.priority = editPriority.value;
    todo.reminder_at = editReminder.value || null;
    todo.recurrence = editRecurrence.value;

    closeEditModal();
    saveTodos();
  });

  // --- Search & Filters ---
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
    render();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearch = '';
    clearSearchBtn.style.display = 'none';
    render();
    searchInput.focus();
  });

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.status;
      render();
    });
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      categoryChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.cat;
      render();
    });
  });

  clearCompletedBtn.addEventListener('click', () => {
    if (confirm('Clear all completed tasks?')) {
      todos = todos.filter((t) => !t.completed);
      saveTodos();
    }
  });

  // --- JSON Backup & Restore ---
  exportBtn.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(todos, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    dlAnchor.remove();
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          todos = imported;
          saveTodos();
          showToast('Tasks restored successfully!', `Imported ${imported.length} tasks from backup file.`);
        } else {
          alert('Invalid backup file format: Root item must be an array of tasks.');
        }
      } catch (err) {
        alert('Could not parse JSON file: ' + err.message);
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  // --- Drag and Drop Handlers ---
  function handleDragStart(e) {
    draggedTaskId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetCard = e.currentTarget;
    if (targetCard && targetCard.dataset.id !== draggedTaskId) {
      targetCard.classList.add('drag-over');
    }
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.stopPropagation();
    const targetCard = e.currentTarget;
    targetCard.classList.remove('drag-over');

    const targetId = targetCard.dataset.id;
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const fromIdx = todos.findIndex((t) => t.id === draggedTaskId);
    const toIdx = todos.findIndex((t) => t.id === targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const [movedItem] = todos.splice(fromIdx, 1);
      todos.splice(toIdx, 0, movedItem);

      // Re-assign positions
      todos.forEach((t, i) => {
        t.position = (i + 1) * 1024;
      });

      saveTodos();
    }
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach((card) => {
      card.classList.remove('drag-over');
    });
  }

  // --- Real-time Reminder Checker (Every 4 seconds) ---
  setInterval(() => {
    const now = new Date();
    let remindersChanged = false;

    todos.forEach((todo) => {
      if (!todo.completed && todo.reminder_at) {
        const reminderTime = new Date(todo.reminder_at);
        if (now >= reminderTime && !triggeredReminders.has(todo.id)) {
          triggeredReminders.add(todo.id);
          remindersChanged = true;
          showToast(`⏰ Task Reminder: ${todo.title}`, todo.description || 'Time to complete this task!');
        }
      }
    });

    if (remindersChanged) {
      render();
    }
  }, 4000);

  // --- Render Function ---
  function render() {
    // 1. Stats calculation
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const scheduled = todos.filter((t) => !t.completed && t.reminder_at).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalCountEl.textContent = total;
    activeCountEl.textContent = active;
    completedCountEl.textContent = completed;
    scheduledCountEl.textContent = scheduled;

    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
    progressRatio.textContent = `${completed} of ${total} tasks done`;

    clearCompletedBtn.style.display = completed > 0 ? 'inline-block' : 'none';

    // 2. Filter & Search application
    let filtered = [...todos];

    // Status filter
    if (currentFilter === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    } else if (currentFilter === 'scheduled') {
      filtered = filtered.filter((t) => !t.completed && t.reminder_at);
    }

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === currentCategory);
    }

    // Search query
    if (currentSearch) {
      filtered = filtered.filter((t) => {
        const titleMatch = t.title && t.title.toLowerCase().includes(currentSearch);
        const descMatch = t.description && t.description.toLowerCase().includes(currentSearch);
        return titleMatch || descMatch;
      });
    }

    // 3. Render List
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';

      const now = new Date();

      filtered.forEach((todo) => {
        const li = document.createElement('li');
        li.className = `task-card ${todo.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.id = todo.id;

        // Reminder Status formatting
        let reminderBadge = '';
        if (todo.reminder_at) {
          const rDate = new Date(todo.reminder_at);
          const isOverdue = !todo.completed && now > rDate;
          const displayStr = rDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          reminderBadge = `
            <span class="badge badge-reminder ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Overdue!' : 'Upcoming'}">
              ⏰ ${displayStr} ${isOverdue ? '(Due)' : ''}
            </span>
          `;
        }

        // Recurrence badge
        let recurrenceBadge = '';
        if (todo.recurrence && todo.recurrence !== 'none') {
          recurrenceBadge = `<span class="badge badge-recurrence">🔁 ${todo.recurrence}</span>`;
        }

        li.innerHTML = `
          <div class="drag-handle" title="Drag to reorder">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <circle cx="9" cy="6" r="1.75"></circle>
              <circle cx="15" cy="6" r="1.75"></circle>
              <circle cx="9" cy="12" r="1.75"></circle>
              <circle cx="15" cy="12" r="1.75"></circle>
              <circle cx="9" cy="18" r="1.75"></circle>
              <circle cx="15" cy="18" r="1.75"></circle>
            </svg>
          </div>

          <div class="checkbox-container">
            <input type="checkbox" class="custom-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Toggle task completion">
          </div>

          <div class="task-content">
            <div class="task-title">${escapeHTML(todo.title)}</div>
            ${todo.description ? `<div class="task-desc">${escapeHTML(todo.description)}</div>` : ''}
            <div class="task-meta-row">
              <span class="badge badge-category">${escapeHTML(todo.category || 'General')}</span>
              <span class="badge priority-${todo.priority || 'medium'}">${capitalize(todo.priority || 'medium')}</span>
              ${reminderBadge}
              ${recurrenceBadge}
            </div>
          </div>

          <div class="task-actions">
            <button class="action-icon-btn edit-btn" title="Edit task" aria-label="Edit task">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="action-icon-btn delete-btn" title="Delete task" aria-label="Delete task">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        // Event Listeners on Card
        li.querySelector('.custom-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));

        // Drag and Drop listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        taskList.appendChild(li);
      });
    }
  }

  // --- Utility Helpers ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- Initialization ---
  updateNotifyButtonState();
  render();

})();
