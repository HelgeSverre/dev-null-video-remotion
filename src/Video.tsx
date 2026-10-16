// The film: one <Sequence> per storyboard scene, then the grain. `startFrame` offsets everything
// so per-scene compositions are windows into the same film (stills and previews match the master).
import { Audio } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile } from 'remotion';
import { SceneContext, sceneFrom, sceneLen } from './lib/scene';
import { Grain } from './overlays/Grain';
import { SCENE_COMPONENTS } from './scenes';
import { SCENES } from './storyboard';
import { palette } from './theme';

export type VideoProps = { startFrame: number; withAudio?: boolean };

export function Video({ startFrame, withAudio = false }: VideoProps) {
  return (
    <AbsoluteFill style={{ background: palette('light').shell }}>
      {SCENES.map((def) => {
        const len = sceneLen(def);
        const from = sceneFrom(def) - startFrame;
        if (from + len <= 0) return null;
        const Scene = SCENE_COMPONENTS[def.id];
        return (
          <Sequence key={def.id} from={from} durationInFrames={len} name={def.id}>
            <SceneContext.Provider value={{ def, from: sceneFrom(def), len }}>
              <AbsoluteFill style={{ background: palette(def.theme).shell, overflow: 'hidden' }}>{Scene ? <Scene /> : null}</AbsoluteFill>
            </SceneContext.Provider>
          </Sequence>
        );
      })}
      <Sequence from={-startFrame} layout="none">
        <Grain />
      </Sequence>
      {withAudio ? <Audio src={staticFile('audio/mix.wav')} trimBefore={startFrame} /> : null}
    </AbsoluteFill>
  );
}
