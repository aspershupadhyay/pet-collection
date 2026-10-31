import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PetAction, PetDefinition } from '../types/pet';
import { resolveSpritePath } from '../components/PetRenderer';
import { getShowreel } from '../data/showreel';
import { loadVoxelClip } from './voxel';
import { VoxelPet, makeContactShadow, addStudioLights } from './VoxelPet';

interface Voxel3DProps {
  pet: PetDefinition;
  variant?: string;
  /** Play one move; omit to loop through the pet's whole showreel. */
  action?: PetAction;
  /** Reports which showreel moment is playing (reel mode only). */
  onMoment?: (index: number) => void;
  className?: string;
}

const MIN_MOMENT_MS = 3400;
const SPIN_SPEED = 0.32; // rad/s while idle
const IDLE_BEFORE_SPIN = 2200;

/* A pixel pet you can turn all the way round. Drag (or swipe) to spin with
   momentum; left alone it slowly turns by itself. */
export const Voxel3D: React.FC<Voxel3DProps> = ({ pet, variant = pet.sprites.variant, action, onMoment, className = '' }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<VoxelPet | null>(null);
  const fitRef = useRef<(w: number, h: number) => void>(() => {});
  const [failed, setFailed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState(0);
  const onMomentRef = useRef(onMoment);
  onMomentRef.current = onMoment;
  const actionRef = useRef(action);
  actionRef.current = action;

  const reel = getShowreel(pet);
  const currentAction = action ?? reel[step % reel.length].action;

  // Renderer, scene and interaction — set up once per mount
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    addStudioLights(scene);
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    const voxel = new VoxelPet();
    petRef.current = voxel;
    const turntable = new THREE.Group();
    turntable.add(voxel.group);
    const shadow = makeContactShadow();
    scene.add(shadow);
    scene.add(turntable);

    // Fit: the model is normalised to ~7 units, wide pets by width
    fitRef.current = (gw, gh) => {
      const s = 7 / Math.max(gh, gw * 0.72);
      voxel.group.scale.setScalar(s);
      shadow.scale.set(gw * s * 0.9, gw * s * 0.5, 1);
    };

    let yaw = -0.5;
    let pitch = 0.12;
    let velocity = 0;
    let lastInput = -Infinity;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velocity = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      setTouched(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw += dx * 0.012;
      velocity = dx * 0.012;
      pitch = Math.max(-0.35, Math.min(0.6, pitch + dy * 0.006));
      lastInput = performance.now();
    };
    const onUp = () => {
      dragging = false;
      lastInput = performance.now();
    };
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('dblclick', () => {
      yaw = -0.5;
      pitch = 0.12;
      velocity = 0;
    });

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      camera.aspect = w / h;
      // Keep the whole figure in frame on narrow stages
      const dist = 40 / Math.min(1, camera.aspect * 1.1);
      camera.position.set(0, 7, dist);
      camera.lookAt(0, 3.6, 0);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(host);

    let raf = 0;
    let last = performance.now();
    let momentStart = last;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      if (!visible || document.hidden) return;
      if (!dragging) {
        if (Math.abs(velocity) > 0.0005) {
          yaw += velocity;
          velocity *= 0.94;
        } else if (now - lastInput > IDLE_BEFORE_SPIN) {
          yaw += (SPIN_SPEED * dt) / 1000;
        }
      }
      turntable.rotation.set(pitch, yaw, 0);
      voxel.update(dt);
      // Reel mode: move on once the moment has had its time and the clip looped
      if (!actionRef.current && now - momentStart > Math.max(MIN_MOMENT_MS, voxel.clipDuration * 2)) {
        momentStart = now;
        setStep((s) => s + 1);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      voxel.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.MeshBasicMaterial).map?.dispose();
      (shadow.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // hand the context back; browsers cap how many exist
      el.remove();
      petRef.current = null;
    };
  }, []);

  useEffect(() => setStep(0), [pet.id]);

  useEffect(() => {
    if (!action) onMomentRef.current?.(step % reel.length);
  }, [step, action, reel.length]);

  // Load the clip for the current move
  useEffect(() => {
    let stale = false;
    loadVoxelClip(resolveSpritePath(pet, currentAction, variant))
      .catch(() => loadVoxelClip(resolveSpritePath(pet, currentAction)))
      .then((clip) => {
        if (stale || !petRef.current) return;
        petRef.current.setClip(clip);
        fitRef.current(clip.width, clip.height);
      })
      .catch(() => setFailed(true));
    return () => {
      stale = true;
    };
  }, [pet, currentAction, variant]);

  if (failed) {
    return (
      <div className={`grid place-items-center text-small text-ink-3 ${className}`}>3D preview isn’t available on this device.</div>
    );
  }

  return (
    <div className={className || 'relative'}>
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-4 bottom-3.5 flex justify-end transition-opacity duration-500 ${touched ? 'opacity-0' : 'opacity-100'}`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-page/80 px-3 py-1 text-[12px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12a9 4 0 0 0 18 0M21 12a9 4 0 0 0-18 0" opacity="0.4" />
            <path d="M17 15l4-3M7 9 3 12" />
          </svg>
          Drag to turn
        </span>
      </div>
    </div>
  );
};

export default Voxel3D;
