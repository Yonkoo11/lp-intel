import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const ClosingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 10, mass: 0.4, stiffness: 120 } });
  const subtitleOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: 'clamp' });
  const tagsOpacity = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: 'clamp' });
  const builtWithOpacity = interpolate(frame, [30, 42], [0, 1], { extrapolateRight: 'clamp' });

  // Stable glow (no animation to avoid render flicker)
  const glowIntensity = 20;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      // Gradient background with depth
      background: 'radial-gradient(ellipse at 50% 40%, #1a1a2e 0%, #0d0d18 50%, #080810 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle grid lines for depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(100, 200, 220, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100, 200, 220, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }} />

      {/* Accent glow behind title */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(100, 200, 220, 0.18) 0%, transparent 70%)',
        top: '32%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(40px)',
      }} />

      {/* Title */}
      <div style={{
        fontSize: 84,
        fontWeight: 700,
        color: '#64c8dc',
        transform: `scale(${titleScale})`,
        letterSpacing: -2,
        textShadow: `0 0 ${glowIntensity}px rgba(100, 200, 220, 0.5), 0 0 ${glowIntensity * 2}px rgba(100, 200, 220, 0.2)`,
        position: 'relative',
        zIndex: 1,
      }}>
        LP Intel
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 28,
        color: '#c8c8d4',
        opacity: subtitleOpacity,
        fontWeight: 300,
        letterSpacing: 1,
        position: 'relative',
        zIndex: 1,
        marginTop: -4,
      }}>
        Concentrated Liquidity Position Analyzer
      </div>

      {/* Divider line */}
      <div style={{
        width: interpolate(frame, [18, 30], [0, 320], { extrapolateRight: 'clamp' }),
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(100, 200, 220, 0.4), transparent)',
        marginTop: 12,
        marginBottom: 12,
      }} />

      {/* DEX pills */}
      <div style={{
        display: 'flex',
        gap: 16,
        opacity: tagsOpacity,
        position: 'relative',
        zIndex: 1,
      }}>
        {['Uniswap V3', 'SushiSwap V3', 'PancakeSwap V3'].map((dex, i) => (
          <span key={dex} style={{
            fontSize: 17,
            color: '#a0a0b4',
            padding: '8px 20px',
            border: '1px solid rgba(100, 200, 220, 0.2)',
            borderRadius: 8,
            background: 'rgba(100, 200, 220, 0.05)',
            transform: `translateY(${interpolate(frame, [20 + i * 3, 30 + i * 3], [10, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            {dex}
          </span>
        ))}
      </div>

      {/* Chain names */}
      <div style={{
        display: 'flex',
        gap: 24,
        opacity: tagsOpacity,
        position: 'relative',
        zIndex: 1,
        marginTop: 4,
      }}>
        {['Ethereum', 'Arbitrum', 'Base', 'Polygon'].map((chain) => (
          <span key={chain} style={{
            fontSize: 15,
            color: '#6c6c80',
            fontWeight: 500,
            letterSpacing: 0.5,
          }}>
            {chain}
          </span>
        ))}
      </div>

      {/* Built with */}
      <div style={{
        fontSize: 24,
        color: '#dcb64a',
        marginTop: 28,
        opacity: builtWithOpacity,
        fontWeight: 500,
        position: 'relative',
        zIndex: 1,
        textShadow: '0 0 20px rgba(220, 182, 74, 0.15)',
        letterSpacing: 0.5,
      }}>
        Built with OnchainOS + Uniswap AI Skills
      </div>
    </div>
  );
};
