import { FaPencilAlt } from "react-icons/fa";
import ModulePlayer from "../../components/ModulePlayer/ModulePlayer";

// Write: type, build or order the answer. A longer clock in Warrior mode,
// because typing takes longer than tapping.
const WriteModule = () => (
  <ModulePlayer
    module="write"
    warriorSeconds={60}
    icon={FaPencilAlt}
    accent="linear-gradient(135deg, #ffa040, #e65100)"
  />
);

export default WriteModule;
