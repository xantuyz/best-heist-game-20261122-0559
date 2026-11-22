// The table-top gallery: dark felt, pale room floors, stone cover with a hard
// shadow, cyan glass, amber cones that turn coral the moment they catch the
// thief, and the gold prism glowing at the far end. The cones drawn here are
// built from the same clipped polygons the detection uses.
import { CAMERA_CONE_HALF, CAMERA_RANGE, GUARD_CONE_HALF, GUARD_RANGE, conePolygon } from './security-vision.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, polygon, seen) {
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i += 1) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath();
  ctx.fillStyle = seen ? 'rgba(255, 92, 92, 0.30)' : 'rgba(245, 176, 65, 0.20)';
  ctx.fill();
  ctx.strokeStyle = seen ? 'rgba(255, 92, 92, 0.75)' : 'rgba(245, 176, 65, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (seen) {
    // Hatch the caught cone so the danger reads without colour alone.
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 92, 92, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -720; x < 1440; x += 18) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 720, 720);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawEyeMark(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#7ee7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.quadraticCurveTo(0, -9, 11, 0);
  ctx.quadraticCurveTo(0, 9, -11, 0);
  ctx.stroke();
  ctx.fillStyle = '#7ee7ff';
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCutglassGallery(ctx, state) {
  const g = state.gallery;
  const field = g.field;
  // Table and room floors.
  ctx.fillStyle = '#0b0e13';
  ctx.fillRect(0, 0, 1280, 720);
  for (const room of g.rooms) {
    ctx.fillStyle = room.tint;
    ctx.fillRect(room.x, room.y, room.width, room.height);
  }
  // Faint floor grid so movement reads at a glance.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = field.x + 40; x < field.x + field.width; x += 40) {
    ctx.moveTo(x, field.y);
    ctx.lineTo(x, field.y + field.height);
  }
  for (let y = field.y + 40; y < field.y + field.height; y += 40) {
    ctx.moveTo(field.x, y);
    ctx.lineTo(field.x + field.width, y);
  }
  ctx.stroke();

  // Room labels, big and flat.
  ctx.textAlign = 'center';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(214, 226, 240, 0.55)';
  ctx.fillText('SERVICE DOCK', 200, 168);
  ctx.fillText('GLASS HALL', 520, 168);
  ctx.fillText('PRISM VAULT', 838, 168);

  // Exit: a mint pad with chevrons, pulsing once the prism is carried.
  const exit = g.exit;
  const pulse = state.thief.hasPrism ? 0.55 + 0.35 * Math.sin(state.time * 5) : 0.4;
  ctx.save();
  ctx.fillStyle = `rgba(64, 224, 160, ${0.14 + pulse * 0.12})`;
  ctx.strokeStyle = `rgba(64, 224, 160, ${0.5 + pulse * 0.4})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, exit.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(64, 224, 160, ${0.7 + pulse * 0.3})`;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('EXIT', exit.x, exit.y - 24);
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('SERVICE DOCK', exit.x, exit.y + 62);
  ctx.restore();

  // Glass first (under the cones): cyan panes with a metal seam and an eye.
  for (const pane of g.glass) {
    ctx.fillStyle = 'rgba(126, 231, 255, 0.16)';
    ctx.fillRect(pane.x, pane.y, pane.width, pane.height);
    ctx.strokeStyle = 'rgba(126, 231, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pane.x + 0.5, pane.y + 0.5, pane.width - 1, pane.height - 1);
    const cx = pane.x + pane.width / 2;
    const cy = pane.y + pane.height / 2;
    drawEyeMark(ctx, pane.width > pane.height ? cx : cx, pane.width > pane.height ? cy - 26 : cy);
  }
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = '#7ee7ff';
  ctx.fillText('GLASS DOES NOT HIDE YOU', 520, 448);
  ctx.fillText('GLASS DOES NOT HIDE YOU', 810, 288);

  // Vision cones, clipped by the same solids the detection uses.
  for (const guard of state.guards) {
    const seen = state.seenBy && state.seenBy.kind === 'guard' && state.seenBy.id === guard.id;
    drawCone(ctx, conePolygon({ x: guard.x, y: guard.y, angle: guard.angle }, GUARD_CONE_HALF, GUARD_RANGE, state.solids), seen);
  }
  for (const camera of state.cameras) {
    const looped = state.time < camera.loopedUntil;
    if (looped) continue;
    const seen = state.seenBy && state.seenBy.kind === 'camera' && state.seenBy.id === camera.id;
    drawCone(ctx, conePolygon({ x: camera.x, y: camera.y, angle: camera.angle }, CAMERA_CONE_HALF, CAMERA_RANGE, state.solids), seen);
  }

  // Solid cover: dull blue stone, opaque, with a hard offset shadow.
  for (const cover of g.covers) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(cover.x + 5, cover.y + 6, cover.width, cover.height);
    ctx.fillStyle = '#5d6b7d';
    roundRect(ctx, cover.x, cover.y, cover.width, cover.height, 6);
    ctx.fill();
    ctx.strokeStyle = '#8b9bb0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(230, 238, 246, 0.75)';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.fillText('SOLID COVER', cover.x + cover.width / 2, cover.y + cover.height / 2 + 3);
  }

  // Walls: dark slate with a pale front edge, like a model on a table.
  for (const wall of g.walls) {
    ctx.fillStyle = '#2b3442';
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.fillStyle = '#46536a';
    if (wall.height <= 12) ctx.fillRect(wall.x, wall.y + wall.height - 3, wall.width, 3);
    else ctx.fillRect(wall.x + wall.width - 3, wall.y, 3, wall.height);
  }

  // The prism: a gold diamond with a halo, brighter the longer it waits.
  if (!state.prismTaken) {
    const p = g.prism;
    const glow = 0.5 + 0.3 * Math.sin(state.time * 2.4);
    const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 64);
    grad.addColorStop(0, `rgba(255, 214, 110, ${0.5 * glow + 0.25})`);
    grad.addColorStop(1, 'rgba(255, 214, 110, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd66e';
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 2;
    const s = 17 + 2 * Math.sin(state.time * 2.4);
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();
    ctx.fillStyle = '#3a2c00';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd66e';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#3a2c00';
    ctx.font = '700 12px system-ui, sans-serif';
    const label = 'HEART PRISM · $600';
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(8, 10, 14, 0.78)';
    roundRect(ctx, p.x - labelW / 2 - 8, p.y - 56, labelW + 16, 20, 5);
    ctx.fill();
    ctx.fillStyle = '#ffd66e';
    ctx.fillText(label, p.x, p.y - 42);
    // Pedestal ring.
    ctx.strokeStyle = 'rgba(255, 214, 110, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Smoke clouds.
  for (const smoke of state.smokes) {
    if (state.time >= smoke.until) continue;
    const left = smoke.until - state.time;
    const alpha = Math.min(0.75, left);
    const grad = ctx.createRadialGradient(smoke.x, smoke.y, 8, smoke.x, smoke.y, smoke.radius);
    grad.addColorStop(0, `rgba(190, 200, 210, ${alpha})`);
    grad.addColorStop(1, 'rgba(190, 200, 210, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(220, 228, 236, ${alpha})`;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cameras: wall mounts with a sweeping eye and a small arc showing the next turn.
  for (const camera of state.cameras) {
    const looped = state.time < camera.loopedUntil;
    ctx.fillStyle = looped ? '#3a4a5a' : '#e8b23a';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b0e13';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = looped ? 'rgba(140,160,180,0.8)' : '#e8b23a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + Math.cos(camera.angle) * 22, camera.y + Math.sin(camera.angle) * 22);
    ctx.stroke();
    ctx.fillStyle = looped ? '#8fa2b5' : '#e8b23a';
    ctx.font = '700 11px system-ui, sans-serif';
    // Near the right wall the label would run under the side panel: put it
    // on the camera's left instead.
    if (camera.x > 900) {
      ctx.textAlign = 'right';
      ctx.fillText(looped ? `${camera.id} · LOOPED` : camera.id, camera.x - 12, camera.y - 10);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(looped ? `${camera.id} · LOOPED` : camera.id, camera.x + 12, camera.y - 10);
    }
    ctx.textAlign = 'center';
  }

  // Guards: coral bodies, a lamp showing where they look, a pale face tick.
  for (const guard of state.guards) {
    const seen = state.seenBy && state.seenBy.kind === 'guard' && state.seenBy.id === guard.id;
    ctx.fillStyle = seen ? '#ff5c5c' : '#e2604d';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a0f0f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (guard.waiting > 0) {
      ctx.fillStyle = 'rgba(255, 233, 168, 0.9)';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.fillText('…', guard.x, guard.y - 20);
    }
  }

  // The thief: a pale blue silhouette with a cyan scarf and a facing tick.
  const t = state.thief;
  if (state.seenBy) {
    // A thin line from the watcher that has the thief, so the danger is named.
    ctx.strokeStyle = 'rgba(255, 92, 92, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(state.seenBy.x, state.seenBy.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Detection ring filling with the alarm.
    ctx.strokeStyle = 'rgba(255, 92, 92, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 22, -Math.PI / 2, -Math.PI / 2 + (state.alarm / 100) * Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#dfe9f5';
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b2a3a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#35d0e0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius - 3, t.facing - 0.9, t.facing + 0.9);
  ctx.stroke();
  ctx.fillStyle = '#35d0e0';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.facing) * 10, t.y + Math.sin(t.facing) * 10, 3, 0, Math.PI * 2);
  ctx.fill();
  if (t.hasPrism) {
    ctx.save();
    ctx.translate(t.x, t.y - 22);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd66e';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
  // Sneak hint: a faint ring while moving quietly.
  if (t.sneaking && t.moving) {
    ctx.strokeStyle = 'rgba(53, 208, 224, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hold-to-interact ring over the current target.
  if (state.interactTarget && state.interactProgress > 0) {
    const target = state.interactTarget === 'prism' ? g.prism : g.exit;
    ctx.strokeStyle = '#ffd66e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 34, -Math.PI / 2, -Math.PI / 2 + state.interactProgress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd66e';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('HOLD E…', target.x, target.y - 40);
  }
}
