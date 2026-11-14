/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * three.js billing machine for the home hero.
 * Toon shading + ink outlines, three-quarter view, slight tilt toward the mouse.
 * Driven by the hero: `typing()` while the sentence flips, `print(receipt)` once
 * it settles (and again when the class/board changes), `showPrinted(receipt)` to
 * jump straight to a finished bill. Renders on demand and stops when idle.
 * Loaded with a dynamic import so three.js only ships on the home page.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORDMARK } from '@/components/brand/wordmarkPaths';
import { inr, type Receipt } from './receiptData';
import { createMachineSound } from './machineSound';

export type MachineScene = {
  typing: () => void;
  print: (r: Receipt) => void;
  showPrinted: (r: Receipt) => void;
  setVisible: (v: boolean) => void;
  refreshTheme: () => void;
  setMuted: (m: boolean) => void;
  isMuted: () => boolean;
  dispose: () => void;
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export function createMachineScene(canvas: HTMLCanvasElement, opts: { onFirstFrame?: () => void } = {}): MachineScene {
  const root = document.documentElement;
  const css = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
  const isDark = () => root.classList.contains('dark');
  // canvas text uses the page's own (next/font) family name
  const SANS = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';

  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const VIEW_H = 712;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  camera.position.set(0, 0, 800);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a98c0, 1.15);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(-200, 300, 500);
  scene.add(sunLight);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  // ---------- toon + ink outline ----------
  const ramp = track(new THREE.DataTexture(new Uint8Array([160, 215, 255]), 3, 1, THREE.RedFormat));
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const outlineMats: THREE.ShaderMaterial[] = [];
  const toonMats: THREE.MeshToonMaterial[] = [];
  const outlineMat = (t: number) => {
    const m = track(
      new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color() }, t: { value: t } },
        vertexShader: 'uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }',
        fragmentShader: 'uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }',
        side: THREE.BackSide,
      }),
    );
    outlineMats.push(m);
    return m;
  };
  function inked(geo: THREE.BufferGeometry, key: string, thick = 2.2) {
    track(geo);
    const mat = track(new THREE.MeshToonMaterial({ gradientMap: ramp }));
    mat.userData.key = key;
    toonMats.push(mat);
    const sg = geo.clone();
    sg.deleteAttribute('normal');
    if (sg.attributes.uv) sg.deleteAttribute('uv');
    const hull = track(mergeVertices(sg, 0.05));
    sg.dispose();
    hull.computeVertexNormals();
    const g = new THREE.Group();
    g.add(new THREE.Mesh(hull, outlineMat(thick)), new THREE.Mesh(geo, mat));
    return g;
  }
  const palette = () => ({
    ink: new THREE.Color(css('--edge') || '#17153a'),
    card: new THREE.Color(css('--card') || '#f7f7fa'),
    // machine body: its own colour so it reads as a solid object on the dark page
    body: new THREE.Color(isDark() ? '#3a3a40' : (css('--card') || '#f7f7fa')),
    sun: new THREE.Color('#ffc93c'),
    green: new THREE.Color('#12a874'),
    rose: new THREE.Color('#ff8fa3'),
    key: new THREE.Color(isDark() ? '#5a5a63' : '#dfdee7'),
    sunRoll: new THREE.Color(isDark() ? '#e6b64a' : '#ffc93c'),
    lcd: new THREE.Color('#17153a'),
  });
  const canvasTex = (c: HTMLCanvasElement) => {
    const t = track(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };

  // ---------- machine ----------
  const machine = new THREE.Group();
  machine.position.set(-14, 6, 0);
  scene.add(machine);
  const BASE_W = 380, BASE_H = 54, BASE_D = 250, BASE_Y = -262;
  const base = inked(new RoundedBoxGeometry(BASE_W, BASE_H, BASE_D, 6, 18), 'body', 2.6);
  base.position.set(0, BASE_Y, 0);
  machine.add(base);
  for (const [fx, fz] of [[-160, -100], [160, -100], [-160, 100], [160, 100]]) {
    const f = inked(new THREE.CylinderGeometry(14, 16, 12, 20), 'lcd', 1.6);
    f.position.set(fx, BASE_Y - BASE_H / 2 - 4, fz);
    machine.add(f);
  }
  const HOUSE_H = 120, HOUSE_D = 110, HOUSE_Z = -BASE_D / 2 + HOUSE_D / 2 + 6;
  const HOUSE_Y = BASE_Y + BASE_H / 2 + HOUSE_H / 2 - 4;
  const house = inked(new RoundedBoxGeometry(BASE_W - 6, HOUSE_H, HOUSE_D, 6, 18), 'body', 2.6);
  house.position.set(0, HOUSE_Y, HOUSE_Z);
  machine.add(house);
  const roll = inked(new THREE.CylinderGeometry(44, 44, BASE_W - 40, 40), 'sunRoll', 2.2);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, HOUSE_Y + HOUSE_H / 2 - 6, HOUSE_Z - 14);
  machine.add(roll);
  const SLOT_Y = HOUSE_Y + HOUSE_H / 2 + 2, SLOT_Z = HOUSE_Z + HOUSE_D / 2 - 20;
  const slot = inked(new RoundedBoxGeometry(BASE_W - 70, 10, 18, 3, 4), 'lcd', 2);
  slot.position.set(0, SLOT_Y, SLOT_Z);
  machine.add(slot);
  const tearBar = inked(new RoundedBoxGeometry(BASE_W - 60, 7, 8, 2, 3), 'key', 1.8);
  tearBar.position.set(0, SLOT_Y + 3, SLOT_Z + 15);
  machine.add(tearBar);

  // LCD
  const lcdCanvas = document.createElement('canvas');
  lcdCanvas.width = 512;
  lcdCanvas.height = 208;
  const lcdTex = canvasTex(lcdCanvas);
  let lcdValue = 0;
  function drawLcd(v: number) {
    const c = lcdCanvas.getContext('2d')!;
    c.fillStyle = '#17153a';
    c.fillRect(0, 0, 512, 208);
    c.fillStyle = 'rgba(124,240,198,.65)';
    c.font = `800 34px ${SANS}`;
    c.fillText('TOTAL', 28, 58);
    c.fillStyle = '#7cf0c6';
    c.font = `800 88px ${MONO}`;
    c.fillText(inr(v), 26, 168);
    lcdTex.needsUpdate = true;
  }
  const HOUSE_FRONT = HOUSE_Z + HOUSE_D / 2;
  const lcdBox = inked(new RoundedBoxGeometry(200, 78, 12, 4, 10), 'lcd', 2.2);
  lcdBox.position.set(-70, HOUSE_Y - 6, HOUSE_FRONT + 4);
  machine.add(lcdBox);
  const lcdFace = new THREE.Mesh(track(new THREE.PlaneGeometry(186, 66)), track(new THREE.MeshBasicMaterial({ map: lcdTex })));
  lcdFace.position.set(-70, HOUSE_Y - 6, HOUSE_FRONT + 10.5);
  machine.add(lcdFace);
  const ledMat = track(new THREE.MeshBasicMaterial({ color: 0x3ee0a5 }));
  const led = new THREE.Mesh(track(new THREE.SphereGeometry(6, 16, 12)), ledMat);
  led.position.set(110, HOUSE_Y + 20, HOUSE_FRONT + 3);
  machine.add(led);
  const ledRing = inked(new THREE.TorusGeometry(8, 2, 8, 24), 'lcd', 1);
  ledRing.position.copy(led.position);
  machine.add(ledRing);

  // keypad deck
  const DECK_D = BASE_D - HOUSE_D - 10;
  const deck = new THREE.Group();
  deck.position.set(0, BASE_Y + BASE_H / 2 + 6, HOUSE_FRONT + DECK_D / 2 + 2);
  deck.rotation.x = 0.22;
  machine.add(deck);
  deck.add(inked(new RoundedBoxGeometry(BASE_W - 20, 14, DECK_D, 4, 6), 'body', 2.2));
  const LEGENDS = ['7', '8', '9', 'C', '4', '5', '6', '×', '1', '2', '3', '−', '0', '00', '.', '='];
  const keyColor = (l: string) => (l === 'C' ? 'rose' : l === '=' ? 'green' : l === '×' || l === '−' ? 'sun' : 'key');
  const keys: THREE.Group[] = [];
  const legendMats: THREE.MeshBasicMaterial[] = [];
  const KEY = 30, GAP = 8;
  LEGENDS.forEach((l, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const k = inked(new RoundedBoxGeometry(KEY, 14, KEY, 3, 6), keyColor(l), 1.8);
    k.position.set(30 + col * (KEY + GAP), 14, -DECK_D / 2 + 26 + row * (KEY + GAP));
    k.userData.restY = k.position.y;
    const m = track(new THREE.MeshBasicMaterial({ transparent: true }));
    legendMats.push(m);
    const lp = new THREE.Mesh(track(new THREE.PlaneGeometry(KEY - 3, KEY - 3)), m);
    lp.rotation.x = -Math.PI / 2;
    lp.position.y = 7.3;
    k.add(lp);
    deck.add(k);
    keys.push(k);
  });
  const printKey = inked(new RoundedBoxGeometry(150, 16, 58, 4, 10), 'green', 2);
  printKey.position.set(-95, 15, 22);
  printKey.userData.restY = printKey.position.y;
  deck.add(printKey);
  const printLabelMat = track(new THREE.MeshBasicMaterial({ transparent: true }));
  const printLabel = new THREE.Mesh(track(new THREE.PlaneGeometry(130, 34)), printLabelMat);
  printLabel.rotation.x = -Math.PI / 2;
  printLabel.position.y = 8.3;
  printKey.add(printLabel);
  function drawLegends() {
    LEGENDS.forEach((l, i) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const c = cv.getContext('2d')!;
      c.fillStyle = keyColor(l) === 'key' && isDark() ? '#ffffff' : '#17153a';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 ${l.length > 1 ? 62 : 84}px ${SANS}`;
      c.fillText(l, 64, 70);
      legendMats[i].map?.dispose();
      const lt = new THREE.CanvasTexture(cv);
      lt.colorSpace = THREE.SRGBColorSpace;
      lt.anisotropy = renderer.capabilities.getMaxAnisotropy();
      legendMats[i].map = lt;
      legendMats[i].needsUpdate = true;
    });
    const cv = document.createElement('canvas');
    cv.width = 260;
    cv.height = 68;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#17153a';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 40px ${SANS}`;
    c.fillText('PRINT', 130, 38);
    printLabelMat.map?.dispose();
    printLabelMat.map = new THREE.CanvasTexture(cv);
    printLabelMat.map.colorSpace = THREE.SRGBColorSpace;
    printLabelMat.needsUpdate = true;
  }

  // brand plate: the Sybrary wordmark
  const brandCanvas = document.createElement('canvas');
  brandCanvas.width = 512;
  brandCanvas.height = 64;
  const brandTex = canvasTex(brandCanvas);
  const brandFace = new THREE.Mesh(track(new THREE.PlaneGeometry(200, 25)), track(new THREE.MeshBasicMaterial({ map: brandTex, transparent: true })));
  brandFace.position.set(0, BASE_Y - 2, BASE_D / 2 + 0.8);
  machine.add(brandFace);
  function drawBrand() {
    const c = brandCanvas.getContext('2d')!;
    c.clearRect(0, 0, 512, 64);
    const [vx, vy, vw, vh] = WORDMARK.viewBox.split(' ').map(Number);
    const s = 56 / vh;
    c.save();
    c.translate(256 - (vw * s) / 2, 4);
    c.scale(s, s);
    c.translate(-vx, -vy);
    c.fillStyle = isDark() ? '#f4f3fa' : '#17153a';
    c.fill(new Path2D(WORDMARK.prefix));
    c.lineCap = 'butt';
    c.lineJoin = 'round';
    const ind = css('--primary') || '#5552e8';
    const grn = isDark() ? '#3ee0a5' : '#12a874';
    WORDMARK.r.forEach((st) => {
      c.strokeStyle = ind;
      c.lineWidth = st.w;
      c.stroke(new Path2D(st.d));
    });
    c.fillStyle = ind;
    c.fill(new Path2D(WORDMARK.rHead));
    WORDMARK.y.forEach((st) => {
      c.strokeStyle = grn;
      c.lineWidth = st.w;
      c.stroke(new Path2D(st.d));
    });
    c.fillStyle = grn;
    c.fill(new Path2D(WORDMARK.yHead));
    c.restore();
    brandTex.needsUpdate = true;
  }

  // ---------- receipt paper ----------
  const PAPER_W = 270, PAPER_H = 440;
  const paperCanvas = document.createElement('canvas');
  paperCanvas.width = 540;
  paperCanvas.height = 880;
  const paperTex = canvasTex(paperCanvas);
  paperTex.anisotropy = 8;
  const LINES = 14;
  let receipt: Receipt | null = null;
  let paperTint = '#fffdf6';
  function drawPaper(rowsShown: number) {
    const c = paperCanvas.getContext('2d')!;
    const W = 540, H = 880;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.fillStyle = paperTint;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.moveTo(0, 0);
    for (let x = 0; x <= W; x += 30) { c.lineTo(x, 22); c.lineTo(x + 15, 0); }
    c.lineTo(W, 0);
    c.closePath();
    c.fill();
    c.globalCompositeOperation = 'source-over';
    if (receipt) {
      const r = receipt;
      c.fillStyle = '#17153a';
      let y = 74;
      let row = 0;
      const show = () => row++ < rowsShown;
      const text = (s: string, x: number, size = 27, w = 600, align: CanvasTextAlign = 'left') => {
        c.font = `${w} ${size}px ${MONO}`;
        c.textAlign = align;
        c.fillText(s, x, y);
      };
      if (show()) text('SYBRARY', W / 2, 38, 800, 'center');
      y += 40;
      if (show()) { c.globalAlpha = 0.7; text(`Reuse receipt, Class ${r.cls} ${r.boardLabel}`, W / 2, 22, 600, 'center'); c.globalAlpha = 1; }
      y += 34;
      if (show()) { c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeStyle = '#17153a'; c.beginPath(); c.moveTo(28, y); c.lineTo(W - 28, y); c.stroke(); c.setLineDash([]); }
      y += 44;
      for (const it of r.items) {
        if (show()) {
          text(it.name, 32);
          c.globalAlpha = 0.45;
          text(String(it.mrp), W - 120, 27, 600, 'right');
          c.fillRect(W - 182, y - 9, 64, 3);
          c.globalAlpha = 1;
          text(String(it.reuse), W - 32, 27, 800, 'right');
        }
        y += 44;
      }
      if (show()) { c.setLineDash([10, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(28, y - 18); c.lineTo(W - 28, y - 18); c.stroke(); c.setLineDash([]); }
      y += 26;
      if (show()) { c.globalAlpha = 0.7; text('Bought new', 32, 26); text(inr(r.totalNew), W - 32, 26, 600, 'right'); c.fillRect(W - 130, y - 9, 98, 3); c.globalAlpha = 1; }
      y += 44;
      if (show()) { text('Reused set', 32, 30, 800); text(inr(r.totalReuse), W - 32, 30, 800, 'right'); }
      y += 30;
      if (show()) {
        c.fillStyle = '#12a874';
        c.beginPath();
        c.roundRect(24, y, W - 48, 54, 10);
        c.fill();
        c.fillStyle = '#17153a';
        y += 38;
        text('You saved', 40, 30, 800);
        text(inr(r.saved), W - 40, 30, 800, 'right');
        y -= 38;
      }
      y += 92;
      if (show()) { c.globalAlpha = 0.8; text('5 books kept in use, none reprinted', W / 2, 21, 600, 'center'); c.globalAlpha = 1; }
      y += 26;
      if (show()) { for (let x = 40; x < W - 40; x += 6) { const w = [2, 1, 3, 1, 2, 4][(x / 6) % 6 | 0]; c.fillRect(x, y, w * 1.4, 64); } }
      y += 100;
      if (show()) { c.globalAlpha = 0.6; text('Thank you for reusing', W / 2, 22, 600, 'center'); c.globalAlpha = 1; }
    }
    c.strokeStyle = '#17153a';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(3, 22); c.lineTo(3, H - 3); c.lineTo(W - 3, H - 3); c.lineTo(W - 3, 22);
    c.stroke();
    c.lineWidth = 5;
    c.beginPath();
    for (let x = 0; x <= W; x += 30) { c.lineTo(x, 22); c.lineTo(x + 15, 2); }
    c.stroke();
    paperTex.needsUpdate = true;
  }
  const paperGeo = track(new THREE.PlaneGeometry(PAPER_W, PAPER_H, 16, 48));
  {
    const p = paperGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + PAPER_H / 2) / PAPER_H;
      const u = p.getX(i) / (PAPER_W / 2);
      p.setZ(i, Math.pow(t, 2.4) * 70 - u * u * 9);
    }
    p.needsUpdate = true;
    paperGeo.computeVertexNormals();
  }
  const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const paperMat = track(new THREE.MeshBasicMaterial({ map: paperTex, side: THREE.DoubleSide, alphaTest: 0.5, clippingPlanes: [clip] }));
  const shadowMat = track(new THREE.MeshBasicMaterial({ color: 0x0c0b1e, alphaMap: paperTex, alphaTest: 0.5, side: THREE.DoubleSide, clippingPlanes: [clip] }));
  const paper = new THREE.Mesh(paperGeo, paperMat);
  const paperShadow = new THREE.Mesh(paperGeo, shadowMat);
  paperShadow.position.set(6, -6, -2);
  shadowMat.depthWrite = false;
  paperShadow.renderOrder = 1;
  paperMat.depthTest = false;
  paper.renderOrder = 2;
  const paperGroup = new THREE.Group();
  paperGroup.add(paperShadow, paper);
  paperGroup.position.set(0, 0, SLOT_Z);
  machine.add(paperGroup);
  const PAPER_OUT = SLOT_Y + PAPER_H / 2 + 6;
  const PAPER_IN = SLOT_Y - PAPER_H / 2 - 4;
  paperGroup.position.y = PAPER_IN;

  // stamp
  const stampCanvas = document.createElement('canvas');
  stampCanvas.width = 256;
  stampCanvas.height = 160;
  const stampTex = canvasTex(stampCanvas);
  const stampMat = track(new THREE.MeshBasicMaterial({ map: stampTex, transparent: true, depthTest: false }));
  const stamp = new THREE.Mesh(track(new THREE.PlaneGeometry(128, 80)), stampMat);
  stamp.rotation.z = -0.21;
  stamp.visible = false;
  stamp.renderOrder = 3;
  paperGroup.add(stamp);
  function drawStamp(pct: number) {
    const c = stampCanvas.getContext('2d')!;
    c.clearRect(0, 0, 256, 160);
    c.fillStyle = 'rgba(255,253,246,.85)';
    c.strokeStyle = '#e83657';
    c.lineWidth = 9;
    c.beginPath();
    c.roundRect(10, 10, 236, 140, 22);
    c.fill();
    c.stroke();
    c.fillStyle = '#e83657';
    c.textAlign = 'center';
    c.font = `800 30px ${SANS}`;
    c.fillText('SAVED', 128, 62);
    c.font = `800 66px ${SANS}`;
    c.fillText(`${pct}%`, 128, 128);
    stampTex.needsUpdate = true;
  }

  // ---------- state ----------
  type Phase = 'idle' | 'typing' | 'printing' | 'done';
  let phase: Phase = 'idle';
  let printT0 = 0;
  const P = { burst: 0.25, feed: 2.1, stamp: 2.55 }; // seconds after print() starts
  let lastRows = -1;
  let raf = 0;
  let visible = true;
  let firstFrame = true;
  const userPress = new Array(16).fill(0);
  let printPress = 0;
  let flicker = 0;
  const mouse = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };
  const BASE_X = 0.3, BASE_YAW = -0.45;
  const _slotPos = new THREE.Vector3(), _up = new THREE.Vector3();
  const keyPhase = [0, 0.47, 0.22, 0.69, 0.12, 0.56, 0.34, 0.81, 0.26];
  const typingT0 = performance.now();
  const sound = createMachineSound();
  const wasPressed = new Array(16).fill(false);
  let lastStep = -1;
  let stampSounded = false;

  function frame(now: number) {
    raf = 0;
    const tt = (now - typingT0) / 1000;
    const pt = (now - printT0) / 1000;
    // keys
    keys.forEach((k, i) => {
      let press = 0;
      if (phase === 'typing') {
        const ph = ((tt + keyPhase[i % 9] + (i >= 9 ? 0.37 : 0)) % 1.15) / 1.15;
        press = ph > 0.66 && ph < 0.84 ? Math.sin(((ph - 0.66) / 0.18) * Math.PI) : 0;
      } else if (phase === 'printing' && pt < P.burst) {
        press = Math.max(0, Math.sin((pt / P.burst) * Math.PI * 2 + i)) * 0.8;
      }
      userPress[i] = Math.max(0, userPress[i] - 0.09);
      const amount = Math.max(press, userPress[i]);
      // click on the way down (typing taps are quieter than real presses)
      if (amount > 0.6 && !wasPressed[i]) sound.click(userPress[i] > 0.6 ? 1 : 0.35);
      wasPressed[i] = amount > 0.6;
      k.position.y = k.userData.restY - amount * 6;
    });
    printPress = Math.max(0, printPress - 0.08);
    printKey.position.y = printKey.userData.restY - Math.max(phase === 'printing' && pt < P.burst ? 1 : 0, printPress) * 6;

    if (receipt && (phase === 'printing' || phase === 'done')) {
      const t = phase === 'done' ? 99 : pt;
      const cp = THREE.MathUtils.clamp((t - P.burst + 0.2) / 1.1, 0, 1);
      const total = receipt.totalReuse * (1 - Math.pow(1 - cp, 3));
      if (flicker > 0) { flicker -= 1; drawLcd(flicker > 0 ? Math.floor(Math.random() * 999) : total); lcdValue = total; }
      else if (Math.round(total) !== Math.round(lcdValue)) { lcdValue = total; drawLcd(total); }
      const fp = THREE.MathUtils.clamp((t - P.burst) / P.feed, 0, 1);
      const stepIdx = Math.floor(fp * 22);
      const stepped = stepIdx / 22;
      lastStep = stepIdx;
      paperGroup.position.y = THREE.MathUtils.lerp(PAPER_IN, PAPER_OUT, stepped);
      const rows = Math.min(LINES, Math.floor(stepped * (LINES + 1)));
      if (rows !== lastRows) { lastRows = rows; drawPaper(rows); }
      if (t >= P.stamp) {
        stamp.visible = true;
        const sp = THREE.MathUtils.clamp((t - P.stamp) / 0.38, 0, 1);
        stamp.scale.setScalar(2.4 - 1.4 * (1 - Math.pow(1 - sp, 3)));
        stampMat.opacity = Math.min(1, sp * 1.6);
        stamp.position.set(58, 30, 70 - sp * 14);
        if (!stampSounded && phase === 'printing') { stampSounded = true; sound.stamp(); }
        if (sp >= 1 && phase === 'printing') phase = 'done';
      }
    } else if (flicker > 0) {
      flicker -= 1;
      drawLcd(flicker > 0 ? Math.floor(Math.random() * 999) : lcdValue);
    }

    tilt.x += (mouse.y * 0.1 - tilt.x) * 0.08;
    tilt.y += (mouse.x * 0.16 - tilt.y) * 0.08;
    machine.rotation.set(BASE_X + tilt.x, BASE_YAW + tilt.y, 0);
    machine.updateMatrixWorld(true);
    slot.getWorldPosition(_slotPos);
    _up.set(0, 1, 0).applyQuaternion(machine.quaternion);
    clip.setFromNormalAndCoplanarPoint(_up, _slotPos.addScaledVector(_up, 4));
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; opts.onFirstFrame?.(); }

    const settling = Math.abs(mouse.y * 0.1 - tilt.x) + Math.abs(mouse.x * 0.16 - tilt.y) > 0.001;
    const busy = phase === 'typing' || phase === 'printing' || flicker > 0 || printPress > 0 || userPress.some((v) => v > 0);
    if (visible && (busy || settling)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    const a = w / h;
    camera.left = (-VIEW_H * a) / 2;
    camera.right = (VIEW_H * a) / 2;
    camera.top = VIEW_H / 2;
    camera.bottom = -VIEW_H / 2;
    camera.updateProjectionMatrix();
    kick();
  }
  // power light blinks on/off; each blink renders a single frame
  let ledOn = true;
  const blink = window.setInterval(() => {
    ledOn = !ledOn;
    ledMat.color.setHex(ledOn ? 0x3ee0a5 : 0x1c5c47);
    kick();
  }, 650);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function applyTheme() {
    const pal = palette() as any;
    toonMats.forEach((m) => m.color.copy(pal[m.userData.key]));
    outlineMats.forEach((m) => m.uniforms.color.value.copy(pal.ink));
    // dark mode: softer light so the machine sits in the page instead of glowing
    hemi.intensity = isDark() ? 1.2 : 1.15;
    sunLight.intensity = isDark() ? 1.6 : 1.5;
    paperTint = isDark() ? '#efeadf' : '#fffdf6';
    lastRows = -1;
    drawLcd(lcdValue);
    drawLegends();
    drawBrand();
    kick();
  }

  // ---------- interaction: keys press, PRINT and = reprint ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const keyMeshes = keys.map((k) => k.children[1]);
  const printMesh = printKey.children[1];
  function pick(e: PointerEvent | MouseEvent) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...keyMeshes, printMesh], false)[0];
    if (!hit) return null;
    if (hit.object === printMesh) return { print: true as const };
    return { key: keyMeshes.indexOf(hit.object) };
  }
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width - 0.5;
    mouse.y = (e.clientY - r.top) / r.height - 0.5;
    canvas.style.cursor = pick(e) ? 'pointer' : 'default';
    kick();
  };
  const onLeave = () => { mouse.x = mouse.y = 0; kick(); };
  const onClick = (e: MouseEvent) => {
    const h = pick(e);
    if (!h) return;
    if ('print' in h) {
      printPress = 1;
      sound.click(1);
      if (phase === 'done' && receipt) setTimeout(() => api.print(receipt!), 160);
    } else if (h.key >= 0) {
      userPress[h.key] = 1;
      flicker = 6;
      if (LEGENDS[h.key] === '=' && phase === 'done' && receipt) setTimeout(() => api.print(receipt!), 180);
    }
    kick();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  const mo = new MutationObserver(applyTheme);
  mo.observe(root, { attributes: true, attributeFilter: ['class'] });

  drawPaper(0);
  applyTheme();
  resize();

  const api: MachineScene = {
    typing() {
      phase = 'typing';
      kick();
    },
    print(r) {
      receipt = r;
      drawStamp(r.pct);
      phase = 'printing';
      printT0 = performance.now();
      // the feed runs from P.burst for P.feed seconds
      window.setTimeout(() => phase === 'printing' && sound.printRun(P.feed), P.burst * 1000);
      stamp.visible = false;
      stampMat.opacity = 1;
      lcdValue = -1;
      lastRows = -1;
      lastStep = -1;
      stampSounded = false;
      paperGroup.position.y = PAPER_IN;
      kick();
    },
    showPrinted(r) {
      receipt = r;
      stampSounded = true;
      drawStamp(r.pct);
      phase = 'done';
      lastRows = -1;
      lcdValue = -1;
      kick();
    },
    setVisible(v) {
      visible = v;
      if (v) kick();
    },
    refreshTheme: applyTheme,
    setMuted: (m) => sound.setMuted(m),
    isMuted: () => sound.isMuted(),
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      sound.dispose();
      window.clearInterval(blink);
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      legendMats.forEach((m) => m.map?.dispose());
      printLabelMat.map?.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
  return api;
}
