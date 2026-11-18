import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaExclamationTriangle, FaFeatherAlt, FaMountain } from 'react-icons/fa';
import DataTable from '../DataTable';
import { fmtNumber, fmtPercent } from '../format';
import { itemFlag } from '../utils';
import s from './charts.module.css';

const FLAGS = {
  check: { Icon: FaExclamationTriangle, text: 'Check this question', cls: 'flagCheck' },
  hard: { Icon: FaMountain, text: 'Very hard', cls: 'flagHard' },
  easy: { Icon: FaFeatherAlt, text: 'Very easy', cls: 'flagEasy' },
  few: { Icon: FaFeatherAlt, text: 'Few answers', cls: 'flagEasy' },
  ok: { Icon: FaCheckCircle, text: 'Looks good', cls: 'flagOk' },
};

/**
 * "Which questions were hard or broken?" Sortable question statistics.
 *
 *   <ItemAnalysisTable items={[{ id: 'q1', question: 'What is 3/4 + 1/4?', attempts: 120,
 *       pctCorrect: 0.82, discrimination: 0.41, avgSeconds: 28,
 *       commonWrong: { answer: '4/8', pct: 0.11 } }]} onSelect={(item) => …} />
 *
 * Props: items [{id, question, attempts?, pctCorrect (0..1), discrimination (-1..1, optional),
 *        avgSeconds, commonWrong?: {answer, pct}, flag?}], onSelect(item), caption.
 * Discrimination says how well a question separates strong from weak students: above 0.3 is good,
 * under 0.1 means strong students miss it as often as weak ones, so check the question itself.
 */
export default function ItemAnalysisTable({ items = [], onSelect, caption }) {
  const { t } = useTranslation();
  const columns = [
    {
      key: 'question', label: t('dash.item.question', { defaultValue: 'Question' }), sortable: true,
      render: (r) => <span className={s.itemQ}>{r.question}</span>,
    },
    {
      key: 'pctCorrect', label: t('dash.item.correct', { defaultValue: '% correct' }), sortable: true, align: 'end',
      render: (r) => (
        <span className={s.itemPct}>
          <span className={s.itemBar} aria-hidden="true"><span style={{ width: `${Math.round((r.pctCorrect || 0) * 100)}%` }} /></span>
          <strong>{fmtPercent(r.pctCorrect)}</strong>
        </span>
      ),
    },
    {
      key: 'discrimination', label: t('dash.item.disc', { defaultValue: 'Separates strong from weak' }), sortable: true, align: 'end',
      render: (r) => (r.discrimination == null ? '—' : fmtNumber(r.discrimination, { digits: 2, minDigits: 2 })),
    },
    {
      key: 'avgSeconds', label: t('dash.item.time', { defaultValue: 'Average time' }), sortable: true, align: 'end',
      render: (r) => (r.avgSeconds == null ? '—' : `${fmtNumber(r.avgSeconds, { digits: 0 })} s`),
    },
    {
      key: 'commonWrong', label: t('dash.item.wrong', { defaultValue: 'Most common wrong answer' }),
      sortValue: (r) => r.commonWrong?.pct ?? null,
      sortable: true,
      render: (r) => (r.commonWrong ? <span>{r.commonWrong.answer} <span className={s.itemMuted}>({fmtPercent(r.commonWrong.pct)})</span></span> : '—'),
    },
    {
      key: 'flag', label: t('dash.item.flag', { defaultValue: 'Status' }),
      sortValue: (r) => ['check', 'hard', 'few', 'easy', 'ok'].indexOf(itemFlag(r)), sortable: true,
      render: (r) => {
        const f = FLAGS[itemFlag(r)];
        return <span className={`${s.flag} ${s[f.cls]}`}><f.Icon aria-hidden="true" />{t(`dash.item.flag_${itemFlag(r)}`, { defaultValue: f.text })}</span>;
      },
    },
  ];
  return (
    <DataTable
      caption={caption || t('dash.item.caption', { defaultValue: 'Question statistics' })}
      columns={columns}
      rows={items}
      getRowKey={(r) => r.id}
      onRowClick={onSelect}
      defaultSort={{ key: 'flag', dir: 'asc' }}
    />
  );
}
