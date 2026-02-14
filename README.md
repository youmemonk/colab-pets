# Chitti — Cockatiel Companion for Google Colab

A tiny cockatiel that hangs out on your Google Colab notebooks. She chirps, sings, does tricks, and keeps you company while you code.

## Quick Start (No Extension Needed)

### Option A: Bookmarklet (Recommended)

1. Visit the **[Chitti Setup Page](https://youmemonk.github.io/colab-pets/standalone/chitti-loader.html)**
2. Drag the **"Chitti"** button to your bookmark bar
3. Open any Colab notebook and click the bookmark — done!

### Option B: Colab Cell

Paste this into a code cell at the top of your notebook and run it (Shift+Enter):

```javascript
%%javascript
// Summon Chitti!
fetch('https://cdn.jsdelivr.net/gh/youmemonk/colab-pets@chitti-loader/standalone/chitti.js')
  .then(r => r.text())
  .then(t => document.head.appendChild(
    Object.assign(document.createElement('script'), { textContent: t })
  ))
```

### Option C: Template Notebook

Open [`standalone/chitti.ipynb`](standalone/chitti.ipynb) in Colab — the loader cell is already there, just hit play.

## What She Does

- **Idles** on your screen with blinking, head tilts, and crest movements
- **Chirps** when you click her
- **Sings** a little tune (try clicking her a few times!)
- **Does tricks** — puffs up, spreads her wings into a heart shape
- **Draggable** — pick her up and drop her anywhere
- **Eye tracking** — she watches your cursor

## Building from Source

```bash
cd standalone
bash build.sh
```

This generates:
- `chitti.js` — standalone script (all sounds embedded, ~2.8 MB)
- `chitti-loader.html` — bookmarklet setup page
- `chitti.ipynb` — template Colab notebook
