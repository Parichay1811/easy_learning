// Who makes Learnigo, and how to reach them. One place, used by the footer, Contact
// Us, About Us, the policy pages, the entry page and the structured data for search.
export const COMPANY = {
  name: "Futuresight Analytics Limited",
  shortName: "Futuresight Analytics",
  url: "https://futuresightanalytics.eu/",
  site: "futuresightanalytics.eu",
  emails: {
    // Families, learners, help with an account, feedback, privacy and data requests.
    info: "info@futuresightanalytics.eu",
    // Schools, organisations, therapists, partnerships and plans.
    solutions: "solutions@futuresightanalytics.eu",
  },
};

/** schema.org description of the company (for structured data). */
export const companyOrganization = () => ({
  "@type": "Organization",
  "@id": `${COMPANY.url}#organization`,
  name: COMPANY.name,
  url: COMPANY.url,
  email: COMPANY.emails.info,
  contactPoint: [
    { "@type": "ContactPoint", contactType: "customer support", email: COMPANY.emails.info, availableLanguage: ["en"] },
    { "@type": "ContactPoint", contactType: "sales", email: COMPANY.emails.solutions, availableLanguage: ["en"] },
  ],
});

export default COMPANY;
