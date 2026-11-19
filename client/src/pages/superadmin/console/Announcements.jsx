// Platform announcements (FND-052 / SUP-063): write one for everyone or a
// segment and see read rates side by side; what was sent to me on its own tab.
import { useTranslation } from "react-i18next";
import { usePane } from "../../../components/dashboard";
import { AnnouncementComposer, AnnouncementsPanel } from "../../../components/comms";
import { TabBody, Tabs } from "./ui";
import s from "./console.module.css";

export default function Announcements() {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["send", "inbox"]);
  return (
    <>
      <Tabs label={t("sa.nav.announcements", "Announcements")} value={pane} onChange={setPane} tabs={[
        { key: "send", label: t("sa.ann.send", "Write and track") },
        { key: "inbox", label: t("sa.ann.inbox", "Sent to me") },
      ]} />
      <TabBody value={pane}>
        {pane === "send" ? (
          <div className={s.annGrid}><AnnouncementComposer role="superadmin" /></div>
        ) : <AnnouncementsPanel role="superadmin" compact />}
      </TabBody>
    </>
  );
}
