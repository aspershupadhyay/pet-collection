import * as THREE from 'three';
import { VoxelClip } from './voxel';

const geometry = new THREE.BoxGeometry(1, 1, 1);

/* One animated voxel figure: an InstancedMesh refilled from the clip's
   current frame. Voxels are 1 world unit; scale the group to size it. */
export class VoxelPet {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh | null = null;
  private material: THREE.MeshStandardMaterial;
  private clip: VoxelClip | null = null;
  private frame = 0;
  private elapsed = 0;

  constructor() {
    this.material = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0 });
  }

  get size() {
    return this.clip ? { width: this.clip.width, height: this.clip.height } : { width: 1, height: 1 };
  }

  setClip(clip: VoxelClip) {
    this.clip = clip;
    this.frame = 0;
    this.elapsed = 0;
    if (!this.mesh || this.mesh.instanceMatrix.count < clip.maxCount) {
      if (this.mesh) {
        this.group.remove(this.mesh);
        this.mesh.dispose();
      }
      this.mesh = new THREE.InstancedMesh(geometry, this.material, clip.maxCount);
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(clip.maxCount * 3), 3);
      this.mesh.frustumCulled = false;
      this.group.add(this.mesh);
    }
    this.apply();
  }

  /** Advance the animation; returns true when the clip wrapped round. */
  update(dtMs: number): boolean {
    const clip = this.clip;
    if (!clip || clip.frames.length < 2) return false;
    this.elapsed += dtMs;
    let wrapped = false;
    while (this.elapsed >= clip.delays[this.frame]) {
      this.elapsed -= clip.delays[this.frame];
      this.frame = (this.frame + 1) % clip.frames.length;
      if (this.frame === 0) wrapped = true;
      this.apply();
    }
    return wrapped;
  }

  get clipDuration() {
    return this.clip ? this.clip.delays.reduce((a, b) => a + b, 0) : 0;
  }

  private apply() {
    const mesh = this.mesh;
    const clip = this.clip;
    if (!mesh || !clip) return;
    const f = clip.frames[this.frame];
    const m = mesh.instanceMatrix.array as Float32Array;
    const c = mesh.instanceColor!.array as Float32Array;
    for (let i = 0; i < f.count; i += 1) {
      const o = i * 16;
      // scale(1, 1, depth) then translate(x, y, z)
      m[o] = 1; m[o + 1] = 0; m[o + 2] = 0; m[o + 3] = 0;
      m[o + 4] = 0; m[o + 5] = 1; m[o + 6] = 0; m[o + 7] = 0;
      m[o + 8] = 0; m[o + 9] = 0; m[o + 10] = f.cells[i * 4 + 2]; m[o + 11] = 0;
      m[o + 12] = f.cells[i * 4]; m[o + 13] = f.cells[i * 4 + 1]; m[o + 14] = f.cells[i * 4 + 3]; m[o + 15] = 1;
      c[i * 3] = f.colors[i * 3];
      c[i * 3 + 1] = f.colors[i * 3 + 1];
      c[i * 3 + 2] = f.colors[i * 3 + 2];
    }
    mesh.count = f.count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }

  dispose() {
    this.mesh?.dispose();
    this.material.dispose();
  }
}

/** Soft round contact shadow, drawn once into a texture. */
export function makeContactShadow(): THREE.Mesh {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.42)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.14)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

export function addStudioLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6b80, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(5, 9, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd4ff, 1.1);
  rim.position.set(-8, 5, -9);
  scene.add(rim);
}
