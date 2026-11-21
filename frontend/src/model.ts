export type Status = 'backlog' | 'active' | 'completed' | 'abandoned';

export interface Entry {
  id: string;
  content: string;
  kind: 'note' | 'event';
  createdAt: string;
}

export interface Attachment {
  id: string;
  kind: 'url' | 'text' | 'image' | 'audio' | 'file';
  title: string | null;
  url: string | null;
  content: string | null;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  storageKey: string | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  spark: string | null;
  category: string | null;
  tags: string[];
  estimatedDuration: number | null;
  requiresLeavingHome: boolean | null;
  requiresMoney: boolean | null;
  result: string | null;
  enjoymentScore: number | null;
  actualDuration: number | null;
  status: Status;
  favorite: boolean;
  abandonReason: string | null;
  trackedSeconds: number;
  sessionStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  abandonedAt: string | null;
  log: Entry[];
  attachments: Attachment[];
}

export const pages = [
  { to: '/', label: 'Идеи', icon: 'stack' },
  { to: '/active', label: 'Сейчас', icon: 'clock' },
  { to: '/completed', label: 'Коллекция', icon: 'check' },
  { to: '/archive', label: 'Архив', icon: 'archive' },
] as const;

export const statusLabel: Record<Status, string> = {
  backlog: 'В списке', active: 'В работе', completed: 'Сделано', abandoned: 'В архиве',
};

export function challengePath(id: string) {
  return '/challenge/' + encodeURIComponent(id);
}

export function totalSeconds(c: Challenge, now = Date.now()) {
  return c.trackedSeconds + (c.sessionStartedAt ? Math.max(0, Math.floor((now - Date.parse(c.sessionStartedAt)) / 1000)) : 0);
}

export function latestNote(c: Challenge) {
  return c.log.filter((e) => e.kind === 'note').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]?.content;
}

export function dateLabel(value: string | null, withTime = false) {
  if (!value) return null;
  return new Intl.DateTimeFormat('ru', { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(value));
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new APIError(response.status, body?.error ?? 'Не удалось выполнить действие.');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function send(body?: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) };
}

export type Modal =
  | { kind: 'capture' }
  | { kind: 'edit' | 'note' | 'complete' | 'result' | 'archive' | 'time' | 'delete' | 'link' | 'text' | 'file'; challenge: Challenge };

export interface Actions {
  busy: boolean;
  open: (modal: Modal) => void;
  act: (id: string, action: string, fields?: unknown) => Promise<boolean>;
  removeAttachment: (id: string) => Promise<void>;
}
