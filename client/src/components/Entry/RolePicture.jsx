// One role's painted picture (rolePictures.js) as a responsive <picture>:
// AVIF, then WebP, in the width `sizes` asks for. Decorative: the card or the
// page next to it says the words, so screen readers skip it. The intrinsic
// size is set (square), so nothing moves when it arrives.
import { ROLE_PICTURES } from "./rolePictures";

/**
 * <RolePicture role="student" sizes="…" priority />
 * `priority`: on screen at once (fetched first, never lazy).
 */
export default function RolePicture({ role, sizes, priority = false, className, imgClassName, style }) {
  const p = ROLE_PICTURES[role];
  if (!p) return null;
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={p.avifSet} sizes={sizes} />
      <source type="image/webp" srcSet={p.webpSet} sizes={sizes} />
      <img
        src={p.src}
        alt=""
        width="320"
        height="320"
        className={imgClassName}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable="false"
      />
    </picture>
  );
}
