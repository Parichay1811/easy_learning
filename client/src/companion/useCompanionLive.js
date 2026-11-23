import { useSyncExternalStore } from "react";
import { isLive, onLive } from "./bus";

/** True while the live companion is on screen (spots it is not in stay empty). */
export function useCompanionLive() {
  return useSyncExternalStore(onLive, isLive, () => false);
}

export default useCompanionLive;
