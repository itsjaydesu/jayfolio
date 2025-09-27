import Link from 'next/link';
import { formatDisplayDate } from '../lib/formatters';

export default function EntryDetail({ type, entry }) {
  if (!entry) return null;
  const { title, summary, content, tags, createdAt } = entry;
  const dateLabel = createdAt ? formatDisplayDate(createdAt) : '';

  return (
    <div className={`detail-view detail-view--${type}`}>
      <header className="detail-view__header">
        <nav className="detail-view__nav" aria-label="Detail navigation">
          <Link href={`/${type}`} className="detail-view__back">
            ← Back to {type}
          </Link>
          <div className="detail-view__stamps">
            {dateLabel && <span>{dateLabel}</span>}
            {tags?.length ? <span>{tags.join(' • ')}</span> : null}
          </div>
        </nav>
        <div className="detail-view__intro">
          <h1>{title}</h1>
          {summary && <p>{summary}</p>}
        </div>
      </header>
      <article className="detail-view__body">
        <div className="detail-view__content" dangerouslySetInnerHTML={{ __html: content }} />
      </article>
    </div>
  );
}
