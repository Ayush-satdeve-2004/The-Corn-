import React, { useMemo } from 'react';
import './Watermark.css';

/**
 * @param {string} text - Watermark text (email · phone)
 * @param {string} variant - 'photo' for fewer marks, 'video' for more marks
 */
export default function Watermark({ text, variant = 'video' }) {
  const marks = useMemo(() => {
    /* Photos get 2×2 = 4 watermarks, Videos get 4×2 = 8 watermarks */
    const rows = variant === 'photo' ? 2 : 4;
    const cols = 2;
    const list = [];
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rowSpacing = 100 / (rows + 1);
        const colSpacing = 100 / (cols + 1);
        const top = (rowSpacing * (r + 1) - 5 + Math.floor(Math.random() * 6)) + '%';
        const left = (colSpacing * (c + 1) - 8 + Math.floor(Math.random() * 6)) + '%';
        const rotate = Math.floor(Math.random() * 20) - 10;
        const animationDuration = 14 + Math.random() * 6;
        const animationDelay = Math.random() * 4;
        list.push({
          id: count++,
          top,
          left,
          rotate,
          animationDuration,
          animationDelay,
        });
      }
    }
    return list;
  }, [variant]);

  if (!text) return null;

  return (
    <div className="watermark-container">
      {marks.map((mark) => (
        <div
          key={mark.id}
          className="watermark-text"
          style={{
            top: mark.top,
            left: mark.left,
            transform: `rotate(${mark.rotate}deg)`,
            animationDuration: `${mark.animationDuration}s`,
            animationDelay: `-${mark.animationDelay}s`,
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
