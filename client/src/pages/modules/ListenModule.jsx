import { FaHeadphones } from "react-icons/fa";
import ModulePlayer from "../../components/ModulePlayer/ModulePlayer";

// Listen: hear a word or a sentence, then answer.
const ListenModule = () => (
  <ModulePlayer
    module="listen"
    warriorSeconds={30}
    icon={FaHeadphones}
    accent="linear-gradient(135deg, #42a5f5, #1565c0)"
  />
);

export default ListenModule;
