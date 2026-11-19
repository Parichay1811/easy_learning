import { FaBookOpen } from "react-icons/fa";
import ModulePlayer from "../../components/ModulePlayer/ModulePlayer";

// Read: read a word, a sentence or a short passage, then answer.
const ReadModule = () => (
  <ModulePlayer
    module="read"
    warriorSeconds={30}
    icon={FaBookOpen}
    accent="linear-gradient(135deg, #66bb6a, #2e7d32)"
  />
);

export default ReadModule;
