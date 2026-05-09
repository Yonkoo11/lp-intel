import React from 'react';
import { Composition } from 'remotion';
import { LPIntelDemo } from './LPIntelDemo';

export const RemotionRoot: React.FC = () => {
  // Total duration: sum of all scene durations
  const totalFrames = 330 + 270 + 345 + 396 + 348 + 222 + 180; // 2091 frames = ~69.7s at 30fps

  return (
    <>
      <Composition
        id="LPIntelDemo"
        component={LPIntelDemo}
        durationInFrames={totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
