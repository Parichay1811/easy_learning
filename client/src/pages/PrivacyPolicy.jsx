import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import { COMPANY } from "../config/company";
import styles from "./PrivacyPolicy.module.css";

const sections = [
  {
    title: "Who provides Learnigo",
    text: <>Learnigo is a product of {COMPANY.name} (<a href={COMPANY.url} target="_blank" rel="noopener noreferrer" className={styles.link}>{COMPANY.site}</a>), which provides and runs the service and looks after the personal information described here.</>,
  },
  {
    title: "What information we collect",
    text: "To create an account and run Learnigo, we collect basic profile information (name, email, role), the learning activity needed to track progress (XP, levels, streaks, round results, achievement badges) and, for organizations, batch and student management data.",
  },
  {
    title: "How we use your information",
    list: [
      "To create and manage student, parent, teacher, admin and super-admin accounts.",
      "To track and display learning progress on the student dashboard.",
      "To let organizations (schools and coaching centres) manage their own batches and students.",
      "To respond to messages sent through the Contact Us form.",
      "To improve Learnigo's content, features and accessibility.",
    ],
  },
  {
    title: "Children's privacy",
    text: "Learnigo is built for children roughly aged 5 to 14. A parent, teacher or organization administrator creates or approves accounts for children, and we only collect the information needed to run the learning platform. We do not sell children's personal information.",
  },
  {
    title: "How we protect your information",
    text: "Account passwords are stored encrypted, and access to student and organization data is restricted by role. We take reasonable technical and organizational steps to protect data against unauthorized access, loss or misuse.",
  },
  {
    title: "Data sharing",
    text: "We do not sell personal information. Data is only shared within the organization a student belongs to (e.g. a teacher viewing their own batch's students) or with service providers who help us run Learnigo, under the same confidentiality standards.",
  },
  {
    title: "Your rights",
    text: <>You can request access to, correction of, or deletion of your personal information at any time by writing to <a href={`mailto:${COMPANY.emails.info}`} className={styles.link}>{COMPANY.emails.info}</a>. Parents and organization administrators can request the same on behalf of a child or student they are responsible for.</>,
  },
  {
    title: "Changes to this policy",
    text: "We may update this Privacy Policy from time to time. Continued use of Learnigo after changes are posted means you accept the updated policy.",
  },
  {
    title: "Contact us",
    text: <>Questions about this Privacy Policy, or a request about your data? Write to <a href={`mailto:${COMPANY.emails.info}`} className={styles.link}>{COMPANY.emails.info}</a> (schools and organisations: <a href={`mailto:${COMPANY.emails.solutions}`} className={styles.link}>{COMPANY.emails.solutions}</a>), or use our <a href="/contact-us" className={styles.link}>Contact Us</a> page. We usually reply within 24 hours.</>,
  },
];

const PrivacyPolicy = () => {
  return (
    <div className={styles.page}>
      <SEO path="/policy" />
      <VideoBackground />

      <div className={styles.hero}>
        <span className={styles.badge}>Your Data, Protected</span>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>
          How Learnigo collects, uses and protects your information.
        </p>
        <p className={styles.updated}>Last updated: November 2026</p>
      </div>

      <div className={styles.panel}>
        {sections.map((section) => (
          <div key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.text && <p className={styles.text}>{section.text}</p>}
            {section.list && (
              <ul className={styles.list}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className={styles.footerNote}>
        Have a question about your data? <a href="/contact-us" className={styles.link}>Get in touch</a>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
