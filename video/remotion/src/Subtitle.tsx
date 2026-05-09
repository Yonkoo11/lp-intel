import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface SubtitleProps {
  text: string;
  startFrame?: number;
}

export const Subtitle: React.FC<SubtitleProps> = ({ text, startFrame = 10 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  if (frame < startFrame) return null;

  // Word wrap at ~65 chars
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > 65) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 160,
      right: 160,
      display: 'flex',
      justifyContent: 'center',
      opacity,
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderRadius: 12,
        padding: '16px 28px',
        maxWidth: 1200,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
            fontSize: 32,
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.92)',
            textAlign: 'center',
            fontWeight: 400,
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
