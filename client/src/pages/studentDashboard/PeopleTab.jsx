import { useTranslation } from 'react-i18next'
import Mascot, { FloatingButterflies } from '../../components/Mascot/Mascot'
import c from './common.module.css'
import s from './PeopleTab.module.css'

/**
 * "My people": the grown-ups and teachers who follow this learner, and linking
 * a new one (the LinkParentCard passed in as children brings its own heading).
 * Wide screens add the puppy and a line about what linking means.
 */
export default function PeopleTab({ children }) {
  const { t } = useTranslation()
  return (
    <div className={s.wrap}>
      <aside className={`${c.card} ${s.intro}`}>
        <div className={s.sky} aria-hidden="true"><FloatingButterflies count={2} /></div>
        <Mascot size="var(--people-mascot)" mood="idle" />
        <p className={s.text}>{t('studentDash.people.text', 'Grown-ups you link can see your stars and badges, set a goal with you, and send you cheers.')}</p>
      </aside>
      <div className={s.slot}>{children}</div>
    </div>
  )
}
