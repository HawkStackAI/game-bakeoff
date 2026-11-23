'use strict';
// 60-Second Sweeper - PixiJS 8.22.0 build.
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

(async () => {
  const app = new PIXI.Application();
  await app.init({ width: W, height: H, background: 0x10101c, antialias: true });
  document.body.appendChild(app.canvas);

  function circleSprite(r, outer, inner) {
    const g = new PIXI.Graphics();
    g.circle(0, 0, r); g.fill(outer);
    g.circle(0, 0, Math.round(r * 0.45)); g.fill(inner);
    return g;
  }
  const textStyle = { fontFamily: 'Arial, sans-serif', fontSize: 20, fill: 0xffffff };

  const player = circleSprite(PLAYER_R, 0x22d3ee, 0xffffff);
  app.stage.addChild(player);

  const scoreText = new PIXI.Text({ text: '', style: textStyle }); scoreText.position.set(12, 10);
  const livesText = new PIXI.Text({ text: '', style: textStyle }); livesText.anchor.set(0.5, 0); livesText.position.set(W / 2, 10);
  const timeText = new PIXI.Text({ text: '', style: textStyle }); timeText.anchor.set(1, 0); timeText.position.set(W - 12, 10);
  app.stage.addChild(scoreText, livesText, timeText);

  // End overlay.
  const overlay = new PIXI.Container(); overlay.visible = false; overlay.zIndex = 10;
  const panel = new PIXI.Graphics();
  panel.roundRect(W / 2 - 180, H / 2 - 130, 360, 260, 12); panel.fill({ color: 0x111827, alpha: 0.92 });
  const endTitle = new PIXI.Text({ text: '', style: { fontFamily: 'Arial', fontSize: 36, fill: 0xffffff } });
  endTitle.anchor.set(0.5); endTitle.position.set(W / 2, H / 2 - 80);
  const endDetail = new PIXI.Text({ text: '', style: { fontFamily: 'Arial', fontSize: 20, fill: 0xd1d5db } });
  endDetail.anchor.set(0.5); endDetail.position.set(W / 2, H / 2 - 20);
  const btn = new PIXI.Graphics();
  btn.roundRect(W / 2 - 90, H / 2 + 34, 180, 52, 8); btn.fill(0x2563eb);
  btn.eventMode = 'static'; btn.cursor = 'pointer';
  const btnText = new PIXI.Text({ text: 'RESTART', style: { fontFamily: 'Arial', fontSize: 22, fill: 0xffffff } });
  btnText.anchor.set(0.5); btnText.position.set(W / 2, H / 2 + 60);
  overlay.addChild(panel, endTitle, endDetail, btn, btnText);
  app.stage.addChild(overlay);
  app.stage.sortableChildren = true;

  // Game state (identical rules to the other builds).
  let entities = [];
  let score, lives, timeLeft, elapsed, phase, invulnUntil, coinTimer, hazardTimer, shakeUntil;
  let dragging = false, targetX = W / 2, targetY = H - 100;
  const keys = {};
  let shakeT = 0;

  function updateHud() {
    scoreText.text = 'Score ' + score + '/' + TARGET_SCORE;
    livesText.text = 'Lives ' + lives;
    timeText.text = 'Time ' + Math.max(0, Math.ceil(timeLeft));
  }

  function resetRun() {
    for (const e of entities) { app.stage.removeChild(e.sprite); e.sprite.destroy(); }
    entities = [];
    score = 0; lives = 3; timeLeft = GAME_SECONDS; elapsed = 0;
    phase = 'playing'; invulnUntil = 0; coinTimer = 0; hazardTimer = 0.4; shakeT = 0;
    player.position.set(W / 2, H - 100); player.alpha = 1;
    targetX = W / 2; targetY = H - 100;
    overlay.visible = false;
    updateHud();
  }

  function spawn(kind) {
    const x = 30 + Math.random() * (W - 60);
    const sprite = kind === 'coin' ? circleSprite(COIN_R, 0xfbbf24, 0xf59e0b) : circleSprite(HAZARD_R, 0xef4444, 0x7f1d1d);
    sprite.position.set(x, -24);
    app.stage.addChild(sprite);
    entities.push({ kind, sprite, r: kind === 'coin' ? COIN_R : HAZARD_R });
  }

  function endRun(won, reason) {
    phase = won ? 'won' : 'lost';
    endTitle.text = won ? 'YOU WIN' : 'GAME OVER';
    endDetail.text = reason + '  Score: ' + score;
    overlay.visible = true;
    updateHud();
  }

  btn.on('pointerdown', () => resetRun());

  // Input: pointer drag on the canvas, arrows on the keyboard.
  const toGame = (ev) => {
    const rect = app.canvas.getBoundingClientRect();
    return { x: (ev.clientX - rect.left) / rect.width * W, y: (ev.clientY - rect.top) / rect.height * H };
  };
  app.canvas.addEventListener('pointerdown', (ev) => { dragging = true; const p = toGame(ev); targetX = p.x; targetY = p.y; });
  app.canvas.addEventListener('pointermove', (ev) => { if (dragging) { const p = toGame(ev); targetX = p.x; targetY = p.y; } });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('keydown', (ev) => {
    keys[ev.code] = true;
    if (ev.code === 'KeyR' && phase !== 'playing') resetRun();
  });
  window.addEventListener('keyup', (ev) => { keys[ev.code] = false; });

  window.__sweeper = {
    engine: 'pixijs',
    state: () => ({
      phase, score, lives,
      timeLeft: Math.max(0, Math.ceil(timeLeft)),
      player: { x: Math.round(player.x), y: Math.round(player.y) },
      coins: entities.filter(e => e.kind === 'coin').map(e => ({ x: Math.round(e.sprite.x), y: Math.round(e.sprite.y) })),
      hazards: entities.filter(e => e.kind === 'hazard').map(e => ({ x: Math.round(e.sprite.x), y: Math.round(e.sprite.y) }))
    })
  };

  resetRun();

  app.ticker.add((ticker) => {
    if (phase !== 'playing') return;
    const dt = Math.min(ticker.deltaMS, 50) / 1000;
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
    if (keys['ArrowLeft']) kx -= 1;
    if (keys['ArrowRight']) kx += 1;
    if (keys['ArrowUp']) ky -= 1;
    if (keys['ArrowDown']) ky += 1;
    if (kx || ky) {
      const len = Math.hypot(kx, ky);
      player.x += (kx / len) * KEY_SPEED * dt;
      player.y += (ky / len) * KEY_SPEED * dt;
      targetX = player.x; targetY = player.y;
    }
    if (dragging) {
      const dx = targetX - player.x, dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);
      const step = DRAG_SPEED * dt;
      if (dist <= step) { player.x = targetX; player.y = targetY; }
      else { player.x += (dx / dist) * step; player.y += (dy / dist) * step; }
    }
    player.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, player.x));
    player.y = Math.max(PLAYER_R, Math.min(H - PLAYER_R, player.y));

    const invuln = elapsed < invulnUntil;
    player.alpha = invuln ? (Math.floor(elapsed * 12) % 2 ? 0.3 : 0.8) : 1;

    if (shakeT > 0) {
      shakeT -= dt;
      app.stage.x = (Math.random() - 0.5) * 10;
      app.stage.y = (Math.random() - 0.5) * 10;
      if (shakeT <= 0) { app.stage.x = 0; app.stage.y = 0; }
    }

    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      e.sprite.y += fallSpeed * dt * (e.kind === 'hazard' ? 1.14 : 1);
      const d = Math.hypot(e.sprite.x - player.x, e.sprite.y - player.y);
      if (d < e.r + PLAYER_R) {
        if (e.kind === 'coin') {
          score += 10;
          app.stage.removeChild(e.sprite); e.sprite.destroy(); entities.splice(i, 1);
        } else if (!invuln) {
          lives -= 1;
          invulnUntil = elapsed + 1.2;
          shakeT = 0.12;
          app.stage.removeChild(e.sprite); e.sprite.destroy(); entities.splice(i, 1);
          if (lives <= 0) { updateHud(); endRun(false, 'Out of lives.'); return; }
        }
        continue;
      }
      if (e.sprite.y > H + 30) { app.stage.removeChild(e.sprite); e.sprite.destroy(); entities.splice(i, 1); }
    }
    updateHud();
  });
})();
