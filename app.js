const STORAGE_KEY = "my-tasks-v1";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const totalCount = document.querySelector("#total-count");
const clearButton = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll(".filter")];

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((task) =>
      task && typeof task.id === "string" && typeof task.text === "string" &&
      typeof task.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    taskCount.textContent = "Unable to save — check your browser storage settings";
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function render() {
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });
  const remaining = tasks.filter((task) => !task.completed).length;

  list.replaceChildren();
  for (const task of visibleTasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.completed ? "Mark as active" : "Complete"}: ${task.text}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const removeButton = document.createElement("button");
    removeButton.className = "delete-button";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Delete: ${task.text}`);
    removeButton.title = "Delete task";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, text, removeButton);
    list.append(item);
  }

  const hasVisibleTasks = visibleTasks.length > 0;
  list.hidden = !hasVisibleTasks;
  emptyState.hidden = hasVisibleTasks;
  if (!hasVisibleTasks) {
    const messages = {
      all: ["A fresh start", "Add a task above and make today count."],
      active: ["All caught up", "There are no active tasks right now."],
      completed: ["Nothing completed yet", "Finish a task and it will show up here."],
    };
    [emptyTitle.textContent, emptyMessage.textContent] = messages[currentFilter];
  }

  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
  totalCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} total`;
  clearButton.disabled = !tasks.some((task) => task.completed);
}

function toggleTask(id) {
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: makeId(), text, completed: false });
  saveTasks();
  input.value = "";
  render();
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle("active", selected);
      filter.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

clearButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

render();
