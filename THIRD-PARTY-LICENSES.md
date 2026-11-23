# Third-Party Licenses

The game code and documentation in this repository are HawkStack AI LLC work, MIT licensed (see LICENSE). Each build folder also vendors one third-party game engine file. Those files are not covered by this repository's LICENSE; each remains under its own MIT license, held by its upstream authors.

| File | Project | Version | License | Upstream |
|---|---|---|---|---|
| `phaser/phaser.min.js` | Phaser | 3.90.0 | MIT | https://github.com/phaserjs/phaser |
| `pixijs/pixi.min.js` | PixiJS | 8.22.0 | MIT | https://github.com/pixijs/pixijs |
| `littlejs/littlejs.min.js` | LittleJS | 1.29.1 | MIT | https://github.com/KilledByAPixel/LittleJS |

Notes:

- The PixiJS and LittleJS files carry their MIT license banners in the file headers, as shipped.
- The Phaser distribution file ships without a banner in this build; Phaser is MIT licensed and its full license text lives in the upstream repository linked above.
- Engine files are vendored exactly as distributed by their npm packages (dist file extracted only). They are included so each build runs standalone by opening its `index.html`, with no package install.
