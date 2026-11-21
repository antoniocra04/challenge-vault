import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { AppHeader, Button, Icon, Shell, buttonClass } from '@home-apps/ui';
import { Backlog } from './backlog';
import { Empty, Glyph } from './common';
import { DataPage, type Appearance, type ImportResult } from './data';
import { Active, Archive, ChallengeDetail, Collection, NotFound } from './details';
import { VaultDialog, challengeFields, field, outcomeFields, timeFields } from './dialog';
import { APIError, api, challengePath, pages, send, type Actions, type Challenge, type Modal } from './model';
import './style.css';

interface Session {
  enabled: boolean;
  authorized: boolean;
}

interface Notice {
  message: string;
  href?: string;
  error?: boolean;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить действие.';
}

function Header({ capture, signedIn }: { capture: () => void; signedIn: boolean }) {
  return <AppHeader brand={<Link to="/"><Icon name="stack" /> Challenge Vault</Link>}
    navigation={signedIn ? pages.map(({ to, label }) => <NavLink key={to} to={to} end>{label}</NavLink>) : undefined}
    actions={signedIn ? <>
      <NavLink className={buttonClass('quiet') + ' icon-only'} to="/data" aria-label="Импорт и экспорт" title="Импорт и экспорт">
        <Glyph name="archive" />
      </NavLink>
      <Button className="desktop-capture" kind="primary" onClick={capture} aria-keyshortcuts="C">
        <Icon name="plus" /> Поймать <kbd>C</kbd>
      </Button>
    </> : undefined} />;
}

function MobileNav({ capture }: { capture: () => void }) {
  const nav = ({ to, label, icon }: typeof pages[number]) =>
    <NavLink key={to} to={to} end><Glyph name={icon} /><span>{label}</span></NavLink>;
  return <nav className="vault-phone" aria-label="Разделы на телефоне">
    {pages.slice(0, 2).map(nav)}
    <Button kind="primary" onClick={capture} aria-keyshortcuts="C"><Icon name="plus" /> Поймать</Button>
    {pages.slice(2).map(nav)}
  </nav>;
}

function Login({ onSignIn }: { onSignIn: (password: string) => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSignIn(String(new FormData(e.currentTarget).get('password') ?? ''));
    } catch (err) {
      setError(message(err));
    } finally {
      setPending(false);
    }
  }
  return <div className="login vault-panel">
    <h1>Вход</h1>
    <form className="vault-form-fields" onSubmit={(e) => void submit(e)}>
      <label>Пароль<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>
      {error && <p className="ui-error" role="alert">{error}</p>}
      <Button kind="primary" type="submit" disabled={pending}>Войти</Button>
    </form>
  </div>;
}

function useAppearance() {
  const [appearance, update] = useState<Appearance>(() => localStorage.getItem('vault-appearance') === 'dark' ? 'dark' : 'light');
  const setAppearance = (value: Appearance) => {
    update(value);
    localStorage.setItem('vault-appearance', value);
  };
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', appearance === 'dark' ? '#29292c' : '#ffffff');
  }, [appearance]);
  return [appearance, setAppearance] as const;
}

function App() {
  const [appearance, setAppearance] = useAppearance();
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<Challenge[] | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const capture = () => setModal({ kind: 'capture' });

  async function load(signal?: AbortSignal) {
    try {
      const state = await api<Session>('/api/session', { signal });
      if (state.authorized) setRecords(await api<Challenge[]>('/api/challenges', { signal }));
      setSession(state);
      setBootError(null);
    } catch (err) {
      if (!signal?.aborted) setBootError(message(err));
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!session?.authorized || modal) return;
    const key = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.defaultPrevented || e.repeat || e.isComposing || e.metaKey || e.ctrlKey || e.altKey ||
        (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select')))) return;
      if (e.code === 'KeyC' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'с') {
        e.preventDefault();
        setModal({ kind: 'capture' });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [session?.authorized, modal]);

  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = window.setTimeout(() => setNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const page = pages.find(({ to }) => to === location.pathname)?.label;
    document.title = page && page !== 'Идеи' ? `${page} · Challenge Vault` : 'Challenge Vault';
    window.scrollTo(0, 0);
  }, [location.pathname]);

  async function reloadRecords() {
    setRecords(await api<Challenge[]>('/api/challenges'));
  }

  async function run<T>(task: () => Promise<T>): Promise<T> {
    if (running.current) throw new Error('Дождитесь завершения текущего действия.');
    running.current = true;
    setBusy(true);
    setNotice(null);
    try {
      return await task();
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        setModal(null);
        setRecords(null);
        setSession({ enabled: true, authorized: false });
      }
      throw err;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function update(challenge: Challenge) {
    setRecords((current) => [...(current ?? []).filter((c) => c.id !== challenge.id), challenge]);
  }

  async function change(id: string, action: string, fields?: unknown) {
    update(await api<Challenge>('/api/challenges/' + encodeURIComponent(id) + '/' + action, send(fields)));
  }

  const actions: Actions = {
    busy,
    open: setModal,
    act: async (id, action, fields) => {
      try {
        await run(() => change(id, action, fields));
        return true;
      } catch (err) {
        setNotice({ message: message(err), error: true });
        return false;
      }
    },
    removeAttachment: async (id) => {
      try {
        await run(async () => {
          await api('/api/attachments/' + encodeURIComponent(id), { method: 'DELETE' });
          await reloadRecords();
        });
      } catch (err) {
        setNotice({ message: message(err), error: true });
      }
    },
  };

  async function submitModal(data: FormData) {
    if (!modal) return;
    await run(async () => {
      if (modal.kind === 'capture') {
        const c = await api<Challenge>('/api/challenges', send(challengeFields(data)));
        update(c);
        setNotice({ message: 'Идея добавлена', href: challengePath(c.id) });
        return;
      }
      const c = modal.challenge;
      switch (modal.kind) {
        case 'edit': await change(c.id, 'edit', challengeFields(data)); break;
        case 'note': await change(c.id, 'note', { content: field(data, 'content') }); break;
        case 'archive':
          await change(c.id, 'archive', { reason: field(data, 'reason') });
          setNotice({ message: 'Идея в архиве', href: '/archive' });
          break;
        case 'time': await change(c.id, 'time', timeFields(data)); break;
        case 'result': await change(c.id, 'result', outcomeFields(data)); break;
        case 'complete':
          await change(c.id, 'complete', outcomeFields(data));
          setNotice({ message: 'Идея завершена', href: '/completed?new=' + encodeURIComponent(c.id) });
          break;
        case 'link':
        case 'text':
          await change(c.id, 'attach-' + modal.kind, { attachmentTitle: field(data, 'attachmentTitle'), url: field(data, 'url'), content: field(data, 'content') });
          break;
        case 'file':
          data.set('challengeId', c.id);
          await api('/api/attachments', { method: 'POST', body: data });
          await reloadRecords();
          break;
        case 'delete':
          await api('/api/challenges/' + encodeURIComponent(c.id), { method: 'DELETE' });
          setRecords((current) => (current ?? []).filter(({ id }) => id !== c.id));
          navigate('/');
          break;
      }
    });
  }

  async function signIn(password: string) {
    await api('/api/login', send({ password }));
    await reloadRecords();
    setSession({ enabled: true, authorized: true });
    const state = location.state as { returnTo?: string } | null;
    navigate(state?.returnTo ?? '/', { replace: true });
  }

  async function signOut() {
    try {
      await api('/api/logout', send());
      setRecords(null);
      setModal(null);
      setNotice(null);
      setSession({ enabled: true, authorized: false });
      navigate('/login', { replace: true });
    } catch (err) {
      setNotice({ message: message(err), error: true });
    }
  }

  async function importFile(mode: string, data: FormData) {
    return run(async () => {
      const imported = await api<{ result: ImportResult }>('/api/import?mode=' + encodeURIComponent(mode), { method: 'POST', body: data });
      await reloadRecords();
      return imported.result;
    });
  }

  let page: ReactNode;
  if (bootError) {
    page = <Empty><p className="ui-error" role="alert">{bootError}</p><Button onClick={() => void load()}>Повторить</Button></Empty>;
  } else if (!session || (session.authorized && !records)) {
    page = <p role="status" className="ui-muted">Загрузка…</p>;
  } else if (!session.authorized) {
    page = location.pathname === '/login' ? <Login onSignIn={signIn} /> : <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />;
  } else if (records) {
    page = <Routes>
      <Route path="/" element={<Backlog challenges={records} actions={actions} />} />
      <Route path="/active" element={<Active challenges={records} actions={actions} />} />
      <Route path="/completed" element={<Collection challenges={records} />} />
      <Route path="/archive" element={<Archive challenges={records} actions={actions} />} />
      <Route path="/challenge/:id" element={<ChallengeDetail challenges={records} actions={actions} />} />
      <Route path="/data" element={<DataPage count={records.length} appearance={appearance} setAppearance={setAppearance}
        upload={importFile} signOut={session.enabled ? signOut : undefined} />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>;
  }

  const signedIn = Boolean(session?.authorized);
  const tags = [...new Set(records?.flatMap((c) => c.tags) ?? [])].sort((a, b) => a.localeCompare(b, 'ru'));
  return <Shell theme="vault" appearance={appearance}>
    <Header capture={capture} signedIn={signedIn} />
    <main className="ui-container ui-main" id="content">{page}</main>
    {signedIn && <MobileNav capture={capture} />}
    {modal && <VaultDialog modal={modal} onClose={() => setModal(null)} onSubmit={submitModal} tags={tags} />}
    {notice && <div className="vault-notice" role={notice.error ? 'alert' : 'status'}>
      <span>{notice.message}</span>
      {notice.href && <Link className="vault-link" to={notice.href} onClick={() => setNotice(null)}>Открыть <Icon name="next" /></Link>}
      <Button kind="quiet" className="icon-only" aria-label="Закрыть сообщение" onClick={() => setNotice(null)}><Icon name="close" /></Button>
    </div>}
  </Shell>;
}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
