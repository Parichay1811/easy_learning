/** The icon for each kind of finding, and for each trend direction. Always shown with a word. */
import {
  FaSeedling, FaStar, FaBullseye, FaHandsHelping, FaCalendarCheck, FaHeart, FaHourglassHalf,
  FaArrowUp, FaArrowDown, FaArrowRight, FaMinus,
} from 'react-icons/fa'

export const KIND_ICON = {
  gettingBetter: FaSeedling,
  strength: FaStar,
  needsPractice: FaBullseye,
  independence: FaHandsHelping,
  consistency: FaCalendarCheck,
  effort: FaHeart,
  notEnough: FaHourglassHalf,
}

export const ARROW_ICON = { up: FaArrowUp, down: FaArrowDown, flat: FaArrowRight, none: FaMinus }
