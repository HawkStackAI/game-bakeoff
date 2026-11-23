# Game Engine Bake-Off, Wave 1: Results

Run: Tue Nov 10, 2026. 
Frame: the game factory is the platform, engines are suppliers bidding for the web prototype track. Native Swift is not up for bid; it owns the App Store channel. Results decide, not essays.

## The fixed brief (identical for all three)

"60-Second Sweeper." Portrait 450x800 stage (9:16). The player drags a token (pointer drag, plus arrow keys). Gold collectibles fall and add 10 points each. Red hazards fall faster and cost one life on contact, three lives total, with a short invulnerability window after each hit. A 60-second timer runs the round. Reaching the 200 point target by the buzzer wins; running out of lives or missing the target loses. Score, lives, and timer stay on screen. End screen offers a restart button. Difficulty ramps across the minute. The deliverable is one static folder (index.html, game.js, one vendored engine file) that runs by opening it, no server and no build step at play time.

Every build uses the same constants, the same spawn rates, the same fall speeds, the same collision math, and the same scoring. Only the engine API differs.

## Security screen (before anything ran)

| Repo | Pinned version | Source | License | Runtime behavior |
|---|---|---|---|---|
| phaserjs/phaser | 3.90.0 | npm tarball, dist file extracted only, no install scripts run | MIT | Self-contained library, no network calls, no credentials |
| pixijs/pixijs | 8.22.0 | npm tarball, dist file extracted only, no install scripts run | MIT | Self-contained library, no network calls, no credentials |
| KilledByAPixel/LittleJS | 1.29.1 | npm package littlejsengine, dist file extracted only | MIT | Self-contained single file, no network calls, no credentials |

All work stayed inside a local working folder. Nothing was published, posted, or deployed anywhere public. Phaser note: npm's latest Phaser line is 4.2.1; I pinned 3.90.0, the mature and widely deployed line, because a weeks-old major version measures my relearning instead of the engine. That choice is recorded here so it can be challenged with evidence later.

## How playability was verified

Each bundle was driven in a real Chromium (headless, software WebGL) by an automated player that: loaded the page and checked for console and page errors; measured frame rate over 3 seconds; grabbed the token with the mouse and dragged it across the field; chased falling collectibles until the score moved; chased a hazard until a life was lost; and confirmed the timer counts down. All three builds also passed a separate open-from-disk check (file:// protocol, zero errors), which is the literal "runs by opening it" test. Screenshots from the verification runs are not included in this repository.

One honest gap: the win branch (target reached at the buzzer) and the restart button click were verified by reading the code, not by machine play. The out-of-lives end state was reached live in the PixiJS run when the automated player steered into hazards. The time-up branch shares the same code path family in all three builds.

## Scores

Times are engine-specific build effort, measured from work timestamps: start of that candidate's implementation to a passed automated playtest. Shared overhead is reported separately below and charged to no candidate. Builds ran sequentially in the order Phaser, PixiJS, LittleJS, so the later builds inherited the fixed game design; that transfer is real and it is also how the factory would reuse a brief, so the times stand as measured with the caveat attached.

| Measure | Phaser 3.90.0 | PixiJS 8.22.0 | LittleJS 1.29.1 |
|---|---|---|---|
| Time to playable | about 5 min (306 s) | about 1 min (51 s) | about 1 min (65 s) |
| Feel (1 to 5) | 5 | 4 | 3 |
| Frame rate, software rendering (floor, not a device number) | 45 fps | 26 fps | 25 fps |
| Bundle size, raw folder total | 1,204,707 bytes (about 1,177 KB) | 849,152 bytes (about 829 KB) | 522,226 bytes (about 510 KB) |
| Bundle size, as served with gzip | about 325 KB | about 246 KB | about 165 KB |
| Export path | Static folder, opens from disk, wraps in a web view shell | Same | Same |
| License | MIT | MIT | MIT |
| Upstream commits, last 90 days (default branch) | 3 | 103 | 989 |
| Upstream last push | Aug 21, 2026 | Nov 10, 2026 (today) | Nov 2, 2026 |
| Console or page errors in playtest | none | none | none |
| Drag, collect, hazard, timer tests | all pass | all pass | all pass |

## Feel notes (structured judgment)

- Phaser, 5: the complete package. Built-in stage scaling fit the portrait field exactly, procedural textures were crisp, camera shake on hazard hits came free, and it posted the highest frame rate under identical software rendering. Input chase felt tight. This is what a full framework buys.
- PixiJS, 4: same tight drag and play (the movement math is identical), antialiased shapes look clea
...[truncated 6151 chars]