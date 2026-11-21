import { useState, type FormEvent } from 'react';
import { Button, PageHeading } from '@home-apps/ui';
import { Glyph } from './common';

export type Appearance = 'dark' | 'light';

export interface ImportResult {
  challenges: number;
  logEntries: number;
  attachments: number;
  files: number;
}

export function DataPage({ count, appearance, setAppearance, upload, signOut }: {
  count: number;
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
  upload: (mode: string, body: FormData) => Promise<ImportResult>;
  signOut?: () => Promise<void>;
}) {
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function importFile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === 'replace' && !window.confirm('Заменить все идеи, заметки и вложения данными из файла?')) return;
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await upload(mode, new FormData(form)));
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось импортировать файл.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="data-page">
    <PageHeading>Данные</PageHeading>
    <p className="ui-muted">Всего идей: <span className="ui-number">{count}</span>.</p>
    <section className="vault-panel detail-section">
      <h2>Экспорт</h2>
      <ul className="vault-list export-list">
        {[
          ['/api/export/json', 'Полная копия', 'Идеи, заметки и вложения вместе с файлами.', '.json'],
          ['/api/export/json?files=0', 'Без файлов', 'Идеи и сведения о вложениях.', '.json'],
          ['/api/export/markdown', 'Markdown', 'Идеи и заметки в текстовом документе.', '.md'],
        ].map(([url, title, text, format]) => <li key={url}>
          <a href={url} download><strong>{title}</strong><span className="ui-muted">{text}</span><span className="vault-link">{format} <Glyph name="download" /></span></a>
        </li>)}
      </ul>
    </section>
    <section className="vault-panel detail-section">
      <h2>Импорт</h2>
      <form className="vault-form-fields" onSubmit={(e) => void importFile(e)}>
        <label>JSON-файл<input type="file" name="file" accept=".json,application/json" required /></label>
        <fieldset className="import-modes">
          <legend>Режим импорта</legend>
          <label><input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Добавить и обновить по идентификаторам</label>
          <label><input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Заменить все данные</label>
        </fieldset>
        <div><Button kind="primary" type="submit" disabled={busy}>{busy ? 'Импорт…' : 'Импортировать'}</Button></div>
        {error && <p className="ui-error" role="alert">{error}</p>}
        {result && <p role="status">Идей {result.challenges} · записей {result.logEntries} · вложений {result.attachments} · файлов {result.files}</p>}
      </form>
    </section>
    <section className="vault-panel detail-section">
      <h2>Оформление</h2>
      <div className="vault-actions">
        <Button aria-pressed={appearance === 'dark'} onClick={() => setAppearance('dark')}>Графит</Button>
        <Button aria-pressed={appearance === 'light'} onClick={() => setAppearance('light')}>Светлое</Button>
      </div>
    </section>
    {signOut && <Button kind="quiet" onClick={() => void signOut()}>Выйти</Button>}
  </div>;
}
