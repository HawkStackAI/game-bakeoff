# 60-Second Sweeper: A Three-Engine Bake-Off

One small game, built three times, in three different web game engines, from one identical brief. This repo is the complete output of a game engine bake-off run by the HawkStack App Factory to pick its standing web prototype engine.

Maintained by HawkStack AI.

## The game

"60-Second Sweeper." A portrait 450x800 stage (9:16). Drag the token with a pointer, or steer with the arrow keys. Gold collectibles fall and add 10 points each. Red hazards fall faster and cost one life on contact; you have three lives, with a short invulnerability window after each hit. Reach 200 points before the 60-second timer runs out to win. Score, lives, and timer stay on screen, and the end screen offers a restart.

Every build uses the same constants, the same spawn rates, the same fall speeds, the same collision math, and the same scoring. Only the engine API differs. That is the point: the game is the control, the engine is the variable.

## Play it

No server, no build step, no install. Open any build's `index.html` in a browser and it runs, including straight from disk.

- `pixijs/index.html`
- `phaser/index.html`
- `littlejs/index.html`

Each folder is self-contained: `index.html`, our `game.js`, and one vendored engine file.

## The builds

| Folder | Engine | Version | Role after the bake-off |
|---|---|---|---|
| `pixijs/` | PixiJS | 8.22.0 | Winner. Adopted as the standing web prototype track. |
| `phaser/` | Phaser | 3.90.0 | Best feel and frame rate, slowest to build. Kept as the reference implementation. |
| `littlejs/` | LittleJS | 1.29.1 | Smallest bundle. Designated fallback. |

## Results

Full scoring, method, feel notes, and the honest caveats are in [RESULTS.md](RESULTS.md). Short version: PixiJS reached playable fastest (about 51 seconds of build effort against Phaser's 306), with a 246 KB gzipped bundle and an active upstream. Phaser felt the best and ran the fastest in play. Every build was verified by an automated player in a real browser: drag, collect, hazard, and timer tests all passed with zero console errors.

## Why publish this

This is how the factory picks its tools: one fixed brief, the same cheap test run across the plausible candidates in parallel, scored on criteria written down before anything was built. The builds are small, but the method is the product. If you are choosing a web game engine for rapid prototyping, steal the brief and run your own.

## License

Our game code and documentation are MIT licensed; see [LICENSE](LICENSE). The vendored engine files are third-party MIT-licensed work and remain under their own licenses; see [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md). Nothing here is a shipped product; these are prototype builds from an internal tool evaluation.
