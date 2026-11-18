import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTable, FaChartBar, FaRedo, FaExclamationCircle } from 'react-icons/fa';
import InfoTip from './InfoTip';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import DataTable from './DataTable';
import Button from './Button';
import s from './cards.module.css';

/**
 * The frame around every chart (DSN-020).
 *
 *   <ChartCard title="How much did Aanya learn each day?"
 *              answer="Most days 20-40 min, longest on Saturday."
 *              info="Minutes with at least one answered question."
 *              summary="Bar chart of minutes per day. Saturday is highest at 52 min."
 *              table={{ columns, rows }}
 *              loading={q.isLoading} error={q.error && 'Could not load'} onRetry={q.refetch}
 *              empty={rows.length === 0 && { title: 'No lessons yet', text: '…', actionLabel: 'Start', onAction }}>
 *     <StackedBars … />
 *   </ChartCard>
 *
 * Props:
 *  title    phrase it as the question the user is asking
 *  answer   one line that answers it (shown under the title)
 *  info     text for the "how is this calculated?" bubble
 *  summary  plain-text description for screen readers (aria-describedby)
 *  table    { columns, rows, caption?, getRowKey? } -> enables the "View as table" toggle
 *  actions  extra controls placed top right (a filter, an export button)
 *  legend   node shown under the chart (only when the chart needs one)
 *  loading / error (string|true) + onRetry / empty ({title,text,actionLabel,onAction}|true)
 *  footer   small print under the chart
 */
export default function ChartCard({
  title, answer, info, summary, table, actions, legend, footer, children,
  loading, error, onRetry, empty, className = '', headingLevel = 3,
}) {
  const { t } = useTranslation();
  const [asTable, setAsTable] = useState(false);
  const base = useId();
  const titleId = `${base}-t`;
  const sumId = `${base}-s`;
  const H = `h${headingLevel}`;

  let body;
  if (loading) {
    body = (
      <div aria-busy="true" aria-live="polite">
        <span className="d-sr-only">{t('dash.loading', { defaultValue: 'Loading' })}</span>
        <Skeleton variant="chart" />
      </div>
    );
  } else if (error) {
    body = (
      <div role="alert" className={s.errorBox}>
        <EmptyState
          compact
          tone="error"
          icon={FaExclamationCircle}
          title={t('dash.error.title', { defaultValue: 'We could not load this chart' })}
          text={typeof error === 'string' ? error : t('dash.error.text', { defaultValue: 'Something went wrong on our side. Your data is safe.' })}
        />
        {onRetry && (
          <Button variant="soft" icon={FaRedo} onClick={onRetry}>
            {t('dash.error.retry', { defaultValue: 'Try again' })}
          </Button>
        )}
      </div>
    );
  } else if (empty) {
    const e = empty === true ? {} : empty;
    body = (
      <EmptyState
        compact
        title={e.title || t('dash.empty.title', { defaultValue: 'Nothing to show yet' })}
        text={e.text || t('dash.empty.text', { defaultValue: 'Try a longer time range.' })}
        actionLabel={e.actionLabel}
        onAction={e.onAction}
        to={e.to}
      />
    );
  } else if (asTable && table) {
    body = <DataTable caption={table.caption || title} columns={table.columns} rows={table.rows} getRowKey={table.getRowKey} />;
  } else {
    body = <div className={s.chartBody}>{children}</div>;
  }

  return (
    <section
      className={`${s.card} ${s.chartCard} ${className}`}
      aria-labelledby={titleId}
      aria-describedby={summary ? sumId : undefined}
      data-print="section"
    >
      <header className={s.chartHead}>
        <div className={s.chartTitleBlock}>
          <div className={s.chartTitleRow}>
            <H id={titleId} className={s.chartTitle}>{title}</H>
            <InfoTip>{info}</InfoTip>
          </div>
          {answer && <p className={s.chartAnswer}>{answer}</p>}
        </div>
        <div className={s.chartActions} data-print="hide">
          {actions}
          {table && !loading && !error && !empty && (
            <button
              type="button"
              className={s.toggleBtn}
              aria-pressed={asTable}
              onClick={() => setAsTable((v) => !v)}
            >
              {asTable ? <FaChartBar aria-hidden="true" /> : <FaTable aria-hidden="true" />}
              <span>{asTable ? t('dash.chart.viewChart', { defaultValue: 'View as chart' }) : t('dash.chart.viewTable', { defaultValue: 'View as table' })}</span>
            </button>
          )}
        </div>
      </header>
      {body}
      {summary && <p id={sumId} className="d-sr-only">{summary}</p>}
      {legend && !asTable && !loading && !error && !empty && <div className={s.legendRow}>{legend}</div>}
      {footer && <div className={s.chartFooter}>{footer}</div>}
    </section>
  );
}
