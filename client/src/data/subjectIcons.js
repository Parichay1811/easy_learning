// Custom illustrated icons for each subject "world". 384 px WebP (about 37 KB each):
// twice the largest size they are shown at. The 1254 px PNG masters (1.0-1.3 MB each)
// stay next to them in assets/ and are not bundled; to remake one:
//   cwebp -q 86 -alpha_q 95 -m 6 -resize 384 384 eng.png -o eng.webp
import engIcon from "../assets/eng.webp";
import matIcon from "../assets/mat.webp";
import scienceIcon from "../assets/science.webp";

export const SUBJECT_ICON_IMAGES = {
  english: engIcon,
  maths: matIcon,
  science: scienceIcon,
};
