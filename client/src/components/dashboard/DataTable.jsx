import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import s from './cards.module.css';

const MAX_ROWS = 500;

/**
 * Accessible sortable table. Also what ChartCard's "view as table" shows.
 * On phones each row becomes a small card with "label: value" lines.
 *
 *   <DataTable caption="Minutes per day"
 *     columns={[{ key: 'date', label: 'Date' },
 *               { key: 'min', label: 'Minutes', align: 'end', sortable: true,
 *                 render: (r) => fmtDuration(r.min), sortValue: (r) => r.min }]}
 *     rows={rows} getRowKey={(r) => r.date} onRowClick={open} defaultSort={{ key: 'min', dir: 'desc' }} />
 *
 * columns[]: { key, label, align?: 'start'|'end'|'center', sortable?, render?(row), sortValue?(row), header? (node) }
 * Shows at most 500 rows (aggregate before you get here).
 */
export default function DataTable({ columns, rows, caption, getRowKey, onRowClick, defaultSort, className = '' }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState(defaultSort || null);

  const sorted = useMemo(() => {
    const list = rows || [];
    if (!sort) return list;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return list;
    const val = col.sortValue || ((r) => r[col.key]);
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1; // missing data always last
      if (y == null) return -1;
      const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return sort.dir === 'desc' ? -c : c;
    });
  }, [rows, sort, columns]);

  const shown = sorted.slice(0, MAX_ROWS);
  const toggle = (col) =>
    setSort((cur) => (cur && cur.key === col.key ? { key: col.key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));

  return (
    <div className={`${s.tableWrap} ${className}`} role="region" aria-label={caption} tabIndex={0}>
      <table className={s.table}>
        {caption && <caption className="d-sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort && sort.key === c.key;
              const SortIcon = !active ? FaSort : sort.dir === 'asc' ? FaSortUp : FaSortDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={s[`ta_${c.align || 'start'}`]}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined}
                >
                  {c.sortable ? (
                    <button type="button" className={s.thBtn} onClick={() => toggle(c)}>
                      {c.header || c.label}
                      <SortIcon aria-hidden="true" className={active ? s.sortOn : s.sortOff} />
                    </button>
                  ) : (
                    c.header || c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr
              key={getRowKey ? getRowKey(r) : i}
              className={onRowClick ? s.rowAction : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(r)) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={s[`ta_${c.align || 'start'}`]}>
                  {c.render ? c.render(r) : r[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > MAX_ROWS && (
        <p className={s.tableNote}>
          {t('dash.table.capped', { defaultValue: 'Showing the first {{n}} of {{total}} rows.', n: MAX_ROWS, total: sorted.length })}
        </p>
      )}
    </div>
  );
}
