import { useState, type FormEvent } from 'react';
import { Button, Icon, PageHeading, buttonClass } from '@home-apps/ui';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChallengeMeta, DetailLink, Empty, Glyph, Marker, Timer } from './common';
import { formatMinutes } from './duration';
import { challengePath, dateLabel, latestNote, statusLabel, type Actions, type Attachment, type Challenge } from './model';

export function Favorite({ c, actions }: { c: Challenge; actions: Actions }) {
  return <Button kind="quiet" className="icon-only" title="Избранное" aria-label="Избранное"
    aria-pressed={c.favorite} disabled={actions.busy} onClick={() => void actions.act(c.id, 'favorite', { favorite: !c.favorite })}>
    <Glyph name="star" />
  </Button>;
}

function SessionButtons({ c, actions }: { c: Challenge; actions: Actions }) {
  return c.sessionStartedAt ? <>
    <Button kind="quiet" disabled={actions.busy} onClick={() => void actions.act(c.id, 'pause')}>
      <Glyph name="pause" /> Пауза
    </Button>
    <Button kind="quiet" disabled={actions.busy} onClick={() => void actions.act(c.id, 'pause', { discard: true })}>
      Не сохранять сеанс
    </Button>
  </> : <Button kind="quiet" disabled={actions.busy} onClick={() => void actions.act(c.id, 'resume')}>
    <Glyph name="play" /> Запустить таймер
  </Button>;
}

function SetAside({ c, actions }: { c: Challenge; actions: Actions }) {
  const [open, setOpen] = useState(false);
  return <div className="vault-dropdown" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}>
    <Button kind="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
      Отложить <Icon name="chevron" />
    </Button>
    {open && <div className="vault-menu">
      <Button kind="quiet" disabled={actions.busy} onClick={() => { setOpen(false); void actions.act(c.id, 'return'); }}>Вернуть в идеи</Button>
      <Button kind="quiet" disabled={actions.busy} onClick={() => { setOpen(false); actions.open({ kind: 'archive', challenge: c }); }}>В архив</Button>
    </div>}
  </div>;
}

function Restore({ c, actions }: { c: Challenge; actions: Actions }) {
  return <Button disabled={actions.busy} onClick={() => void actions.act(c.id, 'restore')}>Вернуть в идеи</Button>;
}

function StateButtons({ c, actions, showNote = false }: { c: Challenge; actions: Actions; showNote?: boolean }) {
  if (c.status === 'completed' || c.status === 'abandoned') return <>
    <Restore c={c} actions={actions} />
    {c.status === 'completed' && <Button kind="quiet" onClick={() => actions.open({ kind: 'result', challenge: c })}>Изменить результат</Button>}
  </>;
  return <>
    {c.status === 'backlog' && <Button kind="primary" disabled={actions.busy} onClick={() => void actions.act(c.id, 'start')}><Glyph name="play" /> Начать</Button>}
    <Button kind={c.status === 'active' ? 'primary' : 'secondary'} onClick={() => actions.open({ kind: 'complete', challenge: c })}>
      <Icon name="check" /> Завершить
    </Button>
    {showNote && <Button onClick={() => actions.open({ kind: 'note', challenge: c })}>Заметка</Button>}
    {c.status === 'active' ? <SetAside c={c} actions={actions} />
      : <Button kind="quiet" onClick={() => actions.open({ kind: 'archive', challenge: c })}>В архив</Button>}
  </>;
}

export function Active({ challenges, actions }: { challenges: Challenge[]; actions: Actions }) {
  const items = challenges.filter((c) => c.status === 'active').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return <>
    <PageHeading>В работе <span className="heading-count">{items.length}</span></PageHeading>
    {items.length === 0 && <Empty><p>Сейчас ничего не начато.</p><Link className="vault-link" to="/">Открыть список идей</Link></Empty>}
    {items.length >= 3 && <p className="ui-muted active-multiple">Идей в работе несколько. Лишние можно отложить.</p>}
    <div className="active-records">
      {items.map((c) => {
        const note = latestNote(c);
        return <article className="vault-panel active-record" key={c.id}>
          <div className="vault-row">
            <h2><Marker><Link to={challengePath(c.id)}>{c.title}</Link></Marker></h2>
            <Timer challenge={c} />
          </div>
          <ChallengeMeta challenge={c} showTags />
          {c.description && <p className="long-text ui-muted">{c.description}</p>}
          {c.spark && <div><h3>Почему захотелось</h3><p className="long-text">{c.spark}</p></div>}
          {note && <div><h3>Последняя заметка</h3><p className="long-text">{note}</p></div>}
          <div className="vault-actions session-actions">
            {c.startedAt && <span className="ui-muted">Начата {dateLabel(c.startedAt)}</span>}
            <SessionButtons c={c} actions={actions} />
          </div>
          <footer className="vault-row">
            <div className="vault-actions"><StateButtons c={c} actions={actions} showNote /></div>
            <DetailLink challenge={c} />
          </footer>
        </article>;
      })}
    </div>
  </>;
}

export function Collection({ challenges }: { challenges: Challenge[] }) {
  const [params] = useSearchParams();
  const done = challenges.filter((c) => c.status === 'completed')
    .sort((a, b) => Date.parse(b.completedAt ?? b.updatedAt) - Date.parse(a.completedAt ?? a.updatedAt));
  const years = new Map<number, Challenge[]>();
  for (const c of done) {
    const year = new Date(c.completedAt ?? c.updatedAt).getFullYear();
    const group = years.get(year) ?? [];
    group.push(c);
    years.set(year, group);
  }
  const minutes = done.reduce((sum, c) => sum + (c.actualDuration ?? 0), 0);
  return <>
    <PageHeading>Коллекция <span className="heading-count">{done.length}</span></PageHeading>
    {minutes > 0 && <p className="collection-time ui-muted">Потрачено {formatMinutes(minutes)}</p>}
    {done.length === 0 && <Empty>Пока ничего не сделано.</Empty>}
    {[...years].map(([year, entries]) => <section className="collection-year" key={year}>
      <h2>{year}</h2>
      <ul className="collection-grid">
        {entries.map((c) => <li key={c.id}><Link className="vault-panel collection-card" data-fresh={params.get('new') === c.id || undefined} to={challengePath(c.id)}>
          <div className="vault-row"><h3>{c.title}</h3><time className="ui-muted" dateTime={c.completedAt ?? c.updatedAt}>{dateLabel(c.completedAt)}</time></div>
          {c.result && <p className="long-text">{c.result}</p>}
          {c.spark && <p className="ui-muted long-text">{c.spark}</p>}
          {(c.actualDuration !== null || c.enjoymentScore !== null) && <p className="ui-muted">{[
            c.actualDuration !== null && `потрачено ${formatMinutes(c.actualDuration)}`,
            c.enjoymentScore !== null && `понравилось на ${c.enjoymentScore} из 10`,
          ].filter(Boolean).join(' · ')}</p>}
          <ChallengeMeta challenge={c} showTags />
        </Link></li>)}
      </ul>
    </section>)}
  </>;
}

export function Archive({ challenges, actions }: { challenges: Challenge[]; actions: Actions }) {
  const items = challenges.filter((c) => c.status === 'abandoned')
    .sort((a, b) => Date.parse(b.abandonedAt ?? b.updatedAt) - Date.parse(a.abandonedAt ?? a.updatedAt));
  return <>
    <PageHeading>Архив <span className="heading-count">{items.length}</span></PageHeading>
    {items.length ? <ul className="vault-list archive-list">
      {items.map((c) => <li className="vault-panel" key={c.id}>
        <div>
          <Link className="vault-link" to={challengePath(c.id)}>{c.title}</Link>
          <p className="ui-muted">{[
            c.abandonedAt && `в архиве с ${dateLabel(c.abandonedAt)}`,
            c.abandonReason,
            c.trackedSeconds >= 60 && `потрачено ${formatMinutes(Math.floor(c.trackedSeconds / 60))}`,
          ].filter(Boolean).join(' · ')}</p>
        </div>
        <Restore c={c} actions={actions} />
      </li>)}
    </ul> : <Empty>Архив пуст.</Empty>}
  </>;
}

function validWebURL(href: string) {
  try {
    const { protocol } = new URL(href);
    return protocol === 'http:' || protocol === 'https:';
  } catch { return false; }
}

function AttachedFile({ attachment: a, actions }: { attachment: Attachment; actions: Actions }) {
  const href = '/api/attachments/' + encodeURIComponent(a.id);
  const label = a.title ?? a.fileName ?? a.url ?? 'Заметка';
  const simpleImage = a.kind === 'image' && /^image\/(png|jpe?g|gif|webp|avif|bmp)$/.test(a.mimeType ?? '');
  return <li className="attachment">
    <div className="vault-row">
      {a.url && validWebURL(a.url) ? <a href={a.url} target="_blank" rel="noreferrer" className="vault-link">{label} <Icon name="next" /></a> : <strong>{label}</strong>}
      <div className="vault-actions">
        {a.storageKey && <a className={buttonClass('quiet')} href={href + '?download=1'} aria-label={`Скачать «${label}»`} title="Скачать"><Glyph name="download" /></a>}
        <Button kind="quiet" className="icon-only" disabled={actions.busy} aria-label={`Удалить вложение «${label}»`}
          onClick={() => { if (window.confirm('Удалить вложение?')) void actions.removeAttachment(a.id); }}><Icon name="trash" /></Button>
      </div>
    </div>
    {a.content && <p className="long-text">{a.content}</p>}
    {a.storageKey && simpleImage && <a href={href} target="_blank" rel="noreferrer"><img src={href} alt={label} loading="lazy" /></a>}
    {a.storageKey && a.kind === 'audio' && <audio controls preload="metadata" src={href} />}
    {!a.storageKey && ['image', 'audio', 'file'].includes(a.kind) && <p className="ui-muted">Файл недоступен.</p>}
  </li>;
}

function Notes({ c, actions }: { c: Challenge; actions: Actions }) {
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const content = String(new FormData(form).get('note') ?? '').trim();
    if (!content) return;
    if (await actions.act(c.id, 'note', { content })) form.reset();
  }
  return <section className="vault-panel detail-section">
    <h2>Журнал</h2>
    <form className="note-form" onSubmit={(event) => { void add(event).catch(() => {}); }}>
      <label>Новая заметка<textarea name="note" required maxLength={20_000} rows={3} /></label>
      <Button type="submit" disabled={actions.busy}>Добавить</Button>
    </form>
    {c.log.length > 0 && <ol className="vault-list notes-list">
      {[...c.log].reverse().map((entry) => <li key={entry.id} data-event={entry.kind === 'event' || undefined}>
        <div><time className="ui-muted" dateTime={entry.createdAt}>{dateLabel(entry.createdAt, true)}</time><p className="long-text">{entry.content}</p></div>
        {entry.kind === 'note' && <Button kind="quiet" className="icon-only" aria-label="Удалить заметку" disabled={actions.busy}
          onClick={() => { if (window.confirm('Удалить заметку?')) void actions.act(c.id, 'delete-note', { entryId: entry.id }); }}>
          <Icon name="trash" />
        </Button>}
      </li>)}
    </ol>}
  </section>;
}

const back: Record<Challenge['status'], { link: string; label: string }> = {
  backlog: { link: '/', label: 'Идеи' }, active: { link: '/active', label: 'В работе' },
  completed: { link: '/completed', label: 'Коллекция' }, abandoned: { link: '/archive', label: 'Архив' },
};

export function ChallengeDetail({ challenges, actions }: { challenges: Challenge[]; actions: Actions }) {
  const { id } = useParams();
  const c = challenges.find((challenge) => challenge.id === id);
  if (!c) return <NotFound />;
  return <div className="challenge-detail">
    <Link to={back[c.status].link} className="vault-link detail-back"><Glyph name="back" /> {back[c.status].label}</Link>
    <PageHeading actions={<>
      <Favorite c={c} actions={actions} />
      <Button kind="quiet" onClick={() => actions.open({ kind: 'edit', challenge: c })}><Icon name="pencil" /> Изменить</Button>
    </>}>{c.status === 'active' ? <Marker>{c.title}</Marker> : c.title}</PageHeading>
    <div className="vault-panel detail-section">
      <div className="vault-row">
        <span className="vault-status">{statusLabel[c.status]}</span>
        <time className="ui-muted" dateTime={c.createdAt}>Добавлена {dateLabel(c.createdAt)}</time>
      </div>
      <ChallengeMeta challenge={c} showTags />
      {c.description && <p className="long-text">{c.description}</p>}
      {c.spark && <div><h2>Почему захотелось</h2><p className="long-text">{c.spark}</p></div>}
      {c.result && <div><h2>Результат</h2><p className="long-text">{c.result}</p></div>}
      {c.enjoymentScore !== null && <p>Понравилось на {c.enjoymentScore} из 10</p>}
      {c.abandonReason && <p className="long-text ui-muted">Причина архивации: {c.abandonReason}</p>}
      <div className="vault-actions session-actions">
        <span className="ui-muted">Потрачено</span>
        {c.status === 'completed' && c.actualDuration !== null ? <span className="vault-clock">{formatMinutes(c.actualDuration)}</span> : <Timer challenge={c} />}
        <Button kind="quiet" onClick={() => actions.open({ kind: 'time', challenge: c })}>Изменить время</Button>
        {c.status === 'active' && <SessionButtons c={c} actions={actions} />}
      </div>
      <div className="vault-actions"><StateButtons c={c} actions={actions} /></div>
    </div>
    <Notes key={c.id} c={c} actions={actions} />
    <section className="vault-panel detail-section">
      <h2>Вложения</h2>
      <div className="vault-actions">
        <Button onClick={() => actions.open({ kind: 'link', challenge: c })}><Icon name="plus" /> Ссылка</Button>
        <Button onClick={() => actions.open({ kind: 'text', challenge: c })}><Icon name="plus" /> Текст</Button>
        <Button onClick={() => actions.open({ kind: 'file', challenge: c })}><Icon name="plus" /> Файл</Button>
      </div>
      {c.attachments.length > 0 && <ul className="vault-list attachment-list">
        {c.attachments.map((attachment) => <AttachedFile key={attachment.id} attachment={attachment} actions={actions} />)}
      </ul>}
    </section>
    <Button kind="danger" onClick={() => actions.open({ kind: 'delete', challenge: c })}><Icon name="trash" /> Удалить</Button>
  </div>;
}

export function NotFound() {
  return <Empty><h1>Идея не найдена</h1><Link className="vault-link" to="/">К идеям</Link></Empty>;
}
