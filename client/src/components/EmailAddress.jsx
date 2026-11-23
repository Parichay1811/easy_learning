// An email address that may wrap only after the "@" on a narrow screen, so the
// domain is never cut in the middle ("…analytic" / "s.eu").
export default function EmailAddress({ email }) {
  const at = String(email).indexOf("@");
  if (at < 0) return email;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}
