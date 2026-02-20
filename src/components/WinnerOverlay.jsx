import React, { useEffect } from 'react';
import { triggerConfetti } from '../utils/confettiUtils';

/**
 * WinnerOverlay — Fullscreen premium winner display.
 * Renders a fixed overlay covering the entire viewport.
 * Disappears reactively when showWinner becomes false.
 */
const WinnerOverlay = ({ winnerName }) => {
  useEffect(() => {
    // Fire confetti on mount
    triggerConfetti();
    const timer = setTimeout(() => triggerConfetti(), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a15 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Animated glow ring */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(218,165,32,0.15) 0%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />

      {/* Trophy */}
      <div style={{ fontSize: '120px', marginBottom: '16px', filter: 'drop-shadow(0 0 40px rgba(218,165,32,0.5))', animation: 'bounceIn 0.8s ease-out' }}>
        🏆
      </div>

      {/* Title */}
      <h2 style={{
        color: '#DAA520',
        fontSize: '1.5rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: '12px',
        textShadow: '0 0 20px rgba(218,165,32,0.3)',
      }}>
        الفائز في التحدي
      </h2>

      {/* Winner Name */}
      <p style={{
        color: '#FFFFFF',
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
        fontWeight: 900,
        textAlign: 'center',
        padding: '0 24px',
        lineHeight: 1.2,
        textShadow: '0 4px 30px rgba(218,165,32,0.4)',
        animation: 'fadeInUp 1s ease-out 0.3s both',
      }}>
        {winnerName}
      </p>

      {/* Gold line */}
      <div style={{
        marginTop: '24px',
        width: '120px',
        height: '3px',
        borderRadius: '2px',
        background: 'linear-gradient(90deg, transparent, #DAA520, transparent)',
      }} />

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WinnerOverlay;
