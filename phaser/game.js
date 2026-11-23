'use strict';
// 60-Second Sweeper - Phaser 3.90.0 build.
// Fixed brief: portrait 450x800, drag the token, collect gold (+10), avoid red hazards,
// 3 lives, 60 seconds, reach the 200 point target before time runs out.
const W = 450, H = 800;
const TARGET_SCORE = 200;
const GAME_SECONDS = 60;
const PLAYER_R = 22;
const COIN_R = 14;
const HAZARD_R = 16;
const KEY_SPEED = 460;      // px per second with arrow keys
const DRAG_SPEED = 1500;    // max px per second chasing the pointer

class SweeperScene extends Phaser.Scene {
  constructor() { super('sweeper'); }

  create() {
    // Procedural textures, no external assets.
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x22d3ee, 1); g.fillCircle(PLAYER_R, PLAYER_R, PLAYER_R);
    g.fillStyle(0xffffff, 1); g.fillCircle(PLAYER_R, PLAYER_R, 9);
    g.generateTexture('player', PLAYER_R * 2, PLAYER_R * 2); g.clear();
    g.fillStyle(0xfbbf24, 1); g.fillCircle(COIN_R, COIN_R, COIN_R);
    g.fillStyle(0xf59e0b, 1); g.fillCircle(COIN_R, COIN_R, 8);
    g.generateTexture('coin', COIN_R * 2, COIN_R * 2); g.clear();
    g.fillStyle(0xef4444, 1); g.fillCircle(HAZARD_R, HAZARD_R, HAZARD_R);
    g.fillStyle(0x7f1d1d, 1); g.fillCircle(HAZARD_R, HAZARD_R, 7);
    g.generateTexture('hazard', HAZARD_R * 2, HAZARD_R * 2); g.destroy();

    this.player = this.add.image(W / 2, H - 100, 'player');
    this.entities = [];
    this.cursors = this.input.keyboard.createCursorKeys();

    // Input: drag target follows the pointer while it is down.
    this.dragging = false;
    this.targetX = W / 2; this.targetY = H - 100;
    this.input.on('pointerdown', (p) => { this.dragging = true; this.targetX = p.x; this.targetY = p.y; });
    this.input.on('pointermove', (p) => { if (this.dragging) { this.targetX = p.x; this.targetY = p.y; } });
    this.input.on('pointerup', () => { this.dragging = false; });

    // HUD
    const style = { fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#ffffff' };
    this.scoreText = this.add.text(12, 10, '', style);
    this.livesText = this.add.text(W / 2, 10, '', style).setOrigin(0.5, 0);
    this.timeText = this.add.text(W - 12, 10, '', style).setOrigin(1, 0);

    // End overlay (hidden until the run ends)
    this.overlay = this.add.container(0, 0).setDepth(10).setVisible(false);
    const panel = this.add.rectangle(W / 2, H / 2, 360, 260, 0x111827, 0.92);
    this.endTitle = this.add.text(W / 2, H / 2 - 80, '', { fontFamily: 'Arial', fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);
    this.endDetail = this.add.text(W / 2, H / 2 - 20, '', { fontFamily: 'Arial', fontSize: '20px', color: '#d1d5db' }).setOrigin(0.5);
    const btn = this.add.rectangle(W / 2, H / 2 + 60, 180, 52, 0x2563eb, 1).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(W / 2, H / 2 + 60, 'RESTART', { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.resetRun());
    this.overlay.add([panel, this.endTitle, this.endDetail, btn, btnText]);
    this.input.keyboard.on('keydown-R', () => { if (this.phase !== 'playing') this.resetRun(); });

    this.resetRun();

    // Diagnostic hook for automated playtests (read-only state).
    window.__sweeper = {
      engine: 'phaser',
      state: () => ({
        phase: this.phase,
        score: this.score,
        lives: this.lives,
        timeLeft: Math.max(0, Math.ceil(this.timeLeft)),
        player: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
        coins: this.entities.filter(e => e.kind === 'coin').map(e => ({ x: Math.round(e.sprite.x), y: Math.round(e.sprite.y) })),
        hazards: this.entities.filter(e => e.kind === 'hazard').map(e => ({ x: Math.round(e.sprite.x), y: Math.round(e.sprite.y) }))
      })
    };
  }

  resetRun() {
    for (const e of this.entities) e.sprite.destroy();
    this.entities = [];
    this.score = 0;
    this.lives = 3;
    this.timeLeft = GAME_SECONDS;
    this.elapsed = 0;
    this.phase = 'playing';
    this.invulnUntil = 0;
    this.coinTimer = 0;
    this.hazardTimer = 0.4;
    this.player.setPosition(W / 2, H - 100);
    this.player.setAlpha(1);
    this.targetX = W / 2; this.targetY = H - 100;
    this.overlay.setVisible(false);
    this.updateHud();
  }

  updateHud() {
    this.scoreText.setText('Score ' + this.score + '/' + TARGET_SCORE);
    this.livesText.setText('Lives ' + this.lives);
    this.timeText.setText('Time ' + Math.max(0, Math.ceil(this.timeLeft)));
  }

  spawn(kind) {
    const x = 30 + Math.random() * (W - 60);
    const sprite = this.add.image(x, -24, kind);
    this.entities.push({ kind, sprite, r: kind === 'coin' ? COIN_R : HAZARD_R });
  }

  endRun(won, reason) {
    this.phase = won ? 'won' : 'lost';
    this.endTitle.setText(won ? 'YOU WIN' : 'GAME OVER');
    this.endDetail.setText(reason + '  Score: ' + this.score);
    this.overlay.setVisible(true);
    this.updateHud();
  }

  update(time, deltaMs) {
    if (this.phase !== 'playing') return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.elapsed += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      if (this.score >= TARGET_SCORE) this.endRun(true, 'Target reached.');
      else this.endRun(false, 'Time up.');
      return;
    }

    // Difficulty ramp across the minute.
    const ramp = 1 + (this.elapsed / GAME_SECONDS) * 0.8;
    const fallSpeed = 250 * ramp;

    // Spawning.
    this.coinTimer -= dt;
    if (this.coinTimer <= 0) { this.spawn('coin'); this.coinTimer = 0.55 - 0.10 * (this.elapsed / GAME_SECONDS); }
    this.hazardTimer -= dt;
    if (this.hazardTimer <= 0) { this.spawn('hazard'); this.hazardTimer = 0.85 - 0.23 * (this.elapsed / GAME_SECONDS); }

    // Player movement: arrows.
    let kx = 0, ky = 0;
    if (this.cursors.left.isDown) kx -= 1;
    if (this.cursors.right.isDown) kx += 1;
    if (this.cursors.up.isDown) ky -= 1;
    if (this.cursors.down.isDown) ky += 1;
    if (kx || ky) {
      const len = Math.hypot(kx, ky);
      this.player.x += (kx / len) * KEY_SPEED * dt;
      this.player.y += (ky / len) * KEY_SPEED * dt;
      this.targetX = this.player.x; this.targetY = this.player.y;
    }
    // Player movement: drag chase.
    if (this.dragging) {
      const dx = this.targetX - this.player.x;
      const dy = this.targetY - this.player.y;
      const dist = Math.hypot(dx, dy);
      const step = DRAG_SPEED * dt;
      if (dist <= step) { this.player.x = this.targetX; this.player.y = this.targetY; }
      else { this.player.x += (dx / dist) * step; this.player.y += (dy / dist) * step; }
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, PLAYER_R, W - PLAYER_R);
    this.player.y = Phaser.Math.Clamp(this.player.y, PLAYER_R, H - PLAYER_R);

    // Invulnerability blink.
    const invuln = this.elapsed < this.invulnUntil;
    this.player.setAlpha(invuln ? (Math.floor(this.elapsed * 12) % 2 ? 0.3 : 0.8) : 1);

    // Entities fall, collide, despawn.
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.sprite.y += fallSpeed * dt * (e.kind === 'hazard' ? 1.14 : 1);
      const d = Math.hypot(e.sprite.x - this.player.x, e.sprite.y - this.player.y);
      if (d < e.r + PLAYER_R) {
        if (e.kind === 'coin') {
          this.score += 10;
          e.sprite.destroy(); this.entities.splice(i, 1);
        } else if (!invuln) {
          this.lives -= 1;
          this.invulnUntil = this.elapsed + 1.2;
          this.cameras.main.shake(120, 0.008);
          e.sprite.destroy(); this.entities.splice(i, 1);
          if (this.lives <= 0) { this.updateHud(); this.endRun(false, 'Out of lives.'); return; }
        }
        continue;
      }
      if (e.sprite.y > H + 30) { e.sprite.destroy(); this.entities.splice(i, 1); }
    }
    this.updateHud();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#10101c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: SweeperScene
});
