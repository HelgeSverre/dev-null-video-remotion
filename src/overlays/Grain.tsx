// Fine seeded grain over the whole film so flat greys don't band in H.264. Half-resolution canvas
// noise regenerated per frame from an integer hash (deterministic across tabs and chunks).
import { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 960;
const H = 540;

export function Grain({ amount = 0.05 }: { amount?: number }) {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    let s = (Math.imul(f + 1, 0x9e3779b1) >>> 0) || 1;
    for (let i = 0; i < W * H; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      const v = (s >>> 0) & 255;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [f]);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity: amount }}>
      <canvas ref={ref} width={W} height={H} style={{ width: 1920, height: 1080 }} />
    </AbsoluteFill>
  );
}
