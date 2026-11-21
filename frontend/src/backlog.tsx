import { Fragment, useEffect, useState } from 'react';
import { Button, Icon, PageHeading } from '@home-apps/ui';
import { Link, useSearchParams } from 'react-router';
import { ChallengeMeta, DetailLink, Empty, Glyph, Marker, Timer } from './common';
import { formatMinutes } from './duration';
import { challengePath, latestNote, statusLabel, totalSeconds, type Actions, type Challenge } from './model';

const sorts = [
  ['newest', 'Сначала новые'], ['oldest', 'Сначала старые'], ['updated', 'Недавно изменённые'],
  ['estimate', 'По времени'], ['random', 'Случайный порядок'],
];
const timeFilters = [
  ['', 'Любое время'], ['30m', 'До 30 мин'], ['1h', 'До 1 ч'], ['1-3h', '1–3 ч'], ['3h+', 'Больше 3 ч'],
];
const locationFilters = [['', 'Любое место'], ['home', 'Дома'], ['outside', 'Не дома']];
const moneyFilters = [['', 'Любые расходы'], ['free', 'Бесплатно'], ['money', 'Платно']];

function matches(c: Challenge, query: string) {
  const terms = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean).slice(0, 8);
  if (!terms.length) return true;
  const words = [
    c.title, c.description, c.spark, c.result, c.category, ...c.tags,
    ...c.log.map((e) => e.content),
    ...c.attachments.flatMap((a) => [a.title, a.url, a.content, a.fileName]),
  ].filter(Boolean).join('\n').toLocaleLowerCase('ru');
  return terms.every((term) => words.includes(term));
}

function seededShuffle<T>(items: T[], seed: number) {
  let a = seed >>> 0;
  for (let index = items.length - 1; index > 0; index--) {
    a = (a + 0x6d2b79f5) >>> 0;
    let n = Math.imul(a ^ (a >>> 15), a | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    const next = Math.floor((((n ^ (n >>> 14)) >>> 0) / 4294967296) * (index + 1));
    [items[index], items[next]] = [items[next], items[index]];
  }
  return items;
}

function filtered(c: Challenge, params: URLSearchParams) {
  if (!matches(c, params.get('q') ?? '')) return false;
  const topic = params.get('topic')?.toLocaleLowerCase('ru');
  if (topic && ![c.category, ...c.tags].some((tag) => tag?.toLocaleLowerCase('ru') === topic)) return false;
  if (params.get('fav') === '1' && !c.favorite) return false;
  const place = params.get('location');
  if (place === 'outside' && c.requiresLeavingHome !== true) return false;
  if (place === 'home' && c.requiresLeavingHome === true) return false;
  const money = params.get('money');
  if (money === 'money' && c.requiresMoney !== true) return false;
  if (money === 'free' && c.requiresMoney === true) return false;
  const minutes = c.estimatedDuration;
  switch (params.get('time')) {
    case '30m': return minutes !== null && minutes <= 30;
    case '1h': return minutes !== null && minutes <= 60;
    case '1-3h': return minutes !== null && minutes > 60 && minutes <= 180;
    case '3h+': return minutes !== null && minutes > 180;
    default: return true;
  }
}

function sortCards(cards: Challenge[], sort: string, seed: number) {
  const tie = (a: Challenge, b: Challenge) => a.id.localeCompare(b.id);
  const newest = (a: Challenge, b: Challenge) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || tie(a, b);
  switch (sort) {
    case 'oldest': return cards.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || tie(a, b));
    case 'updated': return cards.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || tie(a, b));
    case 'estimate': return cards.sort((a, b) => (a.estimatedDuration ?? Infinity) - (b.estimatedDuration ?? Infinity) || newest(a, b));
    case 'random': return seededShuffle(cards.sort(tie), seed);
    default: return cards.sort(newest);
  }
}

function useColumns() {
  const read = () => window.matchMedia('(max-width: 650px)').matches ? 2 : window.matchMedia('(max-width: 900px)').matches ? 3 : 4;
  const [columns, setColumns] = useState(read);
  useEffect(() => {
    const queries = [window.matchMedia('(max-width: 650px)'), window.matchMedia('(max-width: 900px)')];
    const update = () => setColumns(read());
    queries.forEach((q) => q.addEventListener('change', update));
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);
  return columns;
}

function ActiveStrip({ challenge: c }: { challenge: Challenge }) {
  const note = latestNote(c);
  const summary = note || c.spark || c.description;
  return <article className="active-strip">
    <div className="active-strip-copy">
      <Marker><Link to={challengePath(c.id)}>{c.title}</Link></Marker>
      {summary && <p>{note && 'Последняя заметка: '}{summary}</p>}
    </div>
    <div className="active-strip-clock">
      <Timer challenge={c} />
      <Link className="vault-link" to="/active">В работе <Icon name="next" /></Link>
    </div>
  </article>;
}

function Card({ c, selected, select, actions }: {
  c: Challenge; selected: boolean; select: () => void; actions: Actions;
}) {
  return <article className="idea-card" data-backlog-card data-selected={selected || undefined}>
    <div className="idea-topline">
      <h3><button className="card-hit" aria-expanded={selected} aria-controls={selected ? 'open-idea' : undefined} onClick={select}>{c.title}</button></h3>
      <Button kind="quiet" className="card-star" aria-pressed={c.favorite} aria-label="Избранное" title="Избранное"
        disabled={actions.busy} onClick={() => void actions.act(c.id, 'favorite', { favorite: !c.favorite })}>
        <Glyph name="star" />
      </Button>
    </div>
    {(c.spark || c.description) && <p>{c.spark || c.description}</p>}
  </article>;
}

function CardDetail({ c, actions }: { c: Challenge; actions: Actions }) {
  return <section id="open-idea" className="idea-detail" aria-label={c.title + ' — подробности'}>
    {c.description && <p>{c.description}</p>}
    <div className="vault-actions">
      <Button kind="primary" className="vault-small" disabled={actions.busy} onClick={() => void actions.act(c.id, 'start')}>
        <Glyph name="play" /> Начать
      </Button>
      <DetailLink challenge={c} />
    </div>
    <ChallengeMeta challenge={c} />
  </section>;
}

function Stats({ records }: { records: Challenge[] }) {
  const year = new Date().getFullYear();
  const isThisYear = (date: string | null) => date !== null && new Date(date).getFullYear() === year;
  const completed = records.filter((c) => c.status === 'completed' && isThisYear(c.completedAt)).length;
  const topics = new Map<string, { label: string; minutes: number }>();
  let total = 0;
  for (const c of records) {
    if (!isThisYear(c.completedAt) && !isThisYear(c.startedAt) && c.status !== 'active') continue;
    const minutes = c.status === 'completed' && c.actualDuration !== null ? c.actualDuration : Math.round(totalSeconds(c) / 60);
    total += minutes;
    if (minutes <= 0) continue;
    const label = c.category || c.tags[0] || 'Другое';
    const key = label.toLocaleLowerCase('ru');
    const row = topics.get(key) ?? { label, minutes: 0 };
    row.minutes += minutes;
    topics.set(key, row);
  }
  const entries = [...topics.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 5);
  return <details className="vault-stats">
    <summary>За {year} год</summary>
    <div className="stats-grid">
      <dl>
        <div><dt>Сделано</dt><dd>{completed}</dd></div>
        <div><dt>Потрачено</dt><dd>{formatMinutes(total)}</dd></div>
      </dl>
      <div><h2>Больше всего времени</h2>
        {entries.length ? <ol>{entries.map((entry) => <li key={entry.label}>{entry.label} <span>{formatMinutes(entry.minutes)}</span></li>)}</ol>
          : <p className="ui-muted">Пока нет данных.</p>}
      </div>
    </div>
  </details>;
}

export function Backlog({ challenges, actions }: { challenges: Challenge[]; actions: Actions }) {
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const columns = useColumns();
  const sort = params.get('sort') ?? 'newest';
  const query = params.get('q') ?? '';
  const seed = Number.parseInt(params.get('seed') ?? '', 10) || 1;
  const all = challenges.filter((c) => c.status === 'backlog');
  const active = challenges.filter((c) => c.status === 'active').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const cards = sortCards(all.filter((challenge) => filtered(challenge, params)), sort, seed);
  const selectedIndex = cards.findIndex((card) => card.id === selected);
  const insertAt = selectedIndex < 0 ? -1 : Math.min(cards.length, (Math.floor(selectedIndex / columns) + 1) * columns) - 1;
  const elsewhere = query.trim() ? challenges.filter((c) => c.status !== 'backlog' && matches(c, query))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 30) : [];
  const topicCounts = new Map<string, { label: string; count: number }>();
  for (const c of all) {
    const labels = new Map([c.category, ...c.tags].filter((v): v is string => Boolean(v)).map((v) => [v.toLocaleLowerCase('ru'), v]));
    for (const [key, label] of labels) {
      const current = topicCounts.get(key);
      topicCounts.set(key, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
    }
  }
  const topics = [...topicCounts].sort(([, a], [, b]) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
  const filterCount = ['time', 'location', 'money'].filter((key) => params.has(key)).length;
  const hasFilters = Boolean(query || params.get('topic') || params.get('fav') || filterCount);
  const change = (patch: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace, preventScrollReset: true });
  };

  return <>
    {active.length > 0 && <section className="active-strips" aria-label="В работе">
      {active.map((c) => <ActiveStrip key={c.id} challenge={c} />)}
    </section>}
    <section className="backlog">
      <PageHeading actions={challenges.length > 0 && <label className="vault-sort">
        <span className="ui-sr-only">Сортировка</span>
        <select value={sort} onChange={(e) => change({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
          {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Icon name="chevron" />
      </label>}>
        Идеи <span className="heading-count" aria-label={hasFilters ? `Найдено ${cards.length} из ${all.length}` : undefined}>
          {hasFilters ? `${cards.length} / ${all.length}` : all.length}
        </span>
      </PageHeading>
      {challenges.length ? <>
        <div className="vault-filters">
          <label className="vault-search"><Glyph name="search" />
            <input type="search" aria-label="Поиск по идеям" placeholder="Поиск по идеям" maxLength={200} value={query}
              onChange={(e) => change({ q: e.target.value }, true)} />
          </label>
          <div className="vault-actions">
            <Button kind="quiet" aria-expanded={showFilters} aria-controls="backlog-context-filters" onClick={() => setShowFilters(!showFilters)}>
              <Glyph name="filter" /> <span>Фильтры{filterCount ? ` (${filterCount})` : ''}</span>
            </Button>
            <Button kind="quiet" className="icon-only" aria-label="Случайный порядок" title="Случайный порядок"
              aria-pressed={sort === 'random'} onClick={() => change({ sort: 'random', seed: String(Math.floor(Math.random() * 0xffffffff)) })}>
              <Glyph name="shuffle" />
            </Button>
            <Button kind="quiet" className="icon-only" aria-label="Только избранное" title="Только избранное"
              aria-pressed={params.get('fav') === '1'} onClick={() => change({ fav: params.get('fav') === '1' ? '' : '1' })}>
              <Glyph name="star" />
            </Button>
          </div>
        </div>
        {showFilters && <div className="context-filters vault-panel" id="backlog-context-filters">
          {[
            { name: 'time', label: 'Время', options: timeFilters },
            { name: 'location', label: 'Место', options: locationFilters },
            { name: 'money', label: 'Расходы', options: moneyFilters },
          ].map(({ name, label, options }) => <label key={name}>{label}
            <select value={params.get(name) ?? ''} onChange={(e) => change({ [name]: e.target.value })}>
              {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>)}
          {hasFilters && <Button kind="quiet" onClick={() => change({ time: '', location: '', money: '', topic: '', q: '', fav: '' })}>Сбросить</Button>}
        </div>}
        <div className="topic-chips" aria-label="Темы">
          <Button kind="quiet" aria-pressed={!params.get('topic')} onClick={() => change({ topic: '' })}>Все темы</Button>
          {topics.map(([key, topic]) => <Button key={key} kind="quiet" aria-pressed={params.get('topic') === key}
            onClick={() => change({ topic: params.get('topic') === key ? '' : key })}>{topic.label}</Button>)}
        </div>
        {cards.length ? <div className="ideas-grid">
          {cards.map((c, index) => <Fragment key={c.id}>
            <Card c={c} selected={index === selectedIndex} select={() => setSelected(selected === c.id ? null : c.id)} actions={actions} />
            {index === insertAt && <CardDetail c={cards[selectedIndex]} actions={actions} />}
          </Fragment>)}
        </div> : <Empty><p>{all.length ? 'Ничего не найдено. Попробуйте изменить фильтры.' : 'Идей в списке пока нет.'}</p></Empty>}
      </> : <Empty>
        <p>Пока нет идей.</p>
        <Button kind="primary" onClick={() => actions.open({ kind: 'capture' })}><Icon name="plus" /> Поймать идею</Button>
      </Empty>}
      {elsewhere.length > 0 && <section className="elsewhere">
        <h2>В других разделах</h2>
        <ul className="vault-list">{elsewhere.map((c) => <li key={c.id}>
          <Link className="vault-link" to={challengePath(c.id)}>{c.title}</Link><span className="ui-muted">{statusLabel[c.status]}</span>
        </li>)}</ul>
      </section>}
    </section>
    {challenges.length > 0 && <Stats records={challenges} />}
  </>;
}
