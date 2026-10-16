import { Config } from '@remotion/cli/config';

// Master quality: JPEG frames at q95 into H.264 CRF 16. scripts/render.ts renders in chunks
// (muted), concatenates them with ffmpeg and muxes public/audio/mix.wav once.
Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(8);
