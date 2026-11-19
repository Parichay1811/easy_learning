import EntryScene from "../Entry/EntryScene";

// Kept under its old name for the pages that still import it (the "I teach
// privately" sign-up, pages/teacher/SoloSignup.jsx): the dark circuit-board
// backdrop with robot icons is gone, and it now shows the same sunny meadow as
// the role page and every sign-in page, so the entry flow reads as one place.
// New pages should use components/Entry (EntryScene, EntryShell) directly.
const RoboticBackground = () => <EntryScene tint="#20c997" butterflies={2} />;

export default RoboticBackground;
