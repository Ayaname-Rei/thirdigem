declare global {
  interface Window {
    __IGEM_SPLASH_DONE__?: boolean;
  }
}

let typedInitialized = false;

const initTypedText = () => {
  if (typedInitialized) return;
  typedInitialized = true;

  const typedNodes = Array.from(document.querySelectorAll<HTMLElement>('.js-typed'));
  if (!typedNodes.length) return;

  typedNodes.forEach((node, index) => {
    const text = node.dataset.typedText ?? '';
    const typeSpeed = Number(node.dataset.typeSpeed ?? '40');
    const showCursor = node.dataset.showCursor !== 'false';
    const cursorChar = node.dataset.cursorChar ?? '|';

    node.textContent = '';
    node.style.setProperty('--typed-cursor-char', `'${cursorChar.replace(/'/g, "\\'")}'`);
    if (showCursor) {
      node.classList.add('is-typing');
    }

    let charIndex = 0;
    const startDelay = index * 220;

    const type = () => {
      if (charIndex <= text.length) {
        node.textContent = text.slice(0, charIndex);
        charIndex += 1;
        window.setTimeout(type, typeSpeed);
      } else {
        node.classList.remove('is-typing');
      }
    };

    window.setTimeout(type, startDelay);
  });
};

const startTypedAfterSplash = () => {
  initTypedText();
  window.removeEventListener('IGEM_SPLASH_DONE', startTypedAfterSplash);
};

window.addEventListener('IGEM_SPLASH_DONE', startTypedAfterSplash, { once: true });

window.setTimeout(() => {
  if (window.__IGEM_SPLASH_DONE__) {
    startTypedAfterSplash();
  }
}, 0);

window.setTimeout(() => {
  startTypedAfterSplash();
}, 7600);

const vineCanvas = document.getElementById('vineCanvas') as HTMLCanvasElement | null;
const vineCtx = vineCanvas?.getContext('2d');
const vineActIds = ['act1', 'act2', 'act3', 'act4'] as const;
const vineSides = ['right', 'left', 'right', 'left'] as const;
const vineBoundaryGap = 108;
const vineCorridorPadding = 20;
const vineStartStemHeight = 200;
const vineCornerRadius = 14;
const vineTailPadding = 10;
const vineLeafCount = 3;
const vinePairYOffset: Record<string, number> = {
  'act3->act4': -20,
};

type VinePoint = {
  x: number;
  y: number;
};

type VineBounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type VineLeaf = {
  el: HTMLImageElement;
  pathRatio: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotate: number;
};

const getPolylinePointAtRatio = (points: VinePoint[], ratio: number): VinePoint | null => {
  if (points.length < 2) return null;

  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const totalLength = points.reduce((sum, point, index) => {
    if (index === 0) return 0;
    const prev = points[index - 1];
    return sum + Math.hypot(point.x - prev.x, point.y - prev.y);
  }, 0);

  if (totalLength <= 0) {
    return { ...points[0] };
  }

  const targetLength = totalLength * clampedRatio;
  let traversed = 0;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const segmentLength = Math.hypot(curr.x - prev.x, curr.y - prev.y);

    if (traversed + segmentLength >= targetLength) {
      const segmentRatio = (targetLength - traversed) / (segmentLength || 1);
      return {
        x: prev.x + (curr.x - prev.x) * segmentRatio,
        y: prev.y + (curr.y - prev.y) * segmentRatio,
      };
    }

    traversed += segmentLength;
  }

  return { ...points[points.length - 1] };
};

let vineLeaves: VineLeaf[] = [];

const getVineLeafLayer = () => {
  let layer = document.getElementById('vineLeaves');
  if (layer) return layer;

  layer = document.createElement('div');
  layer.id = 'vineLeaves';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  return layer;
};

const createVineLeaf = (leaf: VineLeaf) => {
  const img = document.createElement('img');
  img.src = 'https://static.igem.wiki/teams/5291/images/leaf-right.png';
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = 'vine-leaf';
  img.style.setProperty('--leaf-scale', `${leaf.scale}`);
  img.style.setProperty('--leaf-rotate', `${leaf.rotate}deg`);
  img.style.opacity = '0';
  return img;
};

const initVineLeaves = () => {
  const layer = getVineLeafLayer();
  layer.innerHTML = '';

  vineLeaves = Array.from({ length: vineLeafCount }, (_, index) => {
    const leaf: VineLeaf = {
      el: document.createElement('img'),
      pathRatio: 0.25 + index * 0.27,
      offsetX: index % 2 === 0 ? 14 : -12,
      offsetY: -6 - index * 2,
      scale: 0.7 + index * 0.06,
      rotate: index % 2 === 0 ? -18 : 22,
    };

    leaf.el = createVineLeaf(leaf);
    layer.appendChild(leaf.el);
    return leaf;
  });
};

const resizeVineCanvas = () => {
  if (!vineCanvas) return;
  const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const height = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    window.innerHeight || 0,
  );

  vineCanvas.style.width = `${width}px`;
  vineCanvas.style.height = `${height}px`;
  vineCanvas.width = width;
  vineCanvas.height = height;
};

const getActBoundaryPoint = (actId: string, side: 'left' | 'right'): VinePoint | null => {
  const actEl = document.getElementById(actId);
  if (!actEl) return null;

  const panels = Array.from(actEl.querySelectorAll('.story-panel'));
  const panelRects = panels.map((panel) => panel.getBoundingClientRect());
  const fallbackRect = actEl.getBoundingClientRect();

  if (!panelRects.length) {
    const fallbackX =
      side === 'right' ? fallbackRect.right + vineBoundaryGap : fallbackRect.left - vineBoundaryGap;
    return {
      x: Math.max(36, Math.min(window.innerWidth - 36, fallbackX)),
      y: fallbackRect.top + window.scrollY + fallbackRect.height / 2,
    };
  }

  const targetRect = panelRects.reduce((best, rect) => {
    if (side === 'right') return rect.right > best.right ? rect : best;
    return rect.left < best.left ? rect : best;
  }, panelRects[0]);

  const x =
    side === 'right' ? targetRect.right + vineBoundaryGap : targetRect.left - vineBoundaryGap;

  return {
    x: Math.max(36, Math.min(window.innerWidth - 36, x)),
    y: targetRect.top + window.scrollY + targetRect.height / 2,
  };
};

const getActBounds = (actId: string): VineBounds | null => {
  const actEl = document.getElementById(actId);
  if (!actEl) return null;

  const panels = Array.from(actEl.querySelectorAll('.story-panel'));
  const panelRects = panels.map((panel) => panel.getBoundingClientRect());
  const baseRects = panelRects.length ? panelRects : [actEl.getBoundingClientRect()];

  const top = Math.min(...baseRects.map((rect) => rect.top + window.scrollY));
  const bottom = Math.max(...baseRects.map((rect) => rect.bottom + window.scrollY));
  const left = Math.min(...baseRects.map((rect) => rect.left));
  const right = Math.max(...baseRects.map((rect) => rect.right));

  return { top, bottom, left, right };
};

const getCorridorYBetweenActs = (fromActId: string, toActId: string, fallbackY: number): number => {
  const fromBounds = getActBounds(fromActId);
  const toBounds = getActBounds(toActId);
  if (!fromBounds || !toBounds) return fallbackY;

  const lower = fromBounds.bottom + vineCorridorPadding;
  const upper = toBounds.top - vineCorridorPadding;
  const pairKey = `${fromActId}->${toActId}`;
  const yOffset = vinePairYOffset[pairKey] ?? 0;

  if (upper > lower) {
    return (lower + upper) / 2 + yOffset;
  }

  return fallbackY + yOffset;
};

const getVineAnchorPositions = (): VinePoint[] => {
  const subtitleEl = document.getElementById('story-start-anchor');
  if (!subtitleEl) return [];

  const actPoints = vineActIds
    .map((id, index) => getActBoundaryPoint(id, vineSides[index]))
    .filter((point): point is VinePoint => point !== null);

  if (!actPoints.length) return [];

  const subtitleRect = subtitleEl.getBoundingClientRect();
  const startPoint: VinePoint = {
    x: subtitleRect.left,
    y: subtitleRect.top + window.scrollY + subtitleRect.height + 14,
  };

  return [startPoint, ...actPoints];
};

const getVineTailY = (): number | null => {
  const lastActId = vineActIds[vineActIds.length - 1];
  const bounds = getActBounds(lastActId);
  if (!bounds) return null;
  return bounds.bottom + vineTailPadding;
};

const buildVisibleOrthogonalPoints = (positions: VinePoint[], visibleY: number): VinePoint[] => {
  if (positions.length < 2) return [];

  const points: VinePoint[] = [];
  let current = { x: positions[0].x, y: positions[0].y - vineStartStemHeight };
  points.push({ ...current });

  const pushSegment = (nextX: number, nextY: number): boolean => {
    if (nextY > visibleY && current.x === nextX && current.y < visibleY) {
      current = { x: current.x, y: visibleY };
      points.push({ ...current });
      return false;
    }

    if (nextY > visibleY && current.y === nextY) {
      return false;
    }

    current = { x: nextX, y: nextY };
    points.push({ ...current });
    return true;
  };

  if (!pushSegment(positions[0].x, positions[0].y)) return points;
  if (!pushSegment(positions[1].x, positions[0].y)) return points;
  if (!pushSegment(positions[1].x, positions[1].y)) return points;

  for (let i = 2; i < positions.length; i += 1) {
    const p1 = positions[i - 1];
    const p2 = positions[i];
    const fallbackMidY = (p1.y + p2.y) / 2;
    const corridorY = getCorridorYBetweenActs(vineActIds[i - 2], vineActIds[i - 1], fallbackMidY);

    if (!pushSegment(p1.x, corridorY)) return points;
    if (!pushSegment(p2.x, corridorY)) return points;
    if (!pushSegment(p2.x, p2.y)) return points;
  }

  const tailY = getVineTailY();
  if (tailY && tailY > current.y) {
    pushSegment(current.x, tailY);
  }

  return points;
};

const drawRoundedPath = (points: VinePoint[], radius: number, visibleY: number) => {
  if (!vineCtx || points.length < 2) return;

  vineCtx.beginPath();
  vineCtx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (!len1 || !len2) {
      vineCtx.lineTo(curr.x, curr.y);
      continue;
    }

    const r = Math.min(radius, len1 / 2, len2 / 2);
    const p1x = curr.x - (v1x / len1) * r;
    const p1y = curr.y - (v1y / len1) * r;
    const p2x = curr.x + (v2x / len2) * r;
    const p2y = curr.y + (v2y / len2) * r;

    vineCtx.lineTo(p1x, p1y);
    vineCtx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
  }

  const end = points[points.length - 1];
  vineCtx.lineTo(end.x, end.y);
  vineCtx.stroke();

  const leafLayer = getVineLeafLayer();
  vineLeaves.forEach((leaf, index) => {
    const basePoint = getPolylinePointAtRatio(points, leaf.pathRatio);
    if (!basePoint) return;

    const x = basePoint.x + leaf.offsetX;
    const y = basePoint.y + leaf.offsetY;
    const rotation = leaf.rotate + (index % 2 === 0 ? -6 : 6);

    leaf.el.style.left = `${x}px`;
    leaf.el.style.top = `${y}px`;
    leaf.el.style.setProperty('--leaf-rotate', `${rotation}deg`);
    leaf.el.style.opacity = visibleY > y - 18 ? '1' : '0';
    leaf.el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${leaf.scale})`;
    if (!leaf.el.isConnected) leafLayer.appendChild(leaf.el);
  });
};

const getVineVisibleY = (growthStartY: number) => {
  const overviewSection = document.getElementById('about');
  if (!overviewSection) return window.scrollY + window.innerHeight * 0.4;

  const overviewTop = overviewSection.getBoundingClientRect().top + window.scrollY;
  const triggerScrollY = overviewTop - window.innerHeight * 0.5;
  const scrollDelta = window.scrollY - triggerScrollY;

  if (scrollDelta <= 0) return growthStartY;
  return growthStartY + scrollDelta;
};

const drawVine = () => {
  if (!vineCanvas || !vineCtx) return;
  resizeVineCanvas();
  vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);

  const positions = getVineAnchorPositions();
  if (positions.length < 2) return;

  const stemTopY = positions[0].y - vineStartStemHeight;
  const visibleY = getVineVisibleY(stemTopY);
  if (visibleY <= stemTopY) return;

  if (!vineLeaves.length) initVineLeaves();

  vineCtx.lineWidth = 5;
  vineCtx.strokeStyle = '#014738';
  vineCtx.lineCap = 'round';
  vineCtx.lineJoin = 'round';

  const pathPoints = buildVisibleOrthogonalPoints(positions, visibleY);
  drawRoundedPath(pathPoints, vineCornerRadius, visibleY);
};

const sections = document.querySelectorAll<HTMLElement>('.parallax-section');
const backToTopButton = document.getElementById('back-to-top') as HTMLElement | null;
const aboutStoryline = document.getElementById('about-storyline') as HTMLElement | null;
const storylineCorePath = aboutStoryline?.querySelector<SVGPathElement>('.storyline-core');
const storylineHead = aboutStoryline?.querySelector<SVGGElement>('.storyline-head');
let storylineTotal = 0;

const initStorylineGeometry = () => {
  if (!storylineCorePath || typeof storylineCorePath.getTotalLength !== 'function') return;

  const pathData = storylineCorePath.getAttribute('data-path');
  if (pathData) storylineCorePath.setAttribute('d', pathData);

  storylineTotal = storylineCorePath.getTotalLength();
  storylineCorePath.style.strokeDasharray = `${storylineTotal}`;
  storylineCorePath.style.strokeDashoffset = `${storylineTotal}`;
};

const drawStorylineAtProgress = (progress: number) => {
  if (
    !storylineCorePath ||
    !storylineHead ||
    storylineTotal <= 0 ||
    typeof storylineCorePath.getPointAtLength !== 'function'
  )
    return;

  const clamped = Math.max(0, Math.min(1, progress));
  const targetDistance = storylineTotal * clamped;
  const dashOffset = Math.max(storylineTotal - targetDistance, 0);
  storylineCorePath.style.strokeDashoffset = `${dashOffset}`;

  const headPoint = storylineCorePath.getPointAtLength(targetDistance);
  const tangentPoint = storylineCorePath.getPointAtLength(
    Math.min(targetDistance + 1.5, storylineTotal),
  );
  const direction = {
    x: tangentPoint.x - headPoint.x,
    y: tangentPoint.y - headPoint.y,
  };

  const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
  const scale = 0.92 + clamped * 0.18;
  storylineHead.setAttribute(
    'transform',
    `translate(${headPoint.x.toFixed(2)} ${headPoint.y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)})`,
  );
};

const updateReadProgress = () => {
  if (!backToTopButton) return;
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
  backToTopButton.style.setProperty('--read-progress', `${progress * 100}%`);
};

const toggleBackToTop = () => {
  if (!backToTopButton) return;
  const shouldShow = window.scrollY > 320;
  backToTopButton.classList.toggle('visible', shouldShow);
};

backToTopButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const updateParallax = () => {
  const vh = window.innerHeight || 1;
  sections.forEach((section) => {
    const depth = Number(section.getAttribute('data-depth') || 0.12);
    const rect = section.getBoundingClientRect();
    const centerOffset = rect.top + rect.height * 0.5 - vh * 0.5;
    section.style.setProperty('--parallax-offset', `${-centerOffset * depth}px`);
  });
};

const updateStorylineMotion = () => {
  if (!aboutStoryline) return;

  const rect = aboutStoryline.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  if (rect.height <= 0 || storylineTotal <= 0) return;

  const startTrigger = vh * 0.18;
  const travelWindow = Math.max(rect.height + vh * 0.48, 1);
  const rawProgress = (startTrigger - rect.top) / travelWindow;
  const drawProgress = Math.max(0, Math.min(1, rawProgress));

  const visible = rect.bottom > 0 && rect.top < vh;
  aboutStoryline.style.setProperty(
    '--storyline-head-opacity',
    visible && drawProgress > 0.001 ? '1' : '0',
  );
  drawStorylineAtProgress(drawProgress);
};

resizeVineCanvas();
initStorylineGeometry();
updateParallax();
updateReadProgress();
updateStorylineMotion();
drawVine();

let rafPending = false;
const onScrollParallax = () => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    updateParallax();
    updateReadProgress();
    updateStorylineMotion();
    toggleBackToTop();
    drawVine();
    rafPending = false;
  });
};

toggleBackToTop();
window.addEventListener('scroll', onScrollParallax, { passive: true });
window.addEventListener('resize', () => {
  resizeVineCanvas();
  initStorylineGeometry();
  updateParallax();
  updateReadProgress();
  updateStorylineMotion();
  drawVine();
});

const terms = document.querySelectorAll<HTMLElement>('.micro-term');
const fitTooltip = (term: HTMLElement) => {
  const tip = term.querySelector<HTMLElement>('.micro-tooltip');
  if (!tip) return;

  term.classList.remove('tip-below');
  tip.style.setProperty('--tip-shift-x', '0px');

  const tipRect = tip.getBoundingClientRect();
  let shift = 0;
  if (tipRect.left < 12) shift = 12 - tipRect.left;
  if (tipRect.right > window.innerWidth - 12) shift = window.innerWidth - 12 - tipRect.right;
  tip.style.setProperty('--tip-shift-x', `${shift}px`);

  const adjustedRect = tip.getBoundingClientRect();
  if (adjustedRect.top < 12) term.classList.add('tip-below');
};

terms.forEach((term) => {
  term.addEventListener('mouseenter', () => fitTooltip(term));
  term.addEventListener('focusin', () => fitTooltip(term));
});

window.addEventListener('resize', () => {
  terms.forEach((term) => {
    if (term.matches(':hover') || term.matches(':focus-within')) fitTooltip(term);
  });
});

const storyNodes = document.querySelectorAll<HTMLElement>('.story-node');

const animateNumericText = (
  element: HTMLElement,
  target: number,
  suffix = '',
  duration = 1200,
  delay = 0,
) => {
  if (element.dataset.animating === '1') return;
  element.dataset.animating = '1';

  const start = performance.now() + delay;
  const frame = (now: number) => {
    if (now < start) {
      requestAnimationFrame(frame);
      return;
    }
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${value}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.dataset.animating = '0';
    }
  };

  requestAnimationFrame(frame);
};

const animateSweep = (element: HTMLElement, target: number, duration = 1200, delay = 0) => {
  if (element.dataset.animating === '1') return;
  element.dataset.animating = '1';

  const start = performance.now() + delay;
  const frame = (now: number) => {
    if (now < start) {
      requestAnimationFrame(frame);
      return;
    }
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.style.setProperty('--sweep', `${(target * eased).toFixed(4)}`);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.dataset.animating = '0';
    }
  };

  requestAnimationFrame(frame);
};

const animateCounter = (metric: HTMLElement, delay = 0) => {
  const target = Number(metric.dataset.counter || 0);
  const suffix = metric.dataset.suffix || '';

  metric.classList.remove('metric-pop');
  void metric.offsetWidth;
  metric.classList.add('metric-pop');
  animateNumericText(metric, target, suffix, 1400, delay);
};

const resetCounter = (metric: HTMLElement) => {
  const suffix = metric.dataset.suffix || '';
  metric.dataset.animating = '0';
  metric.classList.remove('metric-pop');
  metric.textContent = `0${suffix}`;
};

const animateRangeBars = (node: Element) => {
  node.querySelectorAll('.range-bar').forEach((bar, index) => {
    const fill = bar.querySelector<HTMLElement>('.range-fill');
    const value = bar.querySelector<HTMLElement>('.range-value');
    if (!fill || !value) return;

    const target = Number(value.dataset.target || 0);
    const suffix = value.dataset.suffix || '%';
    const start = performance.now() + index * 120;
    const duration = 980;

    value.dataset.animating = '1';
    const frame = (now: number) => {
      if (now < start) {
        requestAnimationFrame(frame);
        return;
      }
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      fill.style.setProperty('--bar-progress', `${current}%`);
      value.textContent = `${current}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        value.dataset.animating = '0';
      }
    };

    requestAnimationFrame(frame);
  });
};

const resetRangeBars = (node: Element) => {
  node.querySelectorAll('.range-bar').forEach((bar) => {
    const fill = bar.querySelector<HTMLElement>('.range-fill');
    const value = bar.querySelector<HTMLElement>('.range-value');
    if (fill) fill.style.setProperty('--bar-progress', '0%');
    if (value) {
      const suffix = value.dataset.suffix || '%';
      value.dataset.animating = '0';
      value.textContent = `0${suffix}`;
    }
  });
};

const animateImpactRings = (node: Element) => {
  node.querySelectorAll<HTMLElement>('.impact-ring.active-ring').forEach((ring, index) => {
    ring.style.setProperty('--sweep', '0');
    const target = Number(ring.dataset.target || 0);
    const delay = Number(ring.style.getPropertyValue('--delay').replace('ms', '')) || index * 70;
    animateSweep(ring, target, 1100, delay);
  });
};

const resetImpactRings = (node: Element) => {
  node.querySelectorAll<HTMLElement>('.impact-ring.active-ring').forEach((ring) => {
    ring.dataset.animating = '0';
    ring.style.setProperty('--sweep', '0');
  });
};

const storyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const node = entry.target;
      if (entry.isIntersecting) {
        node.classList.add('is-active');

        if (node.classList.contains('node-challenge')) {
          node.querySelectorAll<HTMLElement>('.story-metric').forEach((metric, index) => {
            animateCounter(metric, index * 180);
          });
        } else if (node.classList.contains('node-scope')) {
          animateRangeBars(node);
        } else if (node.classList.contains('node-impact')) {
          animateImpactRings(node);
        }
        return;
      }

      if (node.classList.contains('node-challenge')) {
        node.querySelectorAll<HTMLElement>('.story-metric').forEach((metric) => {
          resetCounter(metric);
        });
      } else if (node.classList.contains('node-scope')) {
        resetRangeBars(node);
      } else if (node.classList.contains('node-impact')) {
        resetImpactRings(node);
      }
    });
  },
  { threshold: 0.38, rootMargin: '0px 0px -12% 0px' },
);

storyNodes.forEach((node) => storyObserver.observe(node));

export {};
