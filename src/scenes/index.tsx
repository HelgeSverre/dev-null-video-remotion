// Scene id → component. Each scene lives in its own file and owns nothing else.
import type { ComponentType } from 'react';
import { Boot } from './boot';
import { Rm } from './rm';
import { Left } from './left';
import { Title } from './title';
import { Commit } from './commit';
import { Log } from './log';
import { Identity } from './identity';
import { Lanes } from './lanes';
import { Star } from './star';
import { Terminal } from './terminal';
import { Follows } from './follows';
import { Readme } from './readme';
import { Profile } from './profile';
import { Keys } from './keys';
import { Montage } from './montage';
import { Outro } from './outro';
import { Root } from './root';

export const SCENE_COMPONENTS: Record<string, ComponentType> = {
  boot: Boot,
  rm: Rm,
  left: Left,
  title: Title,
  commit: Commit,
  log: Log,
  identity: Identity,
  lanes: Lanes,
  star: Star,
  terminal: Terminal,
  follows: Follows,
  readme: Readme,
  profile: Profile,
  keys: Keys,
  montage: Montage,
  outro: Outro,
  root: Root,
};
