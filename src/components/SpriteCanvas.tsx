import React, { useEffect, useRef, useState } from 'react';
import { ArtClip, loadArtClip } from '../utils/gifDecode';

/* Draws a pixel GIF onto a canvas at the screen's real resolution with
   smoothing off, so every art pixel is a hard-edged square at any size and
   on any display (browsers blur scaled <img> GIFs on high-DPI screens).
   All canvases animate from one shared clock. */

type Tick = (now: number) => void;
const subscribers = new Set<Tick>();
let raf = 0;
const loop = (now: number) => {
  subscribers.forEach((fn) => fn(now));
  raf = subscribers.size ? requestAnimationFrame(loop) : 0;
};
const subscribe = (fn: Tick) => {
  subscribers.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    subscribers.delete(fn);
  };
};

interface SpriteCanvasProps {
  src: string;
  /** On-screen size in CSS px (already a whole multiple of the art grid). */
  width: number;
  height: number;
  style?: React.CSSProperties;
  className?: string;
  /** Pause when off screen. */
  active?: boolean;
}

export const SpriteCanvas: React.FC<SpriteCanvasProps> = ({ src, width, height, style, className = '', active = true }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [clip, setClip] = useState<ArtClip | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setFailed(false);
    loadArtClip(src)
      .then((c) => live && setClip(c))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [src]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !clip || !clip.frames.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let frame = -1;
    let start = performance.now();
    const total = clip.delays.reduce((a, b) => a + b, 0);
    const draw = (i: number) => {
      if (i === frame) return;
      frame = i;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(clip.frames[i], 0, 0, canvas.width, canvas.height);
    };
    draw(0);
    if (clip.frames.length < 2 || !active) return;
    return subscribe((now) => {
      let t = (now - start) % total;
      if (now - start > total * 1000) start = now; // keep numbers small
      let i = 0;
      while (t >= clip.delays[i]) t -= clip.delays[i++];
      draw(i);
    });
  }, [clip, width, height, active]);

  // Until the frames are decoded (or if decoding fails) the plain GIF stands in
  if (!clip || failed) {
    return <img src={src} alt="" draggable={false} decoding="async" className={`pixelated select-none ${className}`} style={{ ...style, width, height }} />;
  }
  return <canvas ref={ref} aria-hidden="true" className={`select-none ${className}`} style={{ ...style, width, height }} />;
};
