import { Composition } from 'remotion';
import { DURATION, FPS, HEIGHT, WIDTH } from './lib/clock';
import { sceneFrom, sceneLen } from './lib/scene';
import { fontsReady } from './fonts';
import { SCENES } from './storyboard';
import { Video } from './Video';

const common = { fps: FPS, width: WIDTH, height: HEIGHT } as const;
const waitForFonts = async () => {
  await fontsReady;
  return {};
};

/**
 * "Full" is the film (muted; the master muxes public/audio/mix.wav with ffmpeg). "Preview" plays
 * the mix in the Studio. One window composition per scene (S04-title …) for stills and review.
 */
export function Root() {
  return (
    <>
      <Composition id="Full" component={Video} durationInFrames={DURATION} {...common} defaultProps={{ startFrame: 0 }} calculateMetadata={waitForFonts} />
      <Composition id="Preview" component={Video} durationInFrames={DURATION} {...common} defaultProps={{ startFrame: 0, withAudio: true }} calculateMetadata={waitForFonts} />
      {SCENES.map((s, i) => (
        <Composition
          key={s.id}
          id={`S${String(i + 1).padStart(2, '0')}-${s.id}`}
          component={Video}
          durationInFrames={sceneLen(s)}
          {...common}
          defaultProps={{ startFrame: sceneFrom(s) }}
          calculateMetadata={waitForFonts}
        />
      ))}
    </>
  );
}
