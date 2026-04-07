declare global {
  interface Window {
    __IGEM_SPLASH_DONE__?: boolean;
    pointerX: number;
    pointerY: number;
    pointerActive: boolean;
    clickPulse: number;
  }
}

window.__IGEM_SPLASH_DONE__ = false;
const SPLASH_SEEN_KEY = 'IGEM_SPLASH_SEEN_V1';

const navEntry = performance.getEntriesByType('navigation')[0] as
  | PerformanceNavigationTiming
  | undefined;
const isReload = navEntry?.type === 'reload';
const hasSeenSplash = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
const shouldShowSplash = isReload || !hasSeenSplash;

function showMainContent() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.style.opacity = '1';
  document.body.classList.remove('splash-active');
  const splashFrame = document.getElementById('splash-frame');
  if (splashFrame) {
    splashFrame.style.display = 'none';
    splashFrame.style.pointerEvents = 'none';
  }
}

window.addEventListener('message', (event) => {
  const splashDone =
    event.data === 'IGEM_SPLASH_DONE' || (event.data && event.data.type === 'IGEM_SPLASH_DONE');
  if (splashDone) {
    window.__IGEM_SPLASH_DONE__ = true;
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    window.dispatchEvent(new Event('IGEM_SPLASH_DONE'));
    showMainContent();
  }
});

if (!shouldShowSplash) {
  window.__IGEM_SPLASH_DONE__ = true;
  window.dispatchEvent(new Event('IGEM_SPLASH_DONE'));
  showMainContent();
} else {
  document.body.classList.add('splash-active');
  // 兜底：给开屏动画留足播放时间，避免文字尚未完整显示就被强制关闭
  setTimeout(() => {
    if (!window.__IGEM_SPLASH_DONE__) {
      window.__IGEM_SPLASH_DONE__ = true;
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      window.dispatchEvent(new Event('IGEM_SPLASH_DONE'));
      showMainContent();
    }
  }, 7000);
}

const useChemotaxisCursor =
  window.matchMedia('(any-pointer: fine)').matches &&
  window.matchMedia('(any-hover: hover)').matches;

if (useChemotaxisCursor) {
  document.body.classList.add('chemotaxis-mode');
}

const cursor = document.getElementById('chemotaxis-cursor');
if (useChemotaxisCursor && cursor) {
  window.pointerX = window.innerWidth * 0.5;
  window.pointerY = window.innerHeight * 0.5;
  window.pointerActive = true;
  window.clickPulse = 0;

  let cursorX = window.pointerX;
  let cursorY = window.pointerY;
  let cursorVX = 0;
  let cursorVY = 0;
  let lastFrameTs = performance.now();
  let isInitializing = true;
  let hasMovedOnce = false;

  cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
  cursor.style.opacity = '1';
  cursor.classList.add('is-active');

  const renderCursor = () => {
    const now = performance.now();
    const dt = Math.min(2.2, Math.max(0.6, (now - lastFrameTs) / 16.67));
    lastFrameTs = now;

    if (window.pointerActive || isInitializing) {
      cursorVX = (cursorVX + (window.pointerX - cursorX) * 0.28 * dt) * 0.6;
      cursorVY = (cursorVY + (window.pointerY - cursorY) * 0.28 * dt) * 0.6;
      cursorX += cursorVX;
      cursorY += cursorVY;
    } else {
      cursorVX = (cursorVX + (window.pointerX - cursorX) * 0.5 * dt) * 0.4;
      cursorVY = (cursorVY + (window.pointerY - cursorY) * 0.5 * dt) * 0.4;
      cursorX += cursorVX;
      cursorY += cursorVY;
    }

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursor);
  };
  renderCursor();

  const captureInitialPosition = () => {
    document.addEventListener(
      'mousemove',
      (e) => {
        if (!hasMovedOnce) {
          window.pointerX = e.clientX;
          window.pointerY = e.clientY;
          hasMovedOnce = true;
        }
      },
      { once: false, passive: true, capture: true },
    );
  };
  captureInitialPosition();

  const onPointerMove = (e: MouseEvent | PointerEvent) => {
    window.pointerX = e.clientX;
    window.pointerY = e.clientY;
    window.pointerActive = true;
    if (!hasMovedOnce) {
      hasMovedOnce = true;
      isInitializing = false;
    }
    if (!cursor.classList.contains('is-active')) {
      cursor.classList.add('is-active');
    }
  };

  const onMouseEnter = (e: MouseEvent) => {
    window.pointerX = e.clientX;
    window.pointerY = e.clientY;
    window.pointerActive = true;
    if (!hasMovedOnce) {
      hasMovedOnce = true;
      isInitializing = false;
    }
    if (!cursor.classList.contains('is-active')) {
      cursor.classList.add('is-active');
    }
  };

  const onPointerDown = () => {
    cursor.classList.add('is-pressed');
  };

  const onPointerUp = () => {
    cursor.classList.remove('is-pressed');
  };

  const onPointerLeave = () => {
    let boundaryX = window.pointerX;
    let boundaryY = window.pointerY;

    if (window.pointerX < 0) {
      boundaryX = 0;
    } else if (window.pointerX > window.innerWidth) {
      boundaryX = window.innerWidth;
    }

    if (window.pointerY < 0) {
      boundaryY = 0;
    } else if (window.pointerY > window.innerHeight) {
      boundaryY = window.innerHeight;
    }

    window.pointerX = boundaryX;
    window.pointerY = boundaryY;
    window.pointerActive = false;
    cursor.classList.remove('is-pressed');
  };

  const onClick = () => {
    window.clickPulse = 1;
    cursor.classList.add('pulse');
    window.setTimeout(() => cursor.classList.remove('pulse'), 220);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true });
  document.addEventListener('mouseover', onMouseEnter, { passive: true });
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('mouseleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);
  window.addEventListener('click', onClick);
}

export {};
