import { prepare, layout } from '@chenglou/pretext';

let canvas: HTMLCanvasElement | null = null;

function getCanvasContext() {
  if (typeof document === 'undefined') return null;
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  return canvas.getContext('2d');
}

/**
 * Pre-processes font family string.
 */
function cleanFontFamily(fontFamily: string): string {
  if (!fontFamily) return 'sans-serif';
  const firstFont = fontFamily.split(',')[0].trim();
  return firstFont.replace(/['"]/g, '');
}

/**
 * Measures text using Canvas API (Extremely fast, stable, and widely supported).
 * Based on your benchmark, this is ~21x faster than DOM measurement.
 */
export function measureTextCanvas(
  text: string,
  fontSize: number,
  fontFamily: string
) {
  const ctx = getCanvasContext();
  if (!ctx) return { width: 0, height: 0 };
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize // Approximate
  };
}

/**
 * Measures text using Pretext.
 * NOTE: Pretext is currently falling back to DOM/Canvas in this environment 
 * due to an internal string parser issue in the library.
 */
export function measureTextPretext(
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number = Infinity
) {
  if (!text) return { width: 0, height: 0 };
  
  try {
    const cleanedFont = cleanFontFamily(fontFamily);
    const fontStr = `${fontSize}px ${cleanedFont}`;
    const font = prepare(fontStr);
    
    if (font) {
      const result = layout(font, text, maxWidth === Infinity ? 0 : maxWidth);
      if (result) return result;
    }
    throw new Error('Pretext failed');
  } catch (error) {
    // Fallback to Canvas for speed and stability
    return measureTextCanvas(text, fontSize, fontFamily);
  }
}

/**
 * Measures text using a hidden DOM element (Legacy/Standard way).
 */
export function measureTextDOM(
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number = Infinity
) {
  if (typeof document === 'undefined') return { width: 0, height: 0 };

  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'nowrap';
  div.style.fontSize = `${fontSize}px`;
  div.style.fontFamily = fontFamily;
  if (maxWidth !== Infinity) {
    div.style.maxWidth = `${maxWidth}px`;
    div.style.whiteSpace = 'normal';
  }
  div.innerText = text;
  document.body.appendChild(div);
  const rect = div.getBoundingClientRect();
  document.body.removeChild(div);
  return rect;
}

/**
 * Benchmarks the three methods.
 */
export function runBenchmark(text: string, iterations: number = 100) {
  if (!text) return;
  
  const fontSize = 22;
  const fontFamily = 'Jost, sans-serif';

  console.log(`%c Performance Test: "${text}" (%d iterations) `, 'background: #222; color: #bada55', iterations);

  // DOM
  const startDOM = performance.now();
  for (let i = 0; i < iterations; i++) {
    measureTextDOM(text, fontSize, fontFamily);
  }
  const domTime = performance.now() - startDOM;

  // Canvas
  const startCanvas = performance.now();
  for (let i = 0; i < iterations; i++) {
    measureTextCanvas(text, fontSize, fontFamily);
  }
  const canvasTime = performance.now() - startCanvas;

  console.log(`[SLOW] DOM measurement:    ${domTime.toFixed(4)}ms`);
  console.log(`[FAST] Canvas measurement: ${canvasTime.toFixed(4)}ms`);
  console.log(`🚀 Canvas is %c${(domTime / canvasTime).toFixed(2)}x faster%c than DOM`, 'color: #00ff00; font-weight: bold', 'color: inherit');

  return { domTime, canvasTime };
}

/**
 * Finds the optimal font size for a text to fit within a given width.
 */
export function getOptimalFontSize(
  text: string,
  maxFontSize: number,
  minFontSize: number,
  maxWidth: number,
  fontFamily: string
): number {
  if (!text) return maxFontSize;
  
  let currentFontSize = maxFontSize;
  while (currentFontSize > minFontSize) {
    // We use Canvas here for stability and high performance (21x faster than DOM)
    const result = measureTextCanvas(text, currentFontSize, fontFamily);
    if (result.width <= maxWidth) {
      return currentFontSize;
    }
    currentFontSize -= 1;
  }
  return minFontSize;
}
