# Epoch Isles

A playable single-player browser strategy prototype with an original island, artwork and branding, inspired by classic population-driven strategy games.

**Play:** https://mysticalg.github.io/epoch-isles/

## Play

- Select a named city site on the island, then open its city view to inspect workers, buildings, garrisons and battles.
- **People:** assign gatherers, miners, inventors, smiths and guards. Idle residents grow the city and defend it.
- **Research:** choose inventions that unlock weapons, buildings and the Bronze and Iron Ages.
- **Workshop:** choose a recipe and batch quantity. Production consumes actual materials; pause or stop orders when needed.
- **Buildings / Defence:** construct local improvements, walls, watchtowers and later ballistas; assign guards and repair surviving structures.
- **Stores:** inspect finite reserves and choose which mineral the mine extracts. Growing city influence reaches more resource hexes.
- **March:** choose the number of idle residents, their weapon loadout and a named destination. Armies cross countryside; only suitable named sites can become cities.
- Friendly cities connect with paths automatically. Engineering upgrades connections to faster roads.
- Inspect a target city during its siege to see attackers, defenders, projectiles, damage and the real result.

Space pauses/resumes. **1**, **2** and **4** change speed. Escape cancels destination selection. On phones, pan the island/city scenery; management controls are below it.

## Run locally

No package installation or build step is required. Serve this directory over HTTP:

```sh
python -m http.server 8080
```

Open http://localhost:8080/ in a modern browser. ES modules require an HTTP server; opening `index.html` directly as a file is unsupported.

Run the simulation regression checks with Node.js:

```sh
node tests/game.test.mjs
```

The tests cover chosen production costs/yields, shortages, refunds, research and construction, finite deposits, influence, founding restrictions, countryside paths, faster roads, defensive bonuses, timed sieges, capture and save/resume.

## Hosting

GitHub Pages serves the `main` branch at `/` using the `.nojekyll` marker. HTML, modules, styles and generated assets use relative paths, including when hosted at `/epoch-isles/`.

The repository contains the game source directly at its root. `assets/` contains the generated artwork. No server, account credentials or private hosting configuration is needed to play.

## Saves and scope

Campaigns autosave to browser-local storage. They are specific to the browser and site origin: saves from another host do not automatically transfer to GitHub Pages. No offline time passes. Clearing site data removes the local save.

This is a bounded Stone/Bronze/Iron Age prototype with AI opposition, 141 traversable land hexes, 12 designated city sites, and city-based sieges. Multiplayer, later industrial ages and rail are not implemented. Original classic-game assets are not included.
