import React, { createContext, useContext, useState } from 'react';
import { uploadMedia, createPost } from '../services/api';
import { compressVideo } from '../services/videoCompressor';

const UploadContext = createContext();

export function UploadProvider({ children }) {
  const [activeUpload, setActiveUpload] = useState(null); 
  // activeUpload: { status: 'compressing'|'uploading'|'publishing', progress: 0, loadedMb: '0', totalMb: '0', message: '' }

  const startUpload = async (postData, mediaFile, onSuccess) => {
    setActiveUpload({
      status: 'compressing',
      progress: 5,
      loadedMb: '0',
      totalMb: mediaFile ? (mediaFile.size / (1024 * 1024)).toFixed(1) : '0',
      message: mediaFile && mediaFile.type.startsWith('video/') ? 'Optimizing & Compressing Video to 720p...' : 'Preparing Upload...'
    });

    try {
      let fileToUpload = mediaFile;

      // 1. Compress Video if it's a video
      if (mediaFile && mediaFile.type.startsWith('video/')) {
        try {
          fileToUpload = await compressVideo(mediaFile, (compressPct) => {
            setActiveUpload(prev => prev ? {
              ...prev,
              status: 'compressing',
              progress: Math.min(40, Math.round(compressPct * 0.4)),
              message: `Optimizing Video 720p... ${compressPct}%`
            } : null);
          });
        } catch (compressErr) {
          console.warn('Compression notice, uploading original:', compressErr);
        }
      }

      // Update total file size after compression
      const finalSizeMb = fileToUpload ? (fileToUpload.size / (1024 * 1024)).toFixed(1) : '0';

      setActiveUpload(prev => prev ? {
        ...prev,
        status: 'uploading',
        progress: 40,
        totalMb: finalSizeMb,
        message: 'Uploading Media...'
      } : null);

      // 2. Upload Media to Server via XHR with Progress
      let mediaUrl = '';
      if (fileToUpload) {
        const uploadResult = await uploadMedia(fileToUpload, (percent, loaded, total) => {
          const mappedPct = 40 + Math.round(percent * 0.55);
          setActiveUpload(prev => prev ? {
            ...prev,
            status: 'uploading',
            progress: Math.min(95, mappedPct),
            loadedMb: (loaded / (1024 * 1024)).toFixed(1),
            totalMb: (total / (1024 * 1024)).toFixed(1),
            message: `Uploading Media... ${percent}%`
          } : null);
        });
        mediaUrl = uploadResult.url;
      }

      setActiveUpload(prev => prev ? {
        ...prev,
        status: 'publishing',
        progress: 98,
        message: 'Publishing Post...'
      } : null);

      // 3. Create Post in MongoDB
      await createPost({
        ...postData,
        mediaUrl: mediaUrl,
      });

      setActiveUpload(prev => prev ? {
        ...prev,
        status: 'done',
        progress: 100,
        message: '🎉 Post Published Successfully!'
      } : null);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setActiveUpload(null);
      }, 3500);

    } catch (err) {
      console.error('Background upload error:', err);
      setActiveUpload(prev => prev ? {
        ...prev,
        status: 'error',
        message: '❌ Upload failed. Please try again.'
      } : null);

      setTimeout(() => {
        setActiveUpload(null);
      }, 5000);
    }
  };

  return (
    <UploadContext.Provider value={{ activeUpload, startUpload }}>
      {children}
      {/* Sleek Floating Background Upload Banner */}
      {activeUpload && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: 'calc(100% - 32px)',
          maxWidth: '460px',
          backgroundColor: '#1E1B18',
          color: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontFamily: 'sans-serif',
          backdropFilter: 'blur(10px)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: '600', color: activeUpload.status === 'error' ? '#FF6B6B' : activeUpload.status === 'done' ? '#51CF66' : '#E6DEC8' }}>
              {activeUpload.message}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {activeUpload.status === 'uploading' && activeUpload.totalMb && `${activeUpload.loadedMb} MB / ${activeUpload.totalMb} MB`}
            </span>
          </div>

          {activeUpload.status !== 'error' && (
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${activeUpload.progress}%`,
                backgroundColor: activeUpload.status === 'done' ? '#51CF66' : '#8B5324',
                transition: 'width 0.3s ease-in-out',
                borderRadius: '3px'
              }} />
            </div>
          )}
        </div>
      )}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  return useContext(UploadContext);
}
