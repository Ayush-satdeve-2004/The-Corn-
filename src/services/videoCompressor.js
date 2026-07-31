/**
 * High-speed client-side video compressor (720p 8x speed encoding)
 * Downscales videos exceeding 720p resolution or 50 MB file size
 */
export const compressVideo = (file, onProgress) => {
  return new Promise((resolve) => {
    // If file is 50 MB or smaller, upload directly for instant speed
    if (!file || file.size <= 50 * 1024 * 1024) {
      if (onProgress) onProgress(100);
      return resolve(file);
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    let isStarted = false;

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(file); // Fallback to original file on error
    };

    video.onloadedmetadata = () => {
      const srcWidth = video.videoWidth || 1280;
      const srcHeight = video.videoHeight || 720;

      // Scale to 720p max (1280x720 landscape, 720x1280 portrait)
      const isPortrait = srcHeight > srcWidth;
      const maxDim = 1280;
      const minDim = 720;

      let targetWidth = srcWidth;
      let targetHeight = srcHeight;

      if (isPortrait) {
        if (srcWidth > minDim || srcHeight > maxDim) {
          const ratio = Math.min(minDim / srcWidth, maxDim / srcHeight);
          targetWidth = Math.round(srcWidth * ratio);
          targetHeight = Math.round(srcHeight * ratio);
        }
      } else {
        if (srcHeight > minDim || srcWidth > maxDim) {
          const ratio = Math.min(maxDim / srcWidth, minDim / srcHeight);
          targetWidth = Math.round(srcWidth * ratio);
          targetHeight = Math.round(srcHeight * ratio);
        }
      }

      // Ensure dimensions are even numbers for video encoders
      targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
      targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorderOptions = {
        videoBitsPerSecond: 2000000 // 2.0 Mbps 720p quality
      };
      if (mimeType) recorderOptions.mimeType = mimeType;

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
      } catch {
        URL.revokeObjectURL(video.src);
        return resolve(file); // Fallback to original file
      }

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/mp4' });
        const ext = mediaRecorder.mimeType?.includes('webm') ? '.webm' : '.mp4';
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_720p" + ext, {
          type: blob.type,
          lastModified: Date.now()
        });
        console.log(`🎥 Video compressed to 720p: ${(file.size / 1024 / 1024).toFixed(1)} MB -> ${(compressedFile.size / 1024 / 1024).toFixed(1)} MB`);
        resolve(compressedFile);
      };

      // High-speed 8.0x playback rate for fast encoding
      video.playbackRate = 8.0;

      let animId;
      const renderFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          if (onProgress && video.duration) {
            const pct = Math.round((video.currentTime / video.duration) * 100);
            onProgress(pct);
          }
          animId = requestAnimationFrame(renderFrame);
        }
      };

      video.onplay = () => {
        if (!isStarted && mediaRecorder.state === 'inactive') {
          isStarted = true;
          try {
            mediaRecorder.start(200);
          } catch (e) {
            console.warn('MediaRecorder start notice:', e);
          }
          renderFrame();
        }
      };

      video.onended = () => {
        cancelAnimationFrame(animId);
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      video.play().catch(() => {
        URL.revokeObjectURL(video.src);
        resolve(file);
      });
    };
  });
};
