// The three-column app shell for S06 (layouts/app-layout + components/app-nav.tsx, app-aside.tsx,
// commit-feed.tsx markers, log/show.tsx pill) at product scale. Pure; S06 drives scroll and camera.
import type { ReactNode } from 'react';
import type { Person } from '../storyboard';
import { SANS, type Palette } from '../theme';
import { Avatar, LaneDot, Mark, Wordmark } from './kit';
import { AsideKbd, Lucide, mono, sans, type LucideName } from './commit-parts';

export const NAV_W = 256;
export const FEED_W = 620;
export const ASIDE_W = 320;
export const APP_W = NAV_W + FEED_W + 2 + ASIDE_W; // feed column carries a hairline either side

const NAV_ITEMS: { title: string; icon: LucideName; badge?: number }[] = [
  { title: 'Log', icon: 'gitCommit' },
  { title: 'Notifications', icon: 'bell', badge: 2 },
  { title: 'Profile', icon: 'userRound' },
  { title: 'Saved', icon: 'bookmark' },
  { title: 'Settings', icon: 'settings2' },
];

/** Sticky left nav (lg): logo + tagline, items with the Blue Wash on the active one, user menu at the bottom. */
export function AppNav({ P, me, height }: { P: Palette; me: Person; height: number }) {
  return (
    <div style={{ width: NAV_W, height, boxSizing: 'border-box', padding: '24px 16px', display: 'flex', flexDirection: 'column', fontFamily: SANS, color: P.ink }}>
      <div style={{ padding: '0 12px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mark size={30} P={P} />
          <Wordmark size={28} P={P} />
        </div>
        <div style={{ ...sans(14), color: P.muted, marginTop: 4 }}>a social network for devs</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item, i) => {
          const active = i === 0;
          return (
            <div key={item.title} style={{ position: 'relative', borderRadius: 8, padding: 12, background: active ? P.primarySoft : 'transparent', color: active ? P.primary : P.muted, display: 'flex', alignItems: 'center', gap: 12, ...sans(15, 500), lineHeight: '20px' }}>
              <span style={{ position: 'relative' }}>
                <Lucide name={item.icon} size={20} color={active ? P.primary : P.muted} />
                {item.badge ? (
                  <span style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 999, background: P.primary, color: P.primaryInk, textAlign: 'center', fontSize: 10, lineHeight: '16px', fontWeight: 600 }}>{item.badge}</span>
                ) : null}
              </span>
              {item.title}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
        <Avatar person={me} size={36} P={P} />
        <div style={{ minWidth: 0 }}>
          <div style={{ ...sans(14, 500) }}>{me.name}</div>
          <div style={{ ...mono(12), color: P.muted }}>@{me.handle}</div>
        </div>
      </div>
    </div>
  );
}

// "No algorithm. Newest first." is left out on purpose: the film must not claim it (treatment §6).
const RULES = ['Everyone here signed in with GitHub.', 'Commits are plain text, 280 characters max.', 'Profiles mirror GitHub. Edit yours there.'];

/** Sticky right aside (xl): search pill, you, How devnull works, footer. */
export function AppAside({ P, me, height, stats }: { P: Palette; me: Person; height: number; stats: [number, number, number] }) {
  return (
    <div style={{ width: ASIDE_W, height, boxSizing: 'border-box', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, fontFamily: SANS, color: P.ink }}>
      <div style={{ marginBottom: -8, height: 44, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 999, border: `1px solid ${P.hairline}`, background: P.surface, padding: '0 16px', ...sans(15), color: P.muted }}>
        <Lucide name="search" size={16} color={P.muted} />
        Search developers
        <span style={{ marginLeft: 'auto' }}>
          <AsideKbd P={P}>⌘K</AsideKbd>
        </span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar person={me} size={48} P={P} />
          <div>
            <div style={{ ...sans(16, 600) }}>{me.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono(14), color: P.muted }}>
              <LaneDot color={P.lanes[me.lane]!} />@{me.handle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, ...sans(14) }}>
          {(['commits', 'following', 'followers'] as const).map((label, i) => (
            <span key={label} style={{ display: 'flex', gap: 6 }}>
              <span style={{ ...mono(14, 500) }}>{stats[i]}</span>
              <span style={{ color: P.muted }}>{label}</span>
            </span>
          ))}
        </div>
        {me.bio ? <div style={{ marginTop: 12, ...sans(14), color: P.muted }}>{me.bio}</div> : null}
      </div>
      <div style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 24 }}>
        <div style={{ ...sans(14, 600), marginBottom: 12 }}>How devnull works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...sans(14), lineHeight: 1.43 }}>
          {RULES.map((r) => (
            <div key={r} style={{ display: 'flex', gap: 10 }}>
              <span style={{ marginTop: '0.45em', width: 6, height: 6, borderRadius: '50%', background: P.rail, flex: 'none' }} />
              {r}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, ...sans(14), color: P.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Keyboard shortcuts <AsideKbd P={P}>?</AsideKbd>
        </span>
        <span>Everything else goes to /dev/null.</span>
      </div>
    </div>
  );
}

/** commit-feed.tsx DayMarker / LastVisitMarker: empty rail column, mono 12px label, row hairline. */
export function FeedMarker({ P, width, label, dashed }: { P: Palette; width: number; label: ReactNode; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', width, background: P.surface }}>
      <div style={{ width: 72, flex: 'none' }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${P.hairline}`, padding: '8px 16px 8px 0' }}>
        <span style={{ ...mono(12), lineHeight: '16px', color: P.muted }}>{label}</span>
        {dashed ? <span style={{ flex: 1, borderTop: `1px dashed ${P.hairline}` }} /> : null}
      </div>
    </div>
  );
}

/** log/show.tsx: the Commit Blue "↑ N new commits" pill that hangs under the tabs. */
export function NewCommitsPill({ P, count }: { P: Palette; count: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: P.primary, color: P.primaryInk, padding: '6px 16px', ...sans(14, 500), lineHeight: '20px', boxShadow: '0 4px 14px -4px rgba(0,0,0,0.35)' }}>
      <Lucide name="arrowUp" size={16} color={P.primaryInk} />
      {count} new commits
    </div>
  );
}
