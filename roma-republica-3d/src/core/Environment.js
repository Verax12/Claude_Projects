/**
 * Ambiente: céu físico (Sky), sol direcional com sombras que acompanham o jogador,
 * luz hemisférica, neblina atmosférica e mapa de ambiente (IBL) gerado a partir do céu.
 *
 * A posição do sol é calculada para a latitude de Roma (41,9° N) numa data de
 * primavera (declinação +5°), em função da hora solar escolhida (6h–18h).
 */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const DEG = Math.PI / 180;
const LAT = 41.89;

/** Posição do sol: devolve { elevation, azimuth } em graus (azimute a partir do norte, horário). */
export function solarPosition(hour, declinationDeg = 5) {
  const phi = LAT * DEG;
  const dec = declinationDeg * DEG;
  const H = (hour - 12) * 15 * DEG;
  const sinEl = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const el = Math.asin(sinEl);
  let az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / DEG + 180;
  az = (az + 360) % 360;
  return { elevation: el / DEG, azimuth: az };
}

export class Environment {
  constructor(renderer, scene, quality) {
    this.renderer = renderer;
    this.scene = scene;
    this.quality = quality;
    this.sunDir = new THREE.Vector3();

    // Céu
    this.sky = new Sky();
    this.sky.scale.setScalar(9000);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 4.5;
    u.rayleigh.value = 1.4;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.82;
    scene.add(this.sky);

    // Sol
    this.sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    const r = quality.shadowRadius;
    sc.left = -r;
    sc.right = r;
    sc.top = r;
    sc.bottom = -r;
    sc.near = 1;
    sc.far = 900;
    this.sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.06;
    scene.add(this.sun);
    scene.add(this.sun.target);

    // Preenchimento: céu azulado / chão quente
    this.hemi = new THREE.HemisphereLight(0xbfd4e6, 0x8a7a5c, 0.35);
    scene.add(this.hemi);

    // Neblina (perspectiva aérea)
    this.fog = new THREE.Fog(0xc3ccd2, 250, quality.viewDistance);
    scene.fog = this.fog;

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envTarget = null;
    this.setTime(9.5);
  }

  /** Define a hora solar (6–18) e atualiza sol, céu, neblina e IBL. */
  setTime(hour) {
    this.hour = Math.min(18.5, Math.max(5.5, hour));
    const { elevation, azimuth } = solarPosition(this.hour);
    const el = Math.max(elevation, 1) * DEG;
    const az = azimuth * DEG;
    this.sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
    this.sky.material.uniforms.sunPosition.value.copy(this.sunDir);

    // cor/intensidade do sol conforme a elevação (mais quente perto do horizonte)
    const k = Math.min(1, Math.max(0, (elevation - 2) / 30));
    this.sun.color.setRGB(1, 0.78 + 0.2 * k, 0.6 + 0.32 * k);
    this.sun.intensity = 0.6 + 2.8 * k;
    this.hemi.intensity = 0.15 + 0.25 * k;
    const fogC = new THREE.Color().setRGB(0.62 + 0.14 * k, 0.6 + 0.2 * k, 0.6 + 0.24 * k);
    this.fog.color.copy(fogC);

    // IBL a partir do céu
    const skyScene = new THREE.Scene();
    const skyCopy = new Sky();
    skyCopy.scale.setScalar(9000);
    for (const key of Object.keys(this.sky.material.uniforms)) {
      const v = this.sky.material.uniforms[key].value;
      skyCopy.material.uniforms[key].value = v && v.clone ? v.clone() : v;
    }
    skyScene.add(skyCopy);
    if (this.envTarget) this.envTarget.dispose();
    this.envTarget = this.pmrem.fromScene(skyScene, 0, 1, 20000);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.42;
    skyCopy.material.dispose();
    skyCopy.geometry.dispose();
  }

  /** Faz a câmera de sombra acompanhar o ponto `focus` (com encaixe em texels contra cintilação). */
  update(focus) {
    const r = this.quality.shadowRadius;
    const texel = (2 * r) / this.quality.shadowMapSize;
    // base do espaço da luz
    const fwd = this.sunDir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const px = Math.round(focus.dot(right) / texel) * texel;
    const py = Math.round(focus.dot(up) / texel) * texel;
    const pz = focus.dot(fwd);
    const snapped = right.multiplyScalar(px).add(up.multiplyScalar(py)).add(fwd.clone().multiplyScalar(pz));
    this.sun.target.position.copy(snapped);
    this.sun.position.copy(snapped).addScaledVector(this.sunDir, 450);
    this.sun.target.updateMatrixWorld();
  }

  /** Ajusta o alcance da neblina (qualidade). */
  setViewDistance(d) {
    this.fog.far = d;
  }
}
