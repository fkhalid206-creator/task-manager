// State initialized from localStorage or default empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskListBody = document.getElementById('task-list-body');
const emptyState = document.getElementById('empty-state');
const currentViewTitle = document.getElementById('current-view-title');

// Counter Elements
const totalTasksCount = document.getElementById('total-tasks-count');
const pendingTasksCount = document.getElementById('pending-tasks-count');
const completedTasksCount = document.getElementById('completed-tasks-count');

// Progress Elements
const progressPercentage = document.getElementById('progress-percentage');
const progressChart = document.getElementById('progress-chart');

// Navigation
const navItems = document.querySelectorAll('.nav-item');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskInput = document.getElementById('edit-task-input');
const editTaskId = document.getElementById('edit-task-id');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Export Button
const exportBtn = document.getElementById('export-btn');

// Initialization mapping on load
function init() {
    renderTasks();
    updateCountersFast(); // skip initial animation on load
    setupEventListeners();
}

// Helpers
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateCounters();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Rendering Logic
function renderTasks() {
    taskListBody.innerHTML = '';

    // Determine which tasks to show based on the active filter
    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => task.status === 'pending');
        currentViewTitle.textContent = 'Pending Tasks';
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.status === 'completed');
        currentViewTitle.textContent = 'Completed Tasks';
    } else {
        currentViewTitle.textContent = 'All Tasks';
    }

    // Toggle Empty State UI
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('task-table').classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        document.getElementById('task-table').classList.remove('hidden');

        // Populate the table rows
        filteredTasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.className = `task-row ${task.status === 'completed' ? 'completed-task' : ''}`;

            tr.innerHTML = `
                <td class="status-cell">
                    <div class="custom-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="toggleTaskStatus('${task.id}')" role="button" aria-label="Toggle status">
                    </div>
                </td>
                <td>
                    <div class="task-title">${escapeHTML(task.title)}</div>
                </td>
                <td class="task-date">${formatDate(task.createdAt)}</td>
                <td class="action-cell">
                    <div class="action-btns">
                        <button type="button" class="icon-btn edit-btn" onclick="openEditModal('${task.id}')" title="Edit Task">
                            ✏️
                        </button>
                        <button type="button" class="icon-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            taskListBody.appendChild(tr);
        });
    }
}

// Utility to sanitize HTML strings
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Update counters directly
function updateCountersFast() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;

    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    totalTasksCount.textContent = total;
    pendingTasksCount.textContent = pending;
    completedTasksCount.textContent = completed;
    progressPercentage.textContent = percentage;

    progressChart.style.background = `conic-gradient(var(--secondary-color) ${percentage}%, var(--border-color) 0%)`;
}

// Redirect saveTasks to use the robust fast updater
function updateCounters() {
    updateCountersFast();
}

// CRUD Operations
function addTask(e) {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const newTask = {
        id: generateId(),
        title,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask); // Place new task at the top
    saveTasks();
    renderTasks();
    taskInput.value = ''; // clear input

    // Switch view to 'all' or 'pending' if current filter hides the new task
    if (currentFilter === 'completed') {
        setFilter('all');
    }
}

// Expose these CRUD actions to window object for inline onclick usage in innerHTML
window.deleteTask = function (id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
};

window.toggleTaskStatus = function (id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                status: task.status === 'pending' ? 'completed' : 'pending'
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
};

// Edit Task Logic
window.openEditModal = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskInput.value = task.title;
    editModal.classList.remove('hidden');
    editTaskInput.focus();
};

function closeEditModal() {
    editModal.classList.add('hidden');
    editTaskId.value = '';
    editTaskInput.value = '';
}

function saveEditTask(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const newTitle = editTaskInput.value.trim();

    if (!id || !newTitle) return;

    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, title: newTitle };
        }
        return task;
    });

    saveTasks();
    renderTasks();
    closeEditModal();
}

// Filter Navigation Logic
function setFilter(filterType) {
    currentFilter = filterType;

    // Update navigation active state
    navItems.forEach(item => {
        if (item.dataset.filter === filterType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    renderTasks();
}

// Export Logic
function exportToCSV() {
    if (tasks.length === 0) {
        alert("No tasks to export.");
        return;
    }

    // Define CSV headers
    const headers = ['Task ID', 'Title', 'Status', 'Date Created'];

    // Format data rows
    const rows = tasks.map(task => {
        // Escape quotes in title
        const title = `"${task.title.replace(/"/g, '""')}"`;
        // Wrap date in quotes to prevent commas from breaking the CSV
        const dateStr = `"${new Date(task.createdAt).toLocaleString()}"`;
        return [task.id, title, task.status, dateStr];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    // Create a Blob with UTF-8 BOM so Excel opens it correctly
    // FIXED: REMOVED trailing semicolon from the MIME type config which blocked proper file registration on some Chrome setups
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Task_Manager_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Add a small delay robustly allowing the file operation to spawn fully on Windows before cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 200);
}

// Registration of Event Listeners
function setupEventListeners() {
    taskForm.addEventListener('submit', addTask);
    exportBtn.addEventListener('click', exportToCSV);

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            setFilter(item.dataset.filter);
        });
    });

    editTaskForm.addEventListener('submit', saveEditTask);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // Close edit modal on clicking background overlay
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
            closeEditModal();
        }
    });
}

// Trigger initialization on load
document.addEventListener('DOMContentLoaded', init);
