// Barlow Semi Condensed (SIL OFL 1.1, @fontsource/barlow-semi-condensed) embedded as bytes so the game needs no
// server or network. Registered through the FontFace API; the HUD falls back to system sans until it resolves.
import w500 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-500-normal.woff2' with { type: 'bytes' };
import w600 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2' with { type: 'bytes' };
import w700 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-700-normal.woff2' with { type: 'bytes' };
import w800 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-800-normal.woff2' with { type: 'bytes' };

export const FONT_FAMILY = 'Barlow Semi Condensed';
let loading = null;

export function loadFonts() {
  if (loading) return loading;
  if (typeof FontFace === 'undefined' || !document.fonts) return (loading = Promise.resolve(false));
  const faces = [[w500, '500'], [w600, '600'], [w700, '700'], [w800, '800']].map(([bytes, weight]) => {
    const f = new FontFace(FONT_FAMILY, bytes, { weight, style: 'normal', display: 'swap' });
    document.fonts.add(f);
    return f.load().catch(() => null);
  });
  loading = Promise.all(faces).then(() => true);
  return loading;
}
