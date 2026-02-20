import React, { useState, useEffect, useRef } from 'react';

/**
 * Funny emoji stickers shown after successful submission.
 * No external images needed — uses native emoji rendering.
 */
const STICKERS = [
  { emoji: '🔥', label: 'يا سلام عليك!' },
  { emoji: '🧠', label: 'عقل جبّار!' },
  { emoji: '💪', label: 'ما شاء الله!' },
  { emoji: '🚀', label: 'صاروخ!' },
  { emoji: '😎', label: 'كلك ذوق!' },
  { emoji: '🎯', label: 'في العشرة!' },
  { emoji: '⚡', label: 'برق!' },
  { emoji: '🦁', label: 'أسد!' },
  { emoji: '👑', label: 'ملك!' },
  { emoji: '🏅', label: 'بطل!' },
  { emoji: '🤩', label: 'واو!' },
  { emoji: '🎉', label: 'تستاهل!' },
  { emoji: '💯', label: 'مية المية!' },
  { emoji: '🫡', label: 'تحياتي!' },
];

/**
 * StickerOverlay — Shows a random funny sticker after submission.
 * Props:
 *   trigger: boolean — when it flips to true, a random sticker is shown for 4s.
 */
const StickerOverlay = ({ trigger }) => {
  const [visible, setVisible] = useState(false);
  const [sticker, setSticker] = useState(null);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const fadeRef = useRef(null);
  const prevTrigger = useRef(false);

  useEffect(() => {
    // Only fire when trigger flips from false → true
    if (trigger && !prevTrigger.current) {
      const idx = Math.floor(Math.random() * STICKERS.length);
      setSticker(STICKERS[idx]);
      setVisible(true);

      // Start animation after a frame
      requestAnimationFrame(() => setAnimating(true));

      // Auto-close after 4 seconds
      timeoutRef.current = setTimeout(() => {
        setAnimating(false);
        // Wait for fade-out to finish
        fadeRef.current = setTimeout(() => setVisible(false), 400);
      }, 4000);
    }

    prevTrigger.current = trigger;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [trigger]);

  if (!visible || !sticker) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: animating ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: 'background 0.4s ease',
        pointerEvents: 'none',
      }}
    >
      {/* Emoji */}
      <div
        style={{
          fontSize: 'clamp(100px, 30vw, 180px)',
          lineHeight: 1,
          transform: animating ? 'scale(1)' : 'scale(0.2)',
          opacity: animating ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
          filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.3))',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {sticker.emoji}
      </div>

      {/* Label */}
      <p
        style={{
          marginTop: '20px',
          fontSize: 'clamp(1.2rem, 5vw, 2rem)',
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 2px 15px rgba(0,0,0,0.5)',
          transform: animating ? 'translateY(0)' : 'translateY(20px)',
          opacity: animating ? 1 : 0,
          transition: 'transform 0.5s ease 0.15s, opacity 0.4s ease 0.15s',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {sticker.label}
      </p>
    </div>
  );
};

export default StickerOverlay;
