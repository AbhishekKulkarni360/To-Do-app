let filter = 'all';
let sortByDueDate = false;
let tasks = [];
let draggedId = null;

window.onload = function () {
  if (localStorage.getItem("tasks")) {
    tasks = JSON.parse(localStorage.getItem("tasks"));
  }

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }

  renderTasks();

  document.getElementById("addTaskBtn").addEventListener("click", addTask);
  document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
  document.getElementById("sortBtn").addEventListener("click", toggleSort);
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      setFilter(e.target.dataset.filter);
    });
  });
  document.getElementById("downloadPDFBtn").addEventListener("click", downloadPDF);
};

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("taskDueDate");

  const taskText = taskInput.value.trim();
  const dueDate = dueDateInput.value;

  if (taskText === "") {
    alert("Please enter a task.");
    return;
  }

  const newTask = {
    id: Date.now(),
    text: taskText,
    dueDate: dueDate || null,
    completed: false,
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskInput.value = "";
  dueDateInput.value = "";
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const sortBtn = document.getElementById("sortBtn");
  sortBtn.classList.toggle("btn-info", sortByDueDate);
  sortBtn.classList.toggle("btn-outline-info", !sortByDueDate);

  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const today = new Date().toISOString().slice(0, 10);

  let filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  if (sortByDueDate) {
    filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    if (task.completed) li.classList.add("completed");
    li.draggable = true;
    li.dataset.id = task.id;

    let dueDateClass = "";
    if (task.dueDate && !task.completed) {
      if (task.dueDate < today) dueDateClass = "overdue";
      else if (task.dueDate === today) dueDateClass = "due-today";
    }

    li.innerHTML = `
      <div class="form-check flex-grow-1">
        <input class="form-check-input me-2" type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleComplete(${task.id})" />
        <label class="form-check-label ${task.completed ? "completed" : ""}">
          <div>${task.text}</div>
          ${task.dueDate ? `<div class="task-due-date ${dueDateClass}">Due: ${task.dueDate}</div>` : ""}
        </label>
      </div>
      <div>
        <button class="btn btn-sm btn-secondary me-2" onclick="editTask(${task.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    taskList.appendChild(li);
  });
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newText = prompt("Edit task text:", task.text);
  if (newText !== null && newText.trim() !== "") {
    task.text = newText.trim();
  }

  const newDueDate = prompt("Edit due date (YYYY-MM-DD):", task.dueDate || "");
  if (newDueDate !== null) {
    if (newDueDate === "") {
      task.dueDate = null;
    } else {
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(newDueDate);
      if (isValidDate) {
        task.dueDate = newDueDate;
      } else {
        alert("Invalid date format. Please use YYYY-MM-DD.");
      }
    }
  }

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function setFilter(newFilter) {
  filter = newFilter;
  renderTasks();

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === newFilter);
  });
}

function toggleSort() {
  sortByDueDate = !sortByDueDate;
  renderTasks();
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// Drag & Drop Handlers
function handleDragStart(e) {
  draggedId = e.target.dataset.id;
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault();
  const target = e.target.closest("li");
  if (!target || target.dataset.id === draggedId) return;
  target.classList.add("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  const target = e.target.closest("li");
  if (!target || target.dataset.id === draggedId) return;

  const draggedIndex = tasks.findIndex(t => t.id == draggedId);
  const targetIndex = tasks.findIndex(t => t.id == target.dataset.id);

  const [movedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, movedTask);

  saveTasks();
  renderTasks();
}

function handleDragEnd(e) {
  draggedId = null;
  document.querySelectorAll(".list-group-item.drag-over").forEach(item => {
    item.classList.remove("drag-over");
  });
  e.target.classList.remove("dragging");
}

// Download PDF using jsPDF
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("To-Do List", 10, 20);

  let y = 30;
  const lineHeight = 10;
  const today = new Date().toISOString().slice(0, 10);

  tasks.forEach((task, idx) => {
    const status = task.completed ? "[✓]" : "[ ]";
    const due = task.dueDate ? `(Due: ${task.dueDate})` : "";
    const text = `${idx + 1}. ${status} ${task.text} ${due}`;

    if (y > 280) { // Page break
      doc.addPage();
      y = 20;
    }

    // Color by status
    if (task.completed) {
      doc.setTextColor(76, 175, 80); // green
    } else if (task.dueDate) {
      if (task.dueDate < today) {
        doc.setTextColor(229, 57, 53); // red
      } else if (task.dueDate === today) {
        doc.setTextColor(251, 192, 45); // yellow
      } else {
        doc.setTextColor(0, 0, 0); // black default
      }
    } else {
      doc.setTextColor(0, 0, 0);
    }

    doc.text(text, 10, y);
    y += lineHeight;
  });

  doc.save("todo-list.pdf");

  const toastEl = document.getElementById("pdfToast");
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
