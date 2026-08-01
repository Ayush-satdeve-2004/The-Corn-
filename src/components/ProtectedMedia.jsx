import React, { useEffect, useRef } from 'react';

export default function ProtectedMedia({ type, src, alt, className, onClick, videoRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (type !== 'photo' || !src || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [type, src]);

  if (type === 'photo') {
    return (
      <canvas
        ref={canvasRef}
        className={`protected-canvas ${className || ''}`}
        onClick={onClick}
        onContextMenu={e => e.preventDefault()}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    );
  }

  if (type === 'video') {
    return (
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        controls
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture={true}
        className={className}
        onContextMenu={e => e.preventDefault()}
        style={{
          width: '100%',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    );
  }

  return null;
}
