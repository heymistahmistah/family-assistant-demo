const STORAGE_KEY = 'family-assistant.tasks.v1';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function offsetDateKey(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export const dateKeys = Object.freeze({ today: offsetDateKey(0), tomorrow: offsetDateKey(1) });

export const profiles = Object.freeze({
  emmeline: { id: 'emmeline', name: 'Emmeline', initials: 'E', className: 'emmeline', role: 'adult' },
  bruno: { id: 'bruno', name: 'Bruno', initials: 'B', className: 'bruno', role: 'adult' },
  eulalie: { id: 'eulalie', name: 'Eulalie', initials: 'Eu', className: 'eulalie', role: 'child', marker: '🍏' },
  leonore: { id: 'leonore', name: 'Léonore', initials: 'Lé', className: 'leonore', role: 'child', marker: '🍊' }
});

const seedState = {
  version: 1,
  tasks: [
    {
      id: 'school-message',
      title: 'Check the new school message',
      note: 'Open Smartschool, decide whether it needs an event or task, then return here.',
      bucket: 'today',
      status: 'open',
      assigneeIds: ['emmeline'],
      beneficiaryIds: [],
      estimateMinutes: 15,
      visibility: 'private',
      source: { type: 'sample', label: 'Fictional sample' },
      createdAt: '2026-10-27T07:00:00.000Z',
      completedAt: null
    },
    {
      id: 'buy-milk',
      title: 'Buy milk and fruit',
      note: 'Shared shopping list',
      bucket: 'today',
      status: 'open',
      assigneeIds: ['bruno'],
      beneficiaryIds: [],
      estimateMinutes: null,
      visibility: 'shared',
      source: { type: 'sample', label: 'Fictional sample' },
      createdAt: '2026-10-27T07:01:00.000Z',
      completedAt: null
    },
    {
      id: 'swimming-bag',
      title: 'Prepare swimming bag',
      note: 'Before bedtime',
      bucket: 'tomorrow',
      status: 'open',
      assigneeIds: ['emmeline'],
      beneficiaryIds: ['eulalie'],
      estimateMinutes: 10,
      visibility: 'shared',
      source: { type: 'sample', label: 'Fictional sample' },
      createdAt: '2026-10-27T07:02:00.000Z',
      completedAt: null
    },
    {
      id: 'library-book',
      title: 'Put library book by the front door',
      note: 'For tomorrow',
      bucket: 'tomorrow',
      status: 'open',
      assigneeIds: ['bruno'],
      beneficiaryIds: ['eulalie'],
      estimateMinutes: 5,
      visibility: 'shared',
      source: { type: 'sample', label: 'Fictional sample' },
      createdAt: '2026-10-27T07:03:00.000Z',
      completedAt: null
    }
  ],
  events: [
    {
      id: 'school-departure',
      title: 'Leave for school',
      date: dateKeys.today,
      startTime: '08:10',
      endTime: null,
      participantIds: ['bruno', 'eulalie'],
      subjectIds: ['eulalie'],
      visibility: 'shared',
      note: 'Bike',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'nursery-dropoff',
      title: 'Nursery drop-off',
      date: dateKeys.today,
      startTime: '08:20',
      endTime: null,
      participantIds: ['emmeline', 'leonore'],
      subjectIds: ['leonore'],
      visibility: 'shared',
      note: 'Walk + balance bike',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'hockey',
      title: 'Hockey',
      date: dateKeys.today,
      startTime: '15:20',
      endTime: '16:20',
      participantIds: ['eulalie'],
      subjectIds: ['eulalie'],
      visibility: 'shared',
      note: 'Trainers today',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'family-dinner',
      title: '🍝 Vegetable pasta',
      date: dateKeys.today,
      startTime: '17:30',
      endTime: null,
      participantIds: ['emmeline', 'bruno', 'eulalie', 'leonore'],
      subjectIds: [],
      visibility: 'shared',
      note: 'Dinner',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'gobox',
      title: 'GoBox',
      date: dateKeys.today,
      startTime: '18:30',
      endTime: '19:30',
      participantIds: ['emmeline'],
      subjectIds: [],
      visibility: 'shared',
      note: 'Calendar booking',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'private-appointment',
      title: 'Private appointment',
      date: dateKeys.today,
      startTime: '12:30',
      endTime: '13:00',
      participantIds: ['emmeline'],
      subjectIds: [],
      visibility: 'private',
      note: '',
      source: { type: 'sample', label: 'Fictional sample' }
    },
    {
      id: 'book-club',
      title: 'Book club',
      date: dateKeys.tomorrow,
      startTime: '20:00',
      endTime: '21:30',
      participantIds: ['emmeline'],
      subjectIds: [],
      visibility: 'shared',
      note: 'Emmeline',
      source: { type: 'sample', label: 'Fictional sample' }
    }
  ],
  proposals: [],
  history: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.tasks) && Array.isArray(saved.history)) {
      const sampleDates = new Map(seedState.events.map((event) => [event.id, event.date]));
      const events = (Array.isArray(saved.events) ? saved.events : clone(seedState.events)).map((event) =>
        event.source?.type === 'sample' && sampleDates.has(event.id) ? { ...event, date: sampleDates.get(event.id) } : event
      );
      return {
        ...saved,
        events,
        proposals: Array.isArray(saved.proposals) ? saved.proposals : []
      };
    }
  } catch {
    // Corrupt or unavailable local storage falls back to fictional sample data.
  }
  return clone(seedState);
}

let state = load();
const listeners = new Set();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener(clone(state)));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const taskStore = {
  getState() {
    return clone(state);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addTask({ title, note = '', bucket = 'today', assigneeIds, beneficiaryId = '' }) {
    const now = new Date().toISOString();
    const task = {
      id: createId(),
      title: title.trim(),
      note: note.trim(),
      bucket,
      status: 'open',
      assigneeIds: [...assigneeIds],
      beneficiaryIds: beneficiaryId ? [beneficiaryId] : [],
      estimateMinutes: null,
      visibility: 'shared',
      source: { type: 'manual', label: 'Added in the app' },
      createdAt: now,
      completedAt: null
    };
    state.tasks.push(task);
    state.history.push({ id: createId(), type: 'task.created', taskId: task.id, at: now });
    persist();
    return clone(task);
  },

  updateTask(taskId, { title, note = '', bucket, assigneeIds, beneficiaryId = '' }) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return null;
    task.title = title.trim();
    task.note = note.trim();
    task.bucket = bucket;
    task.assigneeIds = [...assigneeIds];
    task.beneficiaryIds = beneficiaryId ? [beneficiaryId] : [];
    const now = new Date().toISOString();
    state.history.push({ id: createId(), type: 'task.updated', taskId, at: now });
    persist();
    return clone(task);
  },

  proposeFromText(rawText) {
    const now = new Date().toISOString();
    const firstLine = rawText.trim().split(/\n|[.!?]\s/).find(Boolean) || 'Review captured note';
    const simplified = firstLine.replace(/^(i need to|remember to|don['’]t forget to|please|can you)\s+/i, '').trim();
    const title = simplified.charAt(0).toUpperCase() + simplified.slice(1);
    const proposal = {
      id: createId(),
      kind: 'task',
      status: 'pending',
      source: { type: 'typed-capture', raw: rawText.trim() },
      proposed: {
        title: title.slice(0, 140),
        note: '',
        bucket: 'today',
        assigneeIds: ['emmeline'],
        beneficiaryIds: []
      },
      createdAt: now,
      resolvedAt: null,
      taskId: null
    };
    state.proposals.push(proposal);
    state.history.push({ id: createId(), type: 'proposal.created', proposalId: proposal.id, at: now });
    persist();
    return clone(proposal);
  },

  resolveProposal(proposalId, action, proposed = null) {
    const proposal = state.proposals.find((item) => item.id === proposalId);
    if (!proposal || proposal.status !== 'pending') return null;
    const now = new Date().toISOString();
    if (action === 'later') {
      state.history.push({ id: createId(), type: 'proposal.deferred', proposalId, at: now });
      persist();
      return clone(proposal);
    }
    if (action === 'ignore') {
      proposal.status = 'ignored';
      proposal.resolvedAt = now;
      state.history.push({ id: createId(), type: 'proposal.ignored', proposalId, at: now });
      persist();
      return clone(proposal);
    }
    if (action === 'add' && proposed) {
      proposal.proposed = clone(proposed);
      const task = {
        id: createId(),
        title: proposed.title.trim(),
        note: proposed.note?.trim() || '',
        bucket: proposed.bucket,
        status: 'open',
        assigneeIds: [...proposed.assigneeIds],
        beneficiaryIds: [...proposed.beneficiaryIds],
        estimateMinutes: null,
        visibility: 'private',
        source: { type: 'reviewed-capture', label: 'Approved from typed capture', proposalId },
        createdAt: now,
        completedAt: null
      };
      state.tasks.push(task);
      proposal.status = 'added';
      proposal.resolvedAt = now;
      proposal.taskId = task.id;
      state.history.push({ id: createId(), type: 'proposal.added', proposalId, taskId: task.id, at: now });
      persist();
      return clone(task);
    }
    return null;
  },

  setCompleted(taskId, completed) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    const now = new Date().toISOString();
    task.status = completed ? 'completed' : 'open';
    task.completedAt = completed ? now : null;
    state.history.push({ id: createId(), type: completed ? 'task.completed' : 'task.reopened', taskId, at: now });
    persist();
  }
};
