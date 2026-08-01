// /Users/ayushsatdeve/The Corn/src/services/antiHack.js

const SECURITY_EVENTS_KEY = 'corn_security_events';

const logSecurityEvent = (event_type, details) => {
  try {
    const events = JSON.parse(localStorage.getItem(SECURITY_EVENTS_KEY)) || [];
    events.push({
      event_type,
      details,
      timestamp: Date.now()
    });
    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {}
};

// Create or get privacy shield element
const getPrivacyShield = () => {
  let shield = document.getElementById('corn-privacy-shield');
  if (!shield) {
    shield = document.createElement('div');
    shield.id = 'corn-privacy-shield';
    shield.innerHTML = `
      <div style="text-align: center; color: #FFFFFF; font-family: sans-serif; padding: 20px;">
        <div style="font-size: 4rem; margin-bottom: 12px;">🔒</div>
        <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; color: #FFFFFF;">Privacy Protected</h2>
        <p style="margin: 0; color: #E6DEC8; font-size: 0.95rem;">Screenshots and Inspection are disabled on The Corn.</p>
      </div>
    `;
    document.body.appendChild(shield);
  }
  return shield;
};

const showPrivacyShield = (duration = 1500) => {
  const shield = getPrivacyShield();
  shield.style.display = 'flex';
  document.body.classList.add('privacy-obscure');

  if (duration > 0) {
    setTimeout(() => {
      hidePrivacyShield();
    }, duration);
  }
};

export const hidePrivacyShield = () => {
  const shield = document.getElementById('corn-privacy-shield');
  if (shield) shield.style.display = 'none';
  document.body.classList.remove('privacy-obscure');
};

const clearClipboard = () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText('🔒 Privacy Protected: Screenshots & Copying Disabled on The Corn').catch(() => {});
  }
};

// Right-click blocker
const handleContextMenu = (e) => {
  e.preventDefault();
  logSecurityEvent('CONTEXT_MENU_PREVENTED', { target: e.target.tagName });
  return false;
};

// Drag blocker for media
const handleDragStart = (e) => {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.tagName === 'CANVAS') {
    e.preventDefault();
    logSecurityEvent('DRAG_PREVENTED', { target: e.target.tagName });
    return false;
  }
};

// Selection blocker for media
const handleSelectStart = (e) => {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.tagName === 'CANVAS') {
    e.preventDefault();
    return false;
  }
};

// Copy / Cut blocker
const handleCopyCut = (e) => {
  e.preventDefault();
  clearClipboard();
  logSecurityEvent('COPY_CUT_PREVENTED', {});
  return false;
};

// Anti-Screenshot & Anti-Inspect keyboard shortcut blocker
const handleKeyDown = (e) => {
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;
  const key = e.key ? e.key.toLowerCase() : '';

  // Detect PrintScreen or Mac screenshot shortcuts (Cmd+Shift+3/4/5) or Win+Shift+S
  const isScreenshotKey =
    e.key === 'PrintScreen' ||
    e.code === 'PrintScreen' ||
    (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
    (e.ctrlKey && e.key === 'PrintScreen') ||
    (e.altKey && e.key === 'PrintScreen') ||
    (e.metaKey && e.shiftKey && key === 's') ||
    (e.ctrlKey && e.shiftKey && key === 's');

  // Detect DevTools & Inspect shortcuts (F12, Cmd+Shift+I/J/C, Cmd+U, Cmd+S)
  const isInspectKey =
    e.key === 'F12' ||
    (isCmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
    (isCmdOrCtrl && (key === 'u' || key === 's'));

  if (isScreenshotKey || isInspectKey) {
    e.preventDefault();
    e.stopPropagation();

    showPrivacyShield(1800);
    clearClipboard();

    logSecurityEvent(isScreenshotKey ? 'SCREENSHOT_PREVENTED' : 'KEY_COMBO_PREVENTED', { key: e.key });
    return false;
  }
};

const handleKeyUp = (e) => {
  if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
    clearClipboard();
    showPrivacyShield(1800);
  }
};

let devToolsCheckInterval;

const checkDevTools = () => {
  const threshold = 160;
  if (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  ) {
    logSecurityEvent('DEVTOOLS_DETECTED', { 
      outerWidth: window.outerWidth, 
      innerWidth: window.innerWidth,
      outerHeight: window.outerHeight,
      innerHeight: window.innerHeight
    });
  }
};

// Mobile App-Switch & Screen Recording / Screenshot Obscurity
const handleVisibilityOrBlur = () => {
  if (document.hidden || !document.hasFocus()) {
    showPrivacyShield(0);
  } else {
    // Small delay to prevent flickering when returning focus
    setTimeout(() => {
      if (document.hasFocus() && !document.hidden) {
        hidePrivacyShield();
      }
    }, 300);
  }
};

/**
 * Initializes active anti-hack, anti-inspect, and anti-screenshot privacy protection.
 */
export const initProtection = () => {
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('selectstart', handleSelectStart);
  document.addEventListener('copy', handleCopyCut);
  document.addEventListener('cut', handleCopyCut);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('blur', handleVisibilityOrBlur);
  window.addEventListener('focus', handleVisibilityOrBlur);
  document.addEventListener('visibilitychange', handleVisibilityOrBlur);

  if (!devToolsCheckInterval) {
    devToolsCheckInterval = setInterval(checkDevTools, 2000);
  }
};

/**
 * Destroys protection event listeners.
 */
export const destroyProtection = () => {
  document.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('dragstart', handleDragStart);
  document.removeEventListener('selectstart', handleSelectStart);
  document.removeEventListener('copy', handleCopyCut);
  document.removeEventListener('cut', handleCopyCut);
  window.removeEventListener('keydown', handleKeyDown, true);
  window.removeEventListener('keyup', handleKeyUp, true);
  window.removeEventListener('blur', handleVisibilityOrBlur);
  window.removeEventListener('focus', handleVisibilityOrBlur);
  document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
  if (devToolsCheckInterval) {
    clearInterval(devToolsCheckInterval);
    devToolsCheckInterval = null;
  }
  hidePrivacyShield();
};

/**
 * Gets logged security events.
 * @returns {Array} Security events
 */
export const getSecurityLog = () => {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_EVENTS_KEY)) || [];
  } catch {
    return [];
  }
};
