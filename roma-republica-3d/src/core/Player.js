/**
 * Jogador em primeira pessoa com colisão por cápsula contra a BVH do mundo
 * (técnica do exemplo "characterMovement" do three-mesh-bvh) + terreno analítico.
 *
 * Controles:
 *   clique = captura o mouse | WASD/setas = andar | Shift = correr | Espaço = pular
 *   F = modo voo (sem colisão; Q/E descem/sobem) | V = 1ª/3ª pessoa
 */
import * as THREE from 'three';
import { config } from './config.js';

const CAPSULE_RADIUS = 0.3;
const CAPSULE_SEGMENT = 1.15; // distância entre os centros das esferas da cápsula
const FEET_OFFSET = CAPSULE_SEGMENT + CAPSULE_RADIUS; // posição (esfera de cima) → pés
const EYE_OFFSET = config.eyeHeight - FEET_OFFSET; // acima da esfera de cima
const GRAVITY = -22;
const JUMP_SPEED = 6.2;

const _tmpV = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _box = new THREE.Box3();
const _seg = new THREE.Line3();
const _delta = new THREE.Vector3();

export class Player {
  constructor(camera, dom, world) {
    this.camera = camera;
    this.dom = dom;
    this.world = world;
    /** Posição do centro da esfera superior da cápsula. */
    this.position = new THREE.Vector3(0, 10, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.fly = false;
    this.thirdPerson = false;
    this.keys = new Set();
    this.locked = false;
    this.enabled = true;
    this.lastSafe = this.position.clone();
    this.stepAccum = 0;
    /** Callback de passo: fn(velocidade) — usado pelo áudio. */
    this.onStep = null;
    this.avatar = null;
    this._initInput();
  }

  _initInput() {
    this.dom.addEventListener('click', () => {
      if (!this.locked && this.enabled) this.dom.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange?.(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      const s = 0.0022;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      this.keys.add(e.code);
      if (e.code === 'KeyF' && !e.repeat) this.toggleFly();
      if (e.code === 'KeyV' && !e.repeat) this.thirdPerson = !this.thirdPerson;
      if (e.code === 'Space' && this.onGround && !this.fly) {
        this.velocity.y = JUMP_SPEED;
        this.onGround = false;
      }
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  toggleFly() {
    this.fly = !this.fly;
    this.velocity.set(0, 0, 0);
    this.onFlyChange?.(this.fly);
  }

  /** Posição dos pés. */
  get feet() {
    return new THREE.Vector3(this.position.x, this.position.y - FEET_OFFSET, this.position.z);
  }

  /**
   * Teleporta para (x, z) — a altura é obtida do chão (edifícios ou terreno) abaixo de yHint.
   * @param {number} yaw  rumo da câmera em radianos (0 = olhando para -Z/norte)
   */
  teleport(x, z, yaw = this.yaw, yHint = 400, pitch = 0) {
    const g = this.world.groundAt(x, z, yHint);
    this.position.set(x, g + FEET_OFFSET + 0.05, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = pitch;
    this.lastSafe.copy(this.position);
    this.updateCamera();
  }

  /** Posiciona diretamente a câmera (modo voo), usado pelo parâmetro ?cam=. */
  setView(x, y, z, yawDeg, pitchDeg) {
    this.fly = true;
    this.position.set(x, y - EYE_OFFSET, z);
    this.yaw = (yawDeg * Math.PI) / 180;
    this.pitch = (pitchDeg * Math.PI) / 180;
    this.updateCamera();
  }

  /** Direção de entrada (local, no plano XZ). */
  inputVector() {
    const k = this.keys;
    let f = 0;
    let s = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) s += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) s -= 1;
    const v = new THREE.Vector3(s, 0, -f);
    if (v.lengthSq() > 0) v.normalize();
    // gira pelo yaw
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return v;
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    if (!this.enabled) {
      this.updateCamera();
      return;
    }
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const dir = this.inputVector();

    if (this.fly) {
      const sp = run ? 40 : 12;
      this.position.addScaledVector(dir, sp * dt);
      if (this.keys.has('KeyE') || this.keys.has('Space')) this.position.y += sp * dt;
      if (this.keys.has('KeyQ') || this.keys.has('ControlLeft')) this.position.y -= sp * dt;
      this.updateCamera();
      return;
    }

    const speed = run ? config.runSpeed : config.walkSpeed;
    const steps = 5;
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.physicsStep(h, dir, speed);

    // contador de passos (áudio)
    const hs = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.onGround && hs > 0.5) {
      this.stepAccum += hs * dt;
      const stride = run ? 1.5 : 0.85;
      if (this.stepAccum > stride) {
        this.stepAccum = 0;
        this.onStep?.(hs);
      }
    }

    // queda fora do mundo → volta ao último ponto seguro
    if (this.position.y < -60) {
      this.position.copy(this.lastSafe);
      this.velocity.set(0, 0, 0);
    } else if (this.onGround && Math.random() < 0.02) {
      this.lastSafe.copy(this.position);
    }
    this.updateCamera();
  }

  physicsStep(dt, dir, speed) {
    // velocidade horizontal: aceleração suave em direção à desejada
    const accel = this.onGround ? 14 : 3;
    const tx = dir.x * speed;
    const tz = dir.z * speed;
    this.velocity.x += (tx - this.velocity.x) * Math.min(1, accel * dt);
    this.velocity.z += (tz - this.velocity.z) * Math.min(1, accel * dt);
    if (this.onGround && this.velocity.y <= 0) this.velocity.y = GRAVITY * dt;
    else this.velocity.y += GRAVITY * dt;

    this.position.addScaledVector(this.velocity, dt);

    // colisão cápsula × BVH
    const collider = this.world.collider;
    let groundedByMesh = false;
    if (collider) {
      _seg.start.copy(this.position);
      _seg.end.copy(this.position).y -= CAPSULE_SEGMENT;
      _box.makeEmpty();
      _box.expandByPoint(_seg.start);
      _box.expandByPoint(_seg.end);
      _box.min.addScalar(-CAPSULE_RADIUS);
      _box.max.addScalar(CAPSULE_RADIUS);
      collider.geometry.boundsTree.shapecast({
        intersectsBounds: (box) => box.intersectsBox(_box),
        intersectsTriangle: (tri) => {
          const triPoint = _tmpV;
          const capsulePoint = _tmpV2;
          const distance = tri.closestPointToSegment(_seg, triPoint, capsulePoint);
          if (distance < CAPSULE_RADIUS) {
            const depth = CAPSULE_RADIUS - distance;
            const direction = capsulePoint.sub(triPoint).normalize();
            _seg.start.addScaledVector(direction, depth);
            _seg.end.addScaledVector(direction, depth);
          }
        },
      });
      _delta.subVectors(_seg.start, this.position);
      groundedByMesh = _delta.y > Math.abs(dt * this.velocity.y * 0.25);
      const offset = Math.max(0, _delta.length() - 1e-5);
      _delta.normalize().multiplyScalar(offset);
      this.position.add(_delta);
      if (!groundedByMesh && offset > 0) {
        _delta.normalize();
        this.velocity.addScaledVector(_delta, -_delta.dot(this.velocity));
      }
    }

    // terreno analítico
    const t = this.world.terrain ? this.world.terrain.heightAt(this.position.x, this.position.z) : -Infinity;
    const feetY = this.position.y - FEET_OFFSET;
    let groundedByTerrain = false;
    if (feetY <= t + 0.02) {
      // só empurra para CIMA (nunca puxa para baixo: isso anularia a subida em rampas)
      if (feetY < t) this.position.y += t - feetY;
      groundedByTerrain = true;
    }
    this.onGround = groundedByMesh || groundedByTerrain;
    if (this.onGround && this.velocity.y < 0) this.velocity.y = 0;
  }

  updateCamera() {
    const cam = this.camera;
    cam.rotation.order = 'YXZ';
    cam.rotation.y = this.yaw;
    cam.rotation.x = this.pitch;
    const eye = _tmpV.set(this.position.x, this.position.y + EYE_OFFSET, this.position.z);
    if (this.thirdPerson && !this.fly) {
      // câmera atrás e acima do jogador, sem atravessar paredes (raio contra a BVH)
      const back = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
      let dist = 3.2;
      if (this.world.collider) {
        const ray = new THREE.Ray(eye.clone(), back.clone());
        const hit = this.world.collider.geometry.boundsTree.raycastFirst(ray, THREE.DoubleSide);
        if (hit && hit.distance < dist + 0.3) dist = Math.max(0.4, hit.distance - 0.3);
      }
      cam.position.copy(eye).addScaledVector(back, dist).add(new THREE.Vector3(0, 0.25, 0));
      if (this.avatar) {
        this.avatar.visible = true;
        this.avatar.position.set(this.position.x, this.position.y - FEET_OFFSET, this.position.z);
        this.avatar.rotation.y = this.yaw + Math.PI;
      }
    } else {
      cam.position.copy(eye);
      if (this.avatar) this.avatar.visible = false;
    }
  }
}

export { FEET_OFFSET, EYE_OFFSET };
