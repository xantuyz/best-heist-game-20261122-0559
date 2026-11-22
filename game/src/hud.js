// The right-hand panel and the frame around it: the alarm meter, the tool
// budget with its prices, the loot and the way out, plus the one-line control
// strip at the bottom. Short English, large enough to read at half size.
import { LOOP_PRICE, SMOKE_PRICE, toolRemaining } from './paid-tools.js';

export function drawHeistStatusAndToolCosts(ctx, state) {
  // Header.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8eef5';
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText('CUTGLASS', 40, 52);
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('STEAL THE HEART PRISM. RETURN TO THE DOCK.', 40, 80);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd66e';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('HEIST · ONE FRAME · NO SCROLL', 1256, 52);
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('READ THE PATROLS BEFORE YOU MOVE', 1256, 80);
  ctx.textAlign = 'left';

  // Right panel.
  const px = 1020;
  const pw = 236;
  ctx.fillStyle = '#11161d';
  ctx.fillRect(px, 126, pw, 528);
  ctx.strokeStyle = '#2b3442';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px + 0.5, 126.5, pw - 1, 527);
  let y = 126 + 28;

  // Alarm.
  ctx.fillStyle = '#e8eef5';
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.fillText(`ALARM ${Math.round(state.alarm)} / 100`, px + 16, y);
  y += 14;
  const barW = pw - 32;
  ctx.fillStyle = '#232c38';
  ctx.fillRect(px + 16, y, barW, 18);
  const frac = state.alarm / 100;
  ctx.fillStyle = frac < 0.5 ? '#f5b041' : frac < 0.8 ? '#f07f3c' : '#ff5c5c';
  ctx.fillRect(px + 16, y, Math.max(0, barW * frac), 18);
  ctx.strokeStyle = '#46536a';
  ctx.strokeRect(px + 16.5, y + 0.5, barW - 1, 17);
  y += 34;
  ctx.fillStyle = state.seenBy ? '#ff8a8a' : '#8fa2b5';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText(state.seenBy ? 'SEEN — BREAK LINE OF SIGHT' : 'UNSEEN — STAY IN COVER', px + 16, y);
  y += 34;

  // Budget and tools.
  ctx.fillStyle = '#e8eef5';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.fillText(`TOOL BUDGET $${toolRemaining(state)}`, px + 16, y);
  y += 8;
  ctx.strokeStyle = '#2b3442';
  ctx.beginPath();
  ctx.moveTo(px + 16, y);
  ctx.lineTo(px + pw - 16, y);
  ctx.stroke();
  y += 26;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = state.selectedTool === 1 ? '#35d0e0' : '#c7d2de';
  ctx.fillText('1  SMOKE — $35', px + 16, y);
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('blocks sight · 3s · max 2', px + 16, y + 16);
  y += 46;
  ctx.fillStyle = state.selectedTool === 2 ? '#35d0e0' : '#c7d2de';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('2  CAMERA LOOP — $45', px + 16, y);
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('one CCTV blind · 5s', px + 16, y + 16);
  y += 46;
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(`SPENT $${state.spent} OF $${state.budget}`, px + 16, y);
  y += 34;

  // Loot and exit.
  ctx.fillStyle = '#e8eef5';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.fillText('LOOT: HEART PRISM', px + 16, y);
  y += 24;
  ctx.fillStyle = state.prismTaken ? '#40e0a0' : '#ffd66e';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(state.prismTaken ? 'HEART PRISM SECURED' : 'VALUE $600', px + 16, y);
  y += 30;
  ctx.fillStyle = '#c7d2de';
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText('EXIT: SERVICE DOCK', px + 16, y);
  y += 22;
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(
    state.phase === 'escaped' ? `escaped — take $${state.take}` : state.prismTaken ? 'carry it home — hold E at the dock' : 'take the prism first',
    px + 16, y,
  );
  y += 40;

  // Achievements for this run.
  ctx.fillStyle = '#e8eef5';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText('TAKE-HOME', px + 16, y);
  y += 22;
  ctx.font = '600 13px system-ui, sans-serif';
  const marks = [
    ['Escaped', state.achievements.escaped],
    ['No tools', state.achievements.noTools && state.phase === 'escaped'],
    ['Alarm below 50', state.achievements.alarmBelow50 && state.phase === 'escaped'],
  ];
  for (const [label, done] of marks) {
    ctx.fillStyle = done ? '#40e0a0' : '#5d6b7d';
    ctx.fillText(`${done ? '✓' : '·'}  ${label}`, px + 16, y);
    y += 20;
  }

  // Live message line.
  if (state.message && state.time < state.messageUntil) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd66e';
    ctx.font = '800 16px system-ui, sans-serif';
    ctx.fillText(state.message, 520, 116);
    ctx.textAlign = 'left';
  }

  // Bottom control strip.
  ctx.fillStyle = '#8fa2b5';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD MOVE · SHIFT SNEAK · 1/2 SELECT TOOL · CLICK USE · HOLD E INTERACT · M MUTE', 520, 692);
  ctx.textAlign = 'left';

  // End banners: caught or escaped, drawn over the playfield, map still visible.
  if (state.phase === 'caught') {
    drawBanner(ctx, 'LOCKDOWN — CAUGHT BY ' + state.caughtBy, 'Press R to run it back', '#ff5c5c');
  } else if (state.phase === 'escaped') {
    drawBanner(
      ctx,
      `ESCAPED · PRISM $600 − TOOLS $${state.spent} = TAKE $${state.take}`,
      'Press R to run it back',
      '#40e0a0',
    );
  }
}

function drawBanner(ctx, line1, line2, color) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.88)';
  ctx.fillRect(240, 300, 560, 96);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(240.5, 300.5, 559, 95);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText(line1, 520, 338);
  ctx.fillStyle = '#e8eef5';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(line2, 520, 368);
  ctx.textAlign = 'left';
}
