import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PetDefinition } from '../types/pet';
import { resolveSpritePath } from '../components/PetRenderer';
import { getShowreel, petHash } from '../data/showreel';
import { loadVoxelClip } from './voxel';
import { VoxelPet, makeContactShadow, addStudioLights } from './VoxelPet';

interface World3DProps {
  pets: PetDefinition[];
  onOpen: (pet: PetDefinition) => void;
  className?: string;
}

const SPACING = 11;
const PET_SIZE = 6.5;

interface Resident {
  pet: PetDefinition;
  voxel: VoxelPet;
  anchor: THREE.Group;
  step: number;
  nextChange: number;
}

/* Every companion on one floor. Drag to orbit all the way round, scroll or
   pinch to zoom, hover to see who's who, click to open. Each pet drifts
   through its own showreel on its own clock. */
export const World3D: React.FC<World3DProps> = ({ pets, onOpen, className = '' }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const [hover, setHover] = useState<{ name: string; species: string; x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const el = renderer.domElement;
    el.style.display = 'block';
    el.style.touchAction = 'none';
    host.appendChild(el);

    const scene = new THREE.Scene();
    addStudioLights(scene);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 500);

    // Lay the cast out in a loose spiral so the world reads well from any side
    const residents: Resident[] = pets.map((pet, i) => {
      const angle = i * 2.399963; // golden angle
      const radius = SPACING * 0.62 * Math.sqrt(i + 0.6);
      const anchor = new THREE.Group();
      anchor.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      anchor.userData.lean = ((petHash(pet.id) % 70) - 35) * 0.01; // a little personality in how each one stands
      const voxel = new VoxelPet();
      voxel.group.userData.petId = pet.id;
      const shadow = makeContactShadow();
      shadow.scale.set(PET_SIZE * 0.9, PET_SIZE * 0.5, 1);
      anchor.add(shadow, voxel.group);
      scene.add(anchor);
      return { pet, voxel, anchor, step: petHash(pet.id) % getShowreel(pet).length, nextChange: 0 };
    });
    const worldRadius = SPACING * 0.62 * Math.sqrt(pets.length + 1) + SPACING;

    // Faint floor disc so the cast stands somewhere
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(worldRadius, 72),
      new THREE.MeshBasicMaterial({ color: 0x808090, transparent: true, opacity: 0.07, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const load = (r: Resident) => {
      const reel = getShowreel(r.pet);
      const action = reel[r.step % reel.length].action;
      loadVoxelClip(resolveSpritePath(r.pet, action))
        .then((clip) => {
          r.voxel.setClip(clip);
          r.voxel.group.scale.setScalar(PET_SIZE / Math.max(clip.height, clip.width * 0.72));
        })
        .catch(() => {});
    };
    residents.forEach(load);

    let yaw = 0.6;
    let pitch = 0.58;
    let distance = worldRadius * 2.7;
    let velocity = 0;
    let lastInput = -Infinity;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let moved = 0;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (clientX: number, clientY: number): Resident | null => {
      const rect = el.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(residents.map((r) => r.voxel.group), true);
      if (!hits.length) return null;
      let o: THREE.Object3D | null = hits[0].object;
      while (o && !o.userData.petId) o = o.parent;
      return residents.find((r) => r.pet.id === o?.userData.petId) ?? null;
    };

    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      moved = 0;
      velocity = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) {
        // Hover label
        const r = pick(e.clientX, e.clientY);
        if (r) {
          const rect = el.getBoundingClientRect();
          setHover({ name: r.pet.name, species: r.pet.species, x: e.clientX - rect.left, y: e.clientY - rect.top });
          el.style.cursor = 'pointer';
        } else {
          setHover(null);
          el.style.cursor = 'grab';
        }
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved += Math.abs(dx) + Math.abs(dy);
      lastInput = performance.now();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart) distance = Math.max(18, Math.min(worldRadius * 3.2, distance * (pinchStart / d)));
        pinchStart = d;
        return;
      }
      yaw -= dx * 0.006;
      velocity = -dx * 0.006;
      pitch = Math.max(0.12, Math.min(1.25, pitch + dy * 0.004));
      setHover(null);
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = 0;
      if (moved < 6 && e.type === 'pointerup') {
        const r = pick(e.clientX, e.clientY);
        if (r) onOpenRef.current(r.pet);
      }
      lastInput = performance.now();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(18, Math.min(worldRadius * 3.2, distance * (1 + e.deltaY * 0.0012)));
      lastInput = performance.now();
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', () => setHover(null));
    el.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      camera.aspect = w / h;
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
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      if (!visible || document.hidden) return;
      if (pointers.size === 0) {
        if (Math.abs(velocity) > 0.0005) {
          yaw += velocity;
          velocity *= 0.94;
        } else if (now - lastInput > 3000) {
          yaw += (0.06 * dt) / 1000;
        }
      }
      const d = distance / Math.min(1, camera.aspect);
      camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d + 2, Math.cos(yaw) * Math.cos(pitch) * d);
      camera.lookAt(0, 2.5, 0);

      const ease = 1 - Math.exp(-dt / 420);
      for (const r of residents) {
        // Everyone slowly turns to face you as you walk around them
        const target = yaw + r.anchor.userData.lean;
        let diff = target - r.anchor.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        r.anchor.rotation.y += diff * ease;
        r.voxel.update(dt);
        if (now > r.nextChange) {
          // Each pet moves on to its next moment on its own clock
          if (r.nextChange) {
            r.step += 1;
            load(r);
          }
          r.nextChange = now + 4200 + (petHash(r.pet.id + r.step) % 3800);
        }
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('wheel', onWheel);
      residents.forEach((r) => r.voxel.dispose());
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      el.remove();
    };
  }, [pets]);

  if (failed) {
    return <div className={`grid place-items-center text-small text-ink-3 ${className}`}>3D isn’t available on this device.</div>;
  }

  return (
    <div className={className || 'relative'}>
      <div ref={hostRef} className="absolute inset-0 cursor-grab" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-full bg-page/90 px-3 py-1 text-[12px] shadow-[inset_0_0_0_1px_var(--line-strong)] backdrop-blur-sm"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="font-medium text-ink">{hover.name}</span>
          <span className="text-ink-3"> · {hover.species}</span>
        </div>
      )}
    </div>
  );
};

export default World3D;
