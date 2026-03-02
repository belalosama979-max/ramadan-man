import React, { useEffect } from 'react';
import { triggerConfetti } from '../utils/confettiUtils';

/**
 * WinnerOverlay — Fullscreen premium winner display.
 * Renders a fixed overlay covering the entire viewport.
 * Disappears reactively when showWinner becomes false.
 */
const WinnerOverlay = ({ topWinners }) => {
  useEffect(() => {
    // Fire confetti on mount
    triggerConfetti();
    const timer = setTimeout(() => triggerConfetti(), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!topWinners || Object.keys(topWinners).length === 0) return null;

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
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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

      {/* Title */}
      <h2 style={{
        color: '#DAA520',
        fontSize: '1.8rem',
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '40px',
        textShadow: '0 0 20px rgba(218,165,32,0.3)',
        zIndex: 10
      }}>
        أسرع الإجابات الصحيحة
      </h2>

      {/* Winners Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 10,
        width: '100%',
        maxWidth: '600px',
        padding: '0 20px'
      }}>
        {/* FIRST PLACE */}
        {topWinners.first && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(218,165,32,0.1) 0%, rgba(218,165,32,0.2) 50%, rgba(218,165,32,0.1) 100%)',
            border: '2px solid rgba(218,165,32,0.5)',
            boxShadow: '0 0 30px rgba(218,165,32,0.2)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '60px', filter: 'drop-shadow(0 0 10px rgba(218,165,32,0.8))' }}>🥇</span>
              <div>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'rgba(218,165,32,0.8)', fontWeight: 'bold' }}>المركز الأول</p>
                <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{topWinners.first.name}</p>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', fontFamily: 'monospace' }}>{topWinners.first.responseTimeSeconds}s</p>
            </div>
          </div>
        )}

        {/* SECOND PLACE */}
        {topWinners.second && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(192,192,192,0.05) 0%, rgba(192,192,192,0.15) 50%, rgba(192,192,192,0.05) 100%)',
            border: '2px solid rgba(192,192,192,0.4)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeInUp 0.8s ease-out 0.5s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 8px rgba(192,192,192,0.6))' }}>🥈</span>
              <div>
                <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(192,192,192,0.8)', fontWeight: 'bold' }}>المركز الثاني</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{topWinners.second.name}</p>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: '#C0C0C0', fontFamily: 'monospace' }}>{topWinners.second.responseTimeSeconds}s</p>
            </div>
          </div>
        )}

        {/* THIRD PLACE */}
        {topWinners.third && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(205,127,50,0.05) 0%, rgba(205,127,50,0.15) 50%, rgba(205,127,50,0.05) 100%)',
            border: '2px solid rgba(205,127,50,0.4)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeInUp 0.8s ease-out 0.8s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '40px', filter: 'drop-shadow(0 0 8px rgba(205,127,50,0.6))' }}>🥉</span>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(205,127,50,0.8)', fontWeight: 'bold' }}>المركز الثالث</p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{topWinners.third.name}</p>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#CD7F32', fontFamily: 'monospace' }}>{topWinners.third.responseTimeSeconds}s</p>
            </div>
          </div>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default WinnerOverlay;
