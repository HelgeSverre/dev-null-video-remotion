// The log's commit composer (components/commit-composer.tsx + graph-rail.tsx) at product scale.
// Rail column (w-18) with the author's RailAvatar: dashed lane ring while staged (< 3 chars), solid
// once committable; dashed Rail Gray tail. Borderless 17px textarea, toolbar: image, poll, link card,
// preview on the left; mono countdown and the primary "Commit" button on the right.
import type { Person } from '../storyboard';
import { BODY_FEATURES, SANS, type Palette } from '../theme';
import { Avatar } from './kit';
import { DashedTail, mono, ToolIcon } from './commit-parts';

export const COMPOSER_RAIL = 72;
/** Height of the composer row at product scale (pt-3 + textarea + mt-2 + toolbar + pb-3). */
export const COMPOSER_H = 112;
/** Rail node centre (top-8). */
export const COMPOSER_NODE_Y = 32;

export function Composer({
  P,
  person,
  body,
  width,
  laneColor,
  staged,
  caret = false,
  remaining,
  buttonOpacity,
  pressed = 0,
  hover = 0,
  ringScale = 1,
  pulse,
}: {
  P: Palette;
  person: Person;
  body: string;
  width: number;
  laneColor?: string;
  staged: boolean;
  caret?: boolean;
  remaining: number;
  buttonOpacity: number;
  pressed?: number;
  hover?: number;
  ringScale?: number;
  pulse?: { scale: number; opacity: number };
}) {
  const lc = laneColor ?? P.lanes[person.lane]!;
  const btnBg = hover > 0.5 || pressed > 0.2 ? P.primaryHover : P.primary;
  return (
    <div style={{ position: 'relative', display: 'flex', width, height: COMPOSER_H, background: P.surface, fontFamily: SANS, color: P.ink }}>
      {/* rail */}
      <div style={{ position: 'relative', width: COMPOSER_RAIL, flex: 'none' }}>
        <DashedTail x={COMPOSER_RAIL / 2} y={COMPOSER_NODE_Y} h={COMPOSER_H - COMPOSER_NODE_Y} color={P.rail} />
        <div style={{ position: 'absolute', left: COMPOSER_RAIL / 2 - 24, top: COMPOSER_NODE_Y - 24, transform: `scale(${ringScale})` }}>
          {pulse && pulse.opacity > 0 ? <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: lc, opacity: pulse.opacity, transform: `scale(${pulse.scale})` }} /> : null}
          <Avatar person={person} size={40} P={P} ring ringColor={lc} dashed={staged} />
        </div>
      </div>
      {/* content */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 12, paddingRight: 16, paddingBottom: 12, borderBottom: `1px solid ${P.hairline}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', minHeight: 40, padding: '6px 0', fontSize: 17, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES, whiteSpace: 'pre-wrap', color: body ? P.ink : P.muted }}>
          {body || (caret ? '' : 'What did you ship?')}
          {caret ? <span style={{ display: 'inline-block', width: 2, height: '1.15em', background: P.primary, verticalAlign: '-0.2em', marginLeft: 1 }} /> : null}
          {!body && caret ? <span style={{ color: P.muted }}>What did you ship?</span> : null}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ marginRight: 'auto', marginLeft: -8, display: 'flex', alignItems: 'center', gap: 0 }}>
            <ToolIcon name="imagePlus" P={P} />
            <ToolIcon name="chartBar" P={P} />
            <ToolIcon name="link2" P={P} />
            <ToolIcon name="eye" P={P} />
          </div>
          <span style={{ ...mono(13), color: remaining <= 20 ? P.amber : P.muted }}>{remaining}</span>
          <div
            style={{
              minWidth: 120,
              height: 36,
              borderRadius: 6,
              background: btnBg,
              color: P.primaryInk,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
              opacity: buttonOpacity,
              transform: `scale(${1 - 0.06 * pressed})`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Commit
          </div>
        </div>
      </div>
    </div>
  );
}
