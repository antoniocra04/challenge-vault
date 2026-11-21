import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Icon } from '@home-apps/ui';
import { formatMinutes, parseDuration } from './duration';
import { totalSeconds, type Challenge, type Modal } from './model';

type FormValues = (values: FormData) => Promise<void>;

const copy: Record<Modal['kind'], [string, string]> = {
  capture: ['Новая идея', 'Сохранить'],
  edit: ['Изменить идею', 'Сохранить'],
  note: ['Новая заметка', 'Сохранить'],
  complete: ['Завершить идею', 'Завершить'],
  result: ['Изменить результат', 'Сохранить'],
  archive: ['В архив', 'В архив'],
  time: ['Потраченное время', 'Сохранить'],
  delete: ['Удалить идею', 'Удалить'],
  link: ['Добавить ссылку', 'Сохранить'],
  text: ['Добавить текст', 'Сохранить'],
  file: ['Прикрепить файл', 'Загрузить'],
};

export function field(data: FormData, key: string) {
  return String(data.get(key) ?? '').trim();
}

function duration(data: FormData, key: string) {
  const value = field(data, key);
  const minutes = parseDuration(value);
  if (value && (minutes === null || !Number.isFinite(minutes) || minutes > 1_000_000)) {
    throw new Error('Укажите время, например «45 мин» или «1 ч 20 мин».');
  }
  return minutes;
}

function choice(data: FormData, key: string) {
  const raw = field(data, key);
  return raw ? raw === 'true' : null;
}

export function challengeFields(data: FormData) {
  return {
    title: field(data, 'title'),
    spark: field(data, 'spark'),
    description: field(data, 'description'),
    category: field(data, 'category'),
    tags: field(data, 'tags').split(/[,\n]/).filter((s) => s.trim()),
    estimatedDuration: duration(data, 'estimate'),
    requiresLeavingHome: choice(data, 'place'),
    requiresMoney: choice(data, 'money'),
  };
}

export function outcomeFields(data: FormData) {
  return {
    result: field(data, 'result'),
    actualDuration: duration(data, 'actual'),
    enjoymentScore: field(data, 'rating') ? Number(field(data, 'rating')) : null,
  };
}

export function timeFields(data: FormData) {
  const minutes = duration(data, 'minutes');
  if (minutes === null) throw new Error('Укажите потраченное время.');
  return { minutes };
}

function triDefault(value?: boolean | null) {
  return value == null ? '' : String(value);
}

function IdeaFields({ c, capture = false, tags }: { c?: Challenge; capture?: boolean; tags: string[] }) {
  const spark = useRef<HTMLTextAreaElement>(null);
  const details = <div className="vault-form-fields">
    <label>Описание<textarea name="description" rows={4} maxLength={20_000} defaultValue={c?.description ?? ''} /></label>
    <div className="form-columns">
      <label>Категория<input name="category" maxLength={60} defaultValue={c?.category ?? ''} /></label>
      <label>Теги через запятую<input name="tags" list="vault-tags" defaultValue={c?.tags.join(', ') ?? ''} /></label>
      <datalist id="vault-tags">{tags.map((tag) => <option value={tag} key={tag} />)}</datalist>
      <label>Сколько времени займёт<input name="estimate" placeholder="Например, 45 мин" defaultValue={formatMinutes(c?.estimatedDuration)} /></label>
      <label>Место<select name="place" defaultValue={triDefault(c?.requiresLeavingHome)}>
        <option value="">Не указано</option><option value="false">Дома</option><option value="true">Не дома</option>
      </select></label>
      <label>Расходы<select name="money" defaultValue={triDefault(c?.requiresMoney)}>
        <option value="">Не указано</option><option value="false">Бесплатно</option><option value="true">Платно</option>
      </select></label>
    </div>
  </div>;
  return <>
    <label>{capture ? 'Что хочется попробовать' : 'Название'}
      {capture ? <textarea name="title" required maxLength={300} rows={2} autoFocus onKeyDown={(e) => {
        if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        if (window.matchMedia('(pointer: coarse)').matches) spark.current?.focus();
        else e.currentTarget.form?.requestSubmit();
      }} /> : <input name="title" required maxLength={300} defaultValue={c?.title} autoFocus />}
    </label>
    <label>Почему захотелось<textarea name="spark" ref={spark} rows={3} maxLength={20_000} defaultValue={c?.spark ?? ''} /></label>
    {capture ? <details className="form-disclosure"><summary>Подробнее</summary>{details}</details> : details}
  </>;
}

function ResultFields({ c, editing }: { c: Challenge; editing: boolean }) {
  const [rating, setRating] = useState<number | null>(editing ? c.enjoymentScore : null);
  const minutes = editing ? c.actualDuration : Math.round(totalSeconds(c) / 60);
  return <>
    <label>Что получилось<textarea name="result" rows={4} maxLength={20_000} defaultValue={editing ? c.result ?? '' : ''} autoFocus /></label>
    <fieldset className="rating">
      <legend>Насколько понравилось</legend>
      <div className="rating-options">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <label key={n}>
          <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
          <span>{n}</span>
        </label>)}
      </div>
      {rating !== null && <Button kind="quiet" onClick={() => setRating(null)}>Снять оценку</Button>}
    </fieldset>
    <label>Сколько времени ушло<input name="actual" defaultValue={minutes ? formatMinutes(minutes) : ''} placeholder="Например, 1 ч 20 мин" /></label>
  </>;
}

function FormContent({ modal, tags }: { modal: Modal; tags: string[] }): ReactNode {
  const [reason, setReason] = useState('');
  if (modal.kind === 'capture') return <IdeaFields capture tags={tags} />;
  const c = modal.challenge;
  switch (modal.kind) {
    case 'edit': return <IdeaFields c={c} tags={tags} />;
    case 'note': return <label>Текст заметки<textarea name="content" autoFocus required rows={4} maxLength={20_000} /></label>;
    case 'complete':
    case 'result': return <ResultFields c={c} editing={modal.kind === 'result'} />;
    case 'archive': return <>
      <label>Причина<textarea name="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} autoFocus /></label>
      <div className="vault-actions archive-reasons">
        {['сложно', 'перехотелось', 'уже неактуально'].map((label) =>
          <Button key={label} kind="quiet" aria-pressed={reason === label} onClick={() => setReason(label)}>{label}</Button>)}
      </div>
    </>;
    case 'time': return <label>Потрачено времени
      <input name="minutes" defaultValue={formatMinutes(c.actualDuration ?? Math.round(totalSeconds(c) / 60))}
        placeholder="Например, 1 ч 20 мин" autoFocus required />
    </label>;
    case 'delete': return <p>«{c.title}» вместе с заметками и вложениями будет удалена.</p>;
    case 'link': return <>
      <label>Ссылка<input name="url" required maxLength={4000} placeholder="https://" autoFocus /></label>
      <label>Название<input name="attachmentTitle" maxLength={300} /></label>
    </>;
    case 'text': return <>
      <label>Название<input name="attachmentTitle" maxLength={300} /></label>
      <label>Текст<textarea name="content" required rows={5} maxLength={100_000} autoFocus /></label>
    </>;
    case 'file': return <>
      <label>Файл<input type="file" name="file" required autoFocus /></label>
      <label>Название<input name="title" maxLength={300} /></label>
    </>;
  }
}

export function VaultDialog({ modal, onClose, onSubmit, tags }: { modal: Modal; onClose: () => void; onSubmit: FormValues; tags: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, submit] = copy[modal.kind];
  useEffect(() => {
    const surface = dialog.current;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    surface?.showModal();
    return () => {
      surface?.close();
      focus?.focus();
    };
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(new FormData(e.currentTarget));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить.');
    } finally {
      setSubmitting(false);
    }
  }
  return <dialog ref={dialog} className="vault-dialog" aria-labelledby="vault-dialog-title" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
    <div className="vault-row">
      <h2 id="vault-dialog-title">{title}</h2>
      <Button kind="quiet" className="icon-only" aria-label="Закрыть" disabled={submitting} onClick={onClose}><Icon name="close" /></Button>
    </div>
    <form className="vault-form-fields" onSubmit={(e) => void save(e)} onKeyDown={(e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.currentTarget.requestSubmit();
      }
    }}>
      <FormContent modal={modal} tags={tags} />
      {error && <p className="ui-error" role="alert">{error}</p>}
      <div className="vault-actions dialog-actions">
        <Button kind="quiet" disabled={submitting} onClick={onClose}>Отмена</Button>
        <Button kind={modal.kind === 'delete' ? 'danger' : 'primary'} type="submit" disabled={submitting}>{submitting ? 'Сохранение…' : submit}</Button>
      </div>
    </form>
  </dialog>;
}
