# Tacticus Damage Simulator

A static, browser-only combat simulator for **Warhammer 40,000: Tacticus**.

## Version

**v0.5** — usable beta.

## Features

- Player attack versus boss.
- Boss normal attack plus up to three optional abilities.
- Min / expected / max damage.
- 1–100 attack simulations.
- Chained crit checks.
- Chained block checks.
- Flat block reduction per hit after modifiers.
- Armour vs pierce formula.
- Terrain modifiers.
- Damage distribution chart.
- Expandable combat log.
- Browser preset saving.
- JSON import/export.
- Responsive layout.

## Running locally

Open `index.html` in a browser.

If your browser blocks ES modules from local files, run a tiny local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

1. Create a GitHub repository.
2. Upload all project files.
3. Go to **Settings → Pages**.
4. Set source to your main branch.
5. Save.
6. Your app will be live at:

```text
https://YOURUSERNAME.github.io/tacticus-damage-simulator/
```

## Disclaimer

Warhammer 40,000: Tacticus belongs to Snowprint Studios. This is an unofficial fan-made tool.
