import { dateKeys, profiles, taskStore } from './data.js';

const views = [...document.querySelectorAll('.view')];
const navigation = [...document.querySelectorAll('[data-view]')];
const bottomButtons = [...document.querySelectorAll('.bottom-nav [data-view]')];
const todoList = document.getElementById('todoList');
const taskDialog = document.getElementById('taskDialog');
const taskForm = document.getElementById('taskForm');
const wallTaskList = document.getElementById('wallTaskList');
const wallEventList = document.getElementById('wallEventList');
const calendarAgenda = document.getElementById('calendarAgenda');
const tomorrowPreview = document.getElementById('tomorrowPreview');
const dayStrip = document.getElementById('dayStrip');
const captureDialog = document.getElementById('captureDialog');
const captureForm = document.getElementById('captureForm');
const reviewDialog = document.getElementById('reviewDialog');
const reviewForm = document.getElementById('reviewForm');
let activeFilter = 'today';
let activeDate = dateKeys.today;
let editingTaskId = null;
let activeProposalId = null;
let adultUnlocked = false;
let adultGateContinuation = null;
const ADULT_GATE_KEY = 'family-assistant.adult-gate.v1';

function adultGateRecord() {
  try {
    return JSON.parse(localStorage.getItem(ADULT_GATE_KEY));
  } catch {
    return null;
  }
}

function hasAdultPin() {
  return Boolean(adultGateRecord()?.pinHash);
}

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function showView(id) {
  const target = document.getElementById(id);
  if (!target) return;
  views.forEach((view) => view.classList.toggle('active', view === target));
  bottomButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === id));
  document.body.classList.toggle('wall-mode', id === 'wall');
  if (id === 'wall' && hasAdultPin()) {
    adultUnlocked = false;
    renderAdultModeStatus();
  }
  document.title = `${target.querySelector('h2')?.textContent || 'Family Assistant'} · Family Assistant`;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderAdultModeStatus() {
  const status = document.getElementById('adultModeStatus');
  if (!hasAdultPin()) status.textContent = 'Not set up';
  else status.textContent = adultUnlocked ? 'Unlocked • tap to lock' : 'Locked';
}

function avatar(profileId) {
  const profile = profiles[profileId];
  const element = document.createElement('span');
  element.className = `avatar ${profile.className}`;
  element.textContent = profile.initials;
  element.title = profile.name;
  return element;
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderCurrentDate() {
  const today = parseDateKey(dateKeys.today);
  document.getElementById('topDate').textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(today).toUpperCase();
  const hour = new Date().getHours();
  document.getElementById('topGreeting').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, Emmeline`;
  document.getElementById('wallDay').textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(today);
  document.getElementById('wallWeekday').textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(today);
}

function renderDayStrip() {
  const today = parseDateKey(dateKeys.today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  dayStrip.replaceChildren();
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = formatDateKey(date);
    const button = document.createElement('button');
    button.dataset.date = key;
    button.classList.toggle('active', key === activeDate);
    const weekday = document.createElement('small');
    weekday.textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date).toUpperCase();
    button.append(weekday, String(date.getDate()));
    button.addEventListener('click', () => {
      activeDate = key;
      renderDayStrip();
      renderCalendar();
    });
    dayStrip.append(button);
  }
}

function beneficiaryLabel(ids) {
  if (!ids.length) return null;
  const label = document.createElement('i');
  label.className = 'beneficiary';
  label.textContent = `for ${ids.map((id) => profiles[id]?.marker || profiles[id]?.name).join(' + ')}`;
  return label;
}

function renderTasks() {
  const tasks = taskStore.getState().tasks.filter((task) =>
    activeFilter === 'completed' ? task.status === 'completed' : task.status === 'open' && task.bucket === activeFilter
  );
  todoList.replaceChildren();

  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('span');
    icon.textContent = '✓';
    const title = document.createElement('b');
    title.textContent = 'Nothing here right now';
    const detail = document.createElement('small');
    detail.textContent = 'You can add something or choose another list.';
    empty.append(icon, title, detail);
    todoList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.setAttribute('aria-label', `Complete ${task.title}`);
    checkbox.addEventListener('change', () => taskStore.setCompleted(task.id, checkbox.checked));

    const copy = document.createElement('span');
    const title = document.createElement('b');
    title.textContent = task.title;
    const marker = beneficiaryLabel(task.beneficiaryIds);
    if (marker) title.append(' ', marker);
    const details = document.createElement('small');
    details.textContent = [task.note, task.estimateMinutes ? `${task.estimateMinutes} min` : ''].filter(Boolean).join(' • ');
    copy.append(title, details);

    const assignees = document.createElement('span');
    assignees.className = 'assignee-stack';
    task.assigneeIds.forEach((id) => assignees.append(avatar(id)));
    const rowActions = document.createElement('span');
    rowActions.className = 'row-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'edit-task';
    edit.textContent = 'Change';
    edit.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openTaskDialog(task);
    });
    rowActions.append(assignees, edit);
    row.append(checkbox, copy, rowActions);
    todoList.append(row);
  });
}

function renderFocus() {
  const task = taskStore.getState().tasks.find((item) => item.status === 'open' && item.bucket === 'today' && item.assigneeIds.includes('emmeline'));
  const card = document.getElementById('todayFocus');
  if (!task) {
    document.getElementById('focusEstimate').textContent = 'TODAY';
    document.getElementById('focusTitle').textContent = 'Your immediate list is clear';
    document.getElementById('focusNote').textContent = 'Choose another list or add the next useful action.';
    document.getElementById('focusDone').hidden = true;
    delete card.dataset.taskId;
    return;
  }
  document.getElementById('focusEstimate').textContent = task.estimateMinutes ? `FIRST • ABOUT ${task.estimateMinutes} MIN` : 'FIRST';
  document.getElementById('focusTitle').textContent = task.title;
  document.getElementById('focusNote').textContent = task.note || 'One clear action to move the day forward.';
  document.getElementById('focusDone').hidden = false;
  card.dataset.taskId = task.id;
}

function renderTomorrowPreview() {
  const tasks = taskStore.getState().tasks.filter((task) => task.status === 'open' && task.bucket === 'tomorrow').slice(0, 3);
  tomorrowPreview.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-preview';
    empty.textContent = 'Nothing to prepare yet';
    tomorrowPreview.append(empty);
    return;
  }
  tasks.forEach((task) => {
    const row = document.createElement('div');
    row.className = 'task-line';
    const assignees = document.createElement('span');
    assignees.className = 'assignee-stack';
    task.assigneeIds.forEach((id) => assignees.append(avatar(id)));
    const copy = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = task.title;
    const marker = beneficiaryLabel(task.beneficiaryIds);
    if (marker) title.append(' ', marker);
    const note = document.createElement('small');
    note.textContent = task.note || 'Ready for tomorrow';
    copy.append(title, note);
    row.append(assignees, copy);
    tomorrowPreview.append(row);
  });
}

function renderWall() {
  const tasks = taskStore.getState().tasks.filter((task) => task.status === 'open' && task.bucket === 'today' && task.visibility === 'shared');
  wallTaskList.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No shared To-dos for today';
    wallTaskList.append(empty);
    return;
  }
  tasks.forEach((task) => {
    const row = document.createElement('article');
    row.className = 'wall-task';
    const copy = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = task.title;
    const marker = beneficiaryLabel(task.beneficiaryIds);
    if (marker) title.append(' ', marker);
    const note = document.createElement('small');
    note.textContent = task.note;
    copy.append(title, note);
    const assignees = document.createElement('span');
    assignees.className = 'assignee-stack';
    task.assigneeIds.forEach((id) => assignees.append(avatar(id)));
    row.append(copy, assignees);
    wallTaskList.append(row);
  });
}

function eventOwner(event) {
  return event.subjectIds[0] || event.participantIds[0] || 'family';
}

function participantNames(ids) {
  return ids.map((id) => profiles[id]?.name).filter(Boolean).join(' + ');
}

function renderCalendar() {
  const events = taskStore.getState().events.filter((event) => event.date === activeDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  calendarAgenda.replaceChildren();
  if (!events.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nothing planned for this day';
    calendarAgenda.append(empty);
    return;
  }
  events.forEach((event) => {
    const row = document.createElement('article');
    const time = document.createElement('time');
    time.textContent = event.startTime;
    const dot = document.createElement('span');
    const owner = eventOwner(event);
    dot.className = `dot ${profiles[owner]?.className || 'family-dot'}`;
    const copy = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = event.title;
    if (event.visibility === 'private') {
      const privacy = document.createElement('i');
      privacy.className = 'privacy-label';
      privacy.textContent = 'Private';
      title.append(' ', privacy);
    }
    const details = document.createElement('small');
    details.textContent = [participantNames(event.participantIds), event.note].filter(Boolean).join(' • ');
    copy.append(title, details);
    row.append(time, dot, copy);
    calendarAgenda.append(row);
  });
}

function renderWallEvents() {
  const events = taskStore.getState().events
    .filter((event) => event.date === dateKeys.today && event.visibility === 'shared')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  wallEventList.replaceChildren();
  events.forEach((event) => {
    const row = document.createElement('article');
    row.className = 'wall-event';
    const time = document.createElement('time');
    time.textContent = event.startTime;
    const copy = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = event.title;
    const details = document.createElement('small');
    details.textContent = [participantNames(event.participantIds), event.note].filter(Boolean).join(' • ');
    copy.append(title, details);
    row.append(time, copy);
    wallEventList.append(row);
  });
}

function pendingProposals() {
  return taskStore.getState().proposals.filter((proposal) => proposal.status === 'pending');
}

function renderReviewTray() {
  const count = pendingProposals().length;
  document.getElementById('reviewCount').textContent = count;
  document.getElementById('reviewTrayButton').hidden = count === 0;
}

function render() {
  renderTasks();
  renderFocus();
  renderTomorrowPreview();
  renderWall();
  renderCalendar();
  renderWallEvents();
  renderReviewTray();
}

navigation.forEach((button) => button.addEventListener('click', (event) => {
  const leavingLockedWall = document.body.classList.contains('wall-mode') && button.dataset.view !== 'wall' && hasAdultPin() && !adultUnlocked;
  if (leavingLockedWall) {
    event.preventDefault();
    openAdultGate('unlock', () => showView(button.dataset.view));
    return;
  }
  showView(button.dataset.view);
}));

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderTasks();
  });
});

document.getElementById('focusDone').addEventListener('click', () => {
  const taskId = document.getElementById('todayFocus').dataset.taskId;
  if (taskId) taskStore.setCompleted(taskId, true);
});

function openTaskDialog(task = null) {
  editingTaskId = task?.id || null;
  taskForm.reset();
  document.getElementById('taskDialogTitle').textContent = task ? 'Change this action' : 'Add one clear action';
  document.getElementById('taskSubmitButton').textContent = task ? 'Save changes' : 'Add to To-dos';
  if (task) {
    taskForm.elements.title.value = task.title;
    taskForm.elements.note.value = task.note;
    taskForm.elements.bucket.value = task.bucket;
    taskForm.querySelectorAll('[name="assignee"]').forEach((input) => {
      input.checked = task.assigneeIds.includes(input.value);
    });
    taskForm.elements.beneficiary.value = task.beneficiaryIds[0] || '';
  }
  taskDialog.showModal();
  taskForm.elements.title.focus();
}

document.getElementById('addTaskButton').addEventListener('click', () => openTaskDialog());

document.querySelectorAll('[data-close-task]').forEach((button) => button.addEventListener('click', () => {
  editingTaskId = null;
  taskDialog.close();
}));

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(taskForm);
  const assigneeIds = fields.getAll('assignee');
  if (!assigneeIds.length) {
    document.getElementById('assigneeError').hidden = false;
    return;
  }
  document.getElementById('assigneeError').hidden = true;
  const input = {
    title: fields.get('title'),
    note: fields.get('note'),
    bucket: fields.get('bucket'),
    assigneeIds,
    beneficiaryId: fields.get('beneficiary')
  };
  const task = editingTaskId ? taskStore.updateTask(editingTaskId, input) : taskStore.addTask(input);
  editingTaskId = null;
  activeFilter = task.bucket;
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === activeFilter));
  taskDialog.close();
  showView('todos');
  render();
});

function openReview(proposal) {
  activeProposalId = proposal.id;
  document.getElementById('reviewSource').textContent = proposal.source.raw;
  reviewForm.elements.title.value = proposal.proposed.title;
  reviewForm.elements.bucket.value = proposal.proposed.bucket;
  reviewForm.elements.assignee.value = proposal.proposed.assigneeIds[0];
  reviewForm.elements.beneficiary.value = proposal.proposed.beneficiaryIds[0] || '';
  reviewDialog.showModal();
}

document.getElementById('typeCaptureButton').addEventListener('click', () => {
  captureForm.reset();
  captureDialog.showModal();
  captureForm.elements.capture.focus();
});

document.querySelectorAll('[data-close-capture]').forEach((button) => button.addEventListener('click', () => captureDialog.close()));

captureForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const proposal = taskStore.proposeFromText(new FormData(captureForm).get('capture'));
  captureDialog.close();
  openReview(proposal);
});

document.getElementById('reviewTrayButton').addEventListener('click', () => {
  const proposal = pendingProposals()[0];
  if (proposal) openReview(proposal);
});

document.querySelectorAll('[data-review-action]').forEach((button) => {
  button.addEventListener('click', () => {
    if (activeProposalId) taskStore.resolveProposal(activeProposalId, button.dataset.reviewAction);
    activeProposalId = null;
    reviewDialog.close();
  });
});

reviewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(reviewForm);
  const task = taskStore.resolveProposal(activeProposalId, 'add', {
    title: fields.get('title'),
    note: '',
    bucket: fields.get('bucket'),
    assigneeIds: [fields.get('assignee')],
    beneficiaryIds: fields.get('beneficiary') ? [fields.get('beneficiary')] : []
  });
  activeProposalId = null;
  reviewDialog.close();
  if (task) {
    activeFilter = task.bucket;
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === activeFilter));
    showView('todos');
    render();
  }
});

const recordButton = document.getElementById('recordButton');
recordButton.addEventListener('click', () => {
  const recording = recordButton.classList.toggle('recording');
  recordButton.querySelector('b').textContent = recording ? 'Tap to stop' : 'Tap to talk';
});

const adultDialog = document.getElementById('adultDialog');
const adultForm = document.getElementById('adultForm');

function openAdultGate(mode = hasAdultPin() ? 'unlock' : 'setup', continuation = null) {
  adultGateContinuation = continuation;
  adultForm.reset();
  document.getElementById('adultPinError').hidden = true;
  const setup = mode === 'setup';
  document.getElementById('adultDialogTitle').textContent = setup ? 'Create a screen PIN' : 'Enter adult PIN';
  document.getElementById('adultDialogCopy').textContent = setup
    ? 'This prevents accidental changes by children on this device. It is not yet account security.'
    : 'Adult confirmation is needed to leave the child-safe wall.';
  document.getElementById('confirmPinLabel').hidden = !setup;
  adultForm.elements.confirmPin.required = setup;
  document.getElementById('adultSubmitButton').textContent = setup ? 'Create PIN' : 'Unlock';
  adultDialog.dataset.mode = mode;
  adultDialog.showModal();
  adultForm.elements.pin.focus();
}

document.getElementById('adultModeButton').addEventListener('click', () => {
  if (hasAdultPin() && adultUnlocked) {
    adultUnlocked = false;
    renderAdultModeStatus();
    return;
  }
  openAdultGate();
});

document.querySelectorAll('[data-close-adult]').forEach((button) => button.addEventListener('click', () => {
  adultGateContinuation = null;
  adultDialog.close();
}));

adultForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = new FormData(adultForm);
  const pin = fields.get('pin');
  const error = document.getElementById('adultPinError');
  if (!/^\d{4}$/.test(pin)) {
    error.textContent = 'Enter exactly four numbers.';
    error.hidden = false;
    return;
  }
  if (adultDialog.dataset.mode === 'setup') {
    if (pin !== fields.get('confirmPin')) {
      error.textContent = 'Those PINs do not match.';
      error.hidden = false;
      return;
    }
    localStorage.setItem(ADULT_GATE_KEY, JSON.stringify({ version: 1, pinHash: await hashPin(pin), createdAt: new Date().toISOString() }));
  } else if (await hashPin(pin) !== adultGateRecord()?.pinHash) {
    error.textContent = 'That PIN is not correct.';
    error.hidden = false;
    adultForm.elements.pin.select();
    return;
  }
  adultUnlocked = true;
  renderAdultModeStatus();
  const continuation = adultGateContinuation;
  adultGateContinuation = null;
  adultDialog.close();
  if (continuation) continuation();
});

taskStore.subscribe(render);
renderCurrentDate();
renderDayStrip();
render();
renderAdultModeStatus();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
