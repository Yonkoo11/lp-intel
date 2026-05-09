import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface TermLine {
  text: string;
  color?: string;
  delay?: number;
}

interface TerminalProps {
  command?: string;
  lines: TermLine[];
  typingSpeed?: number;
  lineRevealRate?: number;
  title?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  command,
  lines,
  typingSpeed = 1.5,
  lineRevealRate = 3,
  title = 'lp-intel',
}) => {
  const frame = useCurrentFrame();

  const hasCommand = command && command.length > 0;
  const commandChars = hasCommand ? Math.floor(frame / typingSpeed) : 999;
  const typedCommand = hasCommand ? command.slice(0, commandChars) : '';
  const commandDone = !hasCommand || commandChars >= (command?.length ?? 0);
  const commandEndFrame = hasCommand ? (command?.length ?? 0) * typingSpeed : 0;
  const outputFrame = commandDone ? frame - commandEndFrame : -1;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#16161e',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 40px',
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 12,
        borderBottom: '1px solid #2d2d37',
        marginBottom: 16,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#27c93f' }} />
        <span style={{ marginLeft: 'auto', marginRight: 'auto', color: '#a0a0aa', fontSize: 15 }}>{title}</span>
      </div>

      {/* Command line (only if command exists) */}
      {hasCommand && (
        <div style={{ fontSize: 26, lineHeight: 1.5, color: '#78788c', marginBottom: 4 }}>
          <span style={{ color: '#6c6c80' }}>$ </span>
          <span style={{ color: '#dcdce0' }}>{typedCommand}</span>
          {!commandDone && (
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 24,
              backgroundColor: '#dcdce0',
              marginLeft: 2,
              opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
            }} />
          )}
        </div>
      )}

      {/* Output lines */}
      {(commandDone || !hasCommand) && (
        <div style={{ marginTop: hasCommand ? 8 : 0, fontSize: 26, lineHeight: 1.5 }}>
          {lines.map((line, i) => {
            const lineDelay = line.delay ?? i * lineRevealRate;
            const effectiveFrame = hasCommand ? outputFrame : frame;
            const visible = effectiveFrame >= lineDelay;
            const fadeIn = visible ? interpolate(
              effectiveFrame - lineDelay,
              [0, 5],
              [0, 1],
              { extrapolateRight: 'clamp' }
            ) : 0;

            if (!visible) return null;

            return (
              <div
                key={i}
                style={{
                  color: line.color || '#dcdce0',
                  opacity: fadeIn,
                  transform: `translateY(${(1 - fadeIn) * 6}px)`,
                  minHeight: line.text === '' ? 16 : undefined,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
