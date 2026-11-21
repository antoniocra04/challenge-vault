import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@home-apps/ui';
import { Link } from 'react-router';
import { formatMinutes } from './duration';
import { challengePath, totalSeconds, type Challenge } from './model';

const icons = {
  archive: 'M4 4h16v5H4z M6 9v10h12V9m-8 4h4',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4v4l3 2',
  play: 'm8 5 12 7-12 7V5Z',
  pause: 'M8 5v14m8-14v14',
  search: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4 10 5 5',
  filter: 'M4 7h4m4 0h8M4 17h10m4 0h2M8 5v4m4-4v4m2 6v4m4-4v4',
  star: 'm12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9-5.3-2.79-5.3 2.79 1.01-5.9-4.29-4.18 5.93-.86L12 3Z',
  shuffle: 'M3 7h3c4 0 6 10 10 10h5m-3-3 3 3-3 3M3 17h3c1.4 0 2.5-1.3 3.5-3m5-5c.5-1 1-2 2.5-2h4m-3-3 3 3-3 3',
  download: 'M12 4v11m-4-4 4 4 4-4M5 17v3h14v-3',
  back: 'm14 6-6 6 6 6',
};

export function Glyph({ name }: { name: keyof typeof icons | 'stack' | 'check' }) {
  if (name === 'stack' || name === 'check') return <Icon name={name} />;
  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name]} /></svg>;
}

export function Marker({ children }: { children: ReactNode }) {
  return <span className="vault-marker">
    <svg viewBox="0 0 240 43" preserveAspectRatio="none" aria-hidden="true">
      <path d="M198 5C132-5 17 1 6 14-5 26 20 38 61 39c80 3 164-2 173-14 8-11-17-16-44-20" />
    </svg>
    {children}
  </span>;
}

export function Timer({ challenge }: { challenge: Challenge }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!challenge.sessionStartedAt) return;
    const id = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [challenge.sessionStartedAt]);
  const seconds = totalSeconds(challenge);
  const format = (n: number) => String(n).padStart(2, '0');
  return <span className="vault-clock ui-number" aria-label="Потрачено времени">
    {format(Math.floor(seconds / 3600))}:{format(Math.floor(seconds / 60) % 60)}:{format(seconds % 60)}
  </span>;
}

export function DetailLink({ challenge }: { challenge: Challenge }) {
  return <Link className="vault-link" to={challengePath(challenge.id)}>Подробнее <Icon name="next" /></Link>;
}

export function ChallengeMeta({ challenge: c, showTags = false }: { challenge: Challenge; showTags?: boolean }) {
  const parts = [
    c.estimatedDuration !== null ? formatMinutes(c.estimatedDuration) : null,
    c.requiresLeavingHome === null ? null : c.requiresLeavingHome ? 'Не дома' : 'Дома',
    c.requiresMoney === null ? null : c.requiresMoney ? 'Платно' : 'Бесплатно',
    c.category,
    ...(showTags ? c.tags.map((tag) => '#' + tag) : []),
  ].filter((part): part is string => Boolean(part));
  if (c.startedAt && c.status === 'backlog') parts.push('Идея уже начиналась');
  return parts.length > 0 && <ul className="vault-meta">{parts.map((part, index) => <li key={index}>{part}</li>)}</ul>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="vault-panel vault-empty">{children}</div>;
}
