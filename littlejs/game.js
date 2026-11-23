'use strict';
// 60-Second Sweeper - LittleJS 1.29.1 build (screen-space rendering path).
// Fixed brief: portrait 450x800, drag the token, collect gold (+10), avoid red hazards,
// 3 lives, 60 seconds, reach the 200 point target before time runs out.
const W = 450, H = 800;
const TARGET_SCORE = 200;
const GAME_SECONDS = 60;
const PLAYER_R = 22;
const COIN_R = 14;
const HAZARD_R = 16;
const KEY_SPEED = 460;
const DRAG_SPEED = 1500;

let entities = [];
let player = { x: W / 2, y: H - 100 };
let score, lives, timeLeft, elapsed, phase, invulnUntil, coinTimer, hazardTimer;
let targetX = W / 2, targetY = H - 100;
let endReason = '';

const COL = {
  bg: rgb(0.063, 0.063, 0.11),
  player: rgb(0.13, 0.83, 0.93),
  white: rgb(1, 1, 1),
  coin: rgb(0.98, 0.75, 0.14),
  coinCore: rgb(0.96, 0.62, 0.04),
  hazard: rgb(0.94, 0.27, 0.27),
  hazardCore: rgb(0.5, 0.11, 0.11),
  panel: rgb(0.07, 0.09, 0.15, 0.92),
  btn: rgb(0.15, 0.39, 0.92),
  grey: rgb(0.82, 0.84, 0.86)
};

function resetRun() {
  entities = [];
  score = 0; lives = 3; timeLeft = GAME_SECONDS; elapsed = 0;
  phase = 'playing'; invulnUntil = 0; coinTimer = 0; hazardTimer = 0.4;
  player = { x: W / 2, y: H - 100 };
  targetX = W / 2; targetY = H - 100;
}

function spawn(kind) {
  entities.push({ kind, x: 30 + Math.random() * (W - 60), y: -24, r: kind === 'coin' ? COIN_R : HAZARD_R });
}

function endRun(won, reason) {
  phase = won ? 'won' : 'lost';
  endReason = reason;
}

function gameInit() {
  canvasFixedSize = vec2(W, H);
  resetRun();
  window.__sweeper = {
    engine: 'littlejs',
    state: () => ({
      phase, score, lives,
      timeLeft: Math.max(0, Math.ceil(timeLeft)),
      player: { x: Math.round(player.x), y: Math.round(player.y) },
      coins: entities.filter(e => e.kind === 'coin').map(e => ({ x: Math.round(e.x), y: Math.round(e.y) })),
      hazards: entities.filter(e => e.kind === 'hazard').map(e => ({ x: Math.round(e.x), y: Math.round(e.y) }))
    })
  };
}

function gameUpdate() {
  if (phase !== 'playing') {
    // End screen input: restart button or R.
    if (mouseWasPressed(0)) {
      const mx = mousePosScreen.x, my = mousePosScreen.y;
      if (mx > W / 2 - 90 && mx < W / 2 + 90 && my > H / 2 + 34 && my < H / 2 + 86) resetRun();
    }
    if (keyWasPressed('KeyR')) resetRun();
    return;
  }
  const dt = timeDelta;
  elapsed += dt;
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    if (score >= TARGET_SCORE) endRun(true, 'Target reached.');
    else endRun(false, 'Time up.');
    return;
  }
  const ramp = 1 + (elapsed / GAME_SECONDS) * 0.8;
  const fallSpeed = 250 * ramp;

  coinTimer -= dt;
  if (coinTimer <= 0) { spawn('coin'); coinTimer = 0.55 - 0.10 * (elapsed / GAME_SECONDS); }
  hazardTimer -= dt;
  if (hazardTimer <= 0) { spawn('hazard'); hazardTimer = 0.85 - 0.23 * (elapsed / GAME_SECONDS); }

  let kx = 0, ky = 0;
  if (keyIsDown('ArrowLeft')) kx -= 1;
  if (keyIsDown('ArrowRight')) kx += 1;
  if (keyIsDown('ArrowUp')) ky -= 1;
  if (keyIsDown('ArrowDown')) ky += 1;
  if (kx || ky) {
    const len = Math.hypot(kx, ky);
    player.x += (kx / len) * KEY_SPEED * dt;
    player.y += (ky / len) * KEY_SPEED * dt;
    targetX = player.x; targetY = player.y;
  }
  if (mouseIsDown(0)) {
    targetX = mousePosScreen.x; targetY = mousePosScreen.y;
    const dx = targetX - player.x, dy = targetY - player.y;
    const dist = Math.hypot(dx, dy);
    const step = DRAG_SPEED * dt;
    if (dist <= step) { player.x = targetX; player.y = targetY; }
    else { player.x += (dx / dist) * step; player.y += (dy / dist) * step; }
  }
  player.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, player.x));
  player.y = Math.max(PLAYER_R, Math.min(H - PLAYER_R, player.y));

  const invuln = elapsed < invulnUntil;
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    e.y += fallSpeed * dt * (e.kind === 'hazard' ? 1.14 : 1);
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < e.r + PLAYER_R) {
      if (e.kind === 'coin') {
        score += 10;
        entities.splice(i, 1);
      } else if (!invuln) {
        lives -= 1;
        invulnUntil = elapsed + 1.2;
        entities.splice(i, 1);
        if (lives <= 0) { endRun(false, 'Out of lives.'); return; }
      }
      continue;
    }
    if (e.y > H + 30) entities.splice(i, 1);
  }
}

function gameUpdatePost() {}

function gameRender() {
  drawRect(vec2(W / 2, H / 2), vec2(W, H), COL.bg, 0, true, true);
  for (const e of entities) {
    if (e.kind === 'coin') {
      drawCircle(vec2(e.x, e.y), COIN_R * 2, COL.coin, 0, undefined, true, true);
      drawCircle(vec2(e.x, e.y), COIN_R * 0.9, COL.coinCore, 0, undefined, true, true);
    } else {
      drawCircle(vec2(e.x, e.y), HAZARD_R * 2, COL.hazard, 0, undefined, true, true);
      drawCircle(vec2(e.x, e.y), HAZARD_R * 0.9, COL.hazardCore, 0, undefined, true, true);
    }
  }
  const invuln = phase === 'playing' && elapsed < invulnUntil;
  const blink = invuln && Math.floor(elapsed * 12) % 2 === 0;
  const pcol = blink ? rgb(0.13, 0.83, 0.93, 0.3) : COL.player;
  drawCircle(vec2(player.x, player.y), PLAYER_R * 2, pcol, 0, undefined, true, true);
  drawCircle(vec2(player.x, player.y), PLAYER_R * 0.85, blink ? rgb(1, 1, 1, 0.3) : COL.white, 0, undefined, true, true);
}

function gameRenderPost() {
  drawTextScreen('Score ' + score + '/' + TARGET_SCORE, vec2(12, 22), 20, COL.white, 0, undefined, 'left', 'Arial');
  drawTextScreen('Lives ' + lives, vec2(W / 2, 22), 20, COL.white, 0, undefined, 'center', 'Arial');
  drawTextScreen('Time ' + Math.max(0, Math.ceil(timeLeft)), vec2(W - 12, 22), 20, COL.white, 0, undefined, 'right', 'Arial');
  if (phase !== 'playing') {
    drawRect(vec2(W / 2, H / 2), vec2(360, 260), COL.panel, 0, false, true);
    drawTextScreen(phase === 'won' ? 'YOU WIN' : 'GAME OVER', vec2(W / 2, H / 2 - 70), 36, COL.white, 0, undefined, 'center', 'Arial');
    drawTextScreen(endReason + '  Score: ' + score, vec2(W / 2, H / 2 - 12), 20, COL.grey, 0, undefined, 'center', 'Arial');
    drawRect(vec2(W / 2, H / 2 + 60), vec2(180, 52), COL.btn, 0, false, true);
    drawTextScreen('RESTART', vec2(W / 2, H / 2 + 62), 22, COL.white, 0, undefined, 'center', 'Arial');
  }
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
