#!/usr/bin/env bash
# ═══════════════════════════════════════════
#  Build standalone chitti.js + loader page + Colab notebook
#  Embeds CSS + base64 audio + patched mango.js
# ═══════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/standalone/chitti.js"
CDN_URL="https://cdn.jsdelivr.net/gh/youmemonk/colab-pets@main/standalone/chitti.js"

echo "Building standalone Chitti..."

# ── 1. Base64-encode sound files ──
echo "  Encoding sounds..."
CHIRP1_B64=$(base64 < "$ROOT/sounds/chirp1.mp3")
CHIRP2_B64=$(base64 < "$ROOT/sounds/chirp2.mp3")
PARROT_B64=$(base64 < "$ROOT/sounds/parrot.mp3")
SQUAWK_B64=$(base64 < "$ROOT/sounds/squawk.mp3")
SINGING_B64=$(base64 < "$ROOT/sounds/singing.mp3")

# ── 2. Read CSS ──
echo "  Reading CSS..."
CSS_CONTENT=$(cat "$ROOT/content/mango.css")

# ── 3. Read mango.js ──
echo "  Reading mango.js..."
MANGO_JS=$(cat "$ROOT/content/mango.js")

# ── 4. Assemble output ──
echo "  Assembling standalone file..."

cat > "$OUT" << 'HEADER'
/* ═══════════════════════════════════════════
   CHITTI — Standalone DevTools Snippet
   Paste into Chrome DevTools > Sources > Snippets
   No extension needed!
   ═══════════════════════════════════════════ */
HEADER

# Double-load guard
cat >> "$OUT" << 'GUARD'
if (window._chittiLoaded) { console.log('🐦 Chitti is already here!'); } else {
window._chittiLoaded = true;
GUARD

# Inject CSS
cat >> "$OUT" << 'CSS_START'

// ═══ INJECT CSS ═══
(function() {
  const style = document.createElement('style');
  style.id = 'chitti-standalone-css';
  if (document.getElementById('chitti-standalone-css')) document.getElementById('chitti-standalone-css').remove();
  style.textContent = `
CSS_START

# Write CSS content (escape backticks and backslashes for template literal)
echo "$CSS_CONTENT" | sed 's/\\/\\\\/g; s/`/\\`/g; s/\$/\\$/g' >> "$OUT"

cat >> "$OUT" << 'CSS_END'
`;
  document.head.appendChild(style);
})();

CSS_END

# Sound map
cat >> "$OUT" << 'SOUNDMAP_START'
// ═══ EMBEDDED SOUNDS ═══
const _CHITTI_SOUNDS = {
SOUNDMAP_START

echo "  'chirp1.mp3': 'data:audio/mpeg;base64,${CHIRP1_B64}'," >> "$OUT"
echo "  'chirp2.mp3': 'data:audio/mpeg;base64,${CHIRP2_B64}'," >> "$OUT"
echo "  'parrot.mp3': 'data:audio/mpeg;base64,${PARROT_B64}'," >> "$OUT"
echo "  'squawk.mp3': 'data:audio/mpeg;base64,${SQUAWK_B64}'," >> "$OUT"
echo "  'singing.mp3': 'data:audio/mpeg;base64,${SINGING_B64}'," >> "$OUT"

cat >> "$OUT" << 'SOUNDMAP_END'
};

SOUNDMAP_END

# Write patched mango.js:
# 1. Replace soundURL (chrome.runtime.getURL)
# 2. Replace fetchNote (chrome.runtime.sendMessage)
# 3. Replace chrome.storage.sync.get
# 4. Remove chrome.runtime.onMessage listener (replace _listen with empty method)
# 5. Replace chrome.storage.sync.set
echo "$MANGO_JS" | \
  sed "s|const soundURL = f => chrome.runtime.getURL('sounds/' + f);|const soundURL = f => _CHITTI_SOUNDS[f] \|\| '';|" | \
  sed "s|try { const r = await chrome.runtime.sendMessage({ action: 'fetchNote' }); if (r?.note) return r.note; } catch (e) { }|try { const r = await fetch('https://www.affirmations.dev/'); const j = await r.json(); if (j?.affirmation) return j.affirmation; } catch (e) { }|" | \
  sed "s|try { const r = await chrome.storage.sync.get(\['mangoAmbient'\]); if (r.mangoAmbient) sfx.ambientStart(r.mangoAmbient); } catch (e) { }|try { const a = localStorage.getItem('chittiAmbient'); if (a) sfx.ambientStart(a); } catch (e) { }|" | \
  perl -0777 -pe 's/    _listen\(\) \{\n      if \(chrome\?\.runtime\).*?cb\(\{ ok: true \}\); return true;\n      \}\);\n    \}/    _listen() { \/* standalone: no popup listener needed *\/ }/s' \
  >> "$OUT"

# Close the double-load guard
echo "" >> "$OUT"
echo "}" >> "$OUT"

# File size info
SIZE=$(wc -c < "$OUT" | tr -d ' ')
SIZE_KB=$((SIZE / 1024))
echo ""
echo "Done! Built standalone/chitti.js (${SIZE_KB} KB)"

# ═══════════════════════════════════════════
#  Generate chitti-loader.html (bookmarklet setup page)
# ═══════════════════════════════════════════
echo ""
echo "Building chitti-loader.html..."

LOADER_OUT="$ROOT/standalone/chitti-loader.html"
BOOKMARKLET_JS="javascript:void(fetch('${CDN_URL}').then(r=>r.text()).then(t=>{if(!window._chittiLoaded){document.head.appendChild(Object.assign(document.createElement('script'),{textContent:t}))}else{console.log('Chitti is already here!')}}))"

cat > "$LOADER_OUT" << LOADEREOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chitti — One-Click Setup</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #fef9e7 0%, #fdebd0 50%, #fadbd8 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    color: #2c3e50;
  }

  h1 { font-size: 2.2em; margin-bottom: 8px; }
  .subtitle { font-size: 1.1em; color: #666; margin-bottom: 40px; }

  .card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    padding: 32px;
    max-width: 560px;
    width: 100%;
    margin-bottom: 28px;
  }

  .card h2 {
    font-size: 1.3em;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card .label {
    font-size: 0.7em;
    background: #27ae60;
    color: white;
    padding: 2px 8px;
    border-radius: 8px;
    font-weight: 600;
    vertical-align: middle;
  }
  .card .label.alt {
    background: #7f8c8d;
  }
  .card p { margin: 10px 0; line-height: 1.6; color: #555; }

  /* Bookmarklet button */
  .bookmarklet-wrap {
    display: flex;
    justify-content: center;
    margin: 24px 0 16px;
  }
  .bookmarklet {
    display: inline-block;
    background: linear-gradient(135deg, #f39c12, #e67e22);
    color: white;
    font-size: 1.3em;
    font-weight: 700;
    padding: 14px 32px;
    border-radius: 12px;
    text-decoration: none;
    cursor: grab;
    box-shadow: 0 4px 16px rgba(243, 156, 18, 0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    user-select: none;
    -webkit-user-select: none;
  }
  .bookmarklet:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 24px rgba(243, 156, 18, 0.5);
  }
  .bookmarklet:active { cursor: grabbing; transform: scale(0.97); }

  .steps {
    list-style: none;
    counter-reset: steps;
    margin: 16px 0 0;
  }
  .steps li {
    counter-increment: steps;
    padding: 8px 0 8px 40px;
    position: relative;
    line-height: 1.5;
    color: #555;
  }
  .steps li::before {
    content: counter(steps);
    position: absolute;
    left: 0;
    top: 7px;
    width: 28px;
    height: 28px;
    background: #f39c12;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85em;
  }

  /* Code block */
  .code-wrap {
    position: relative;
    margin: 16px 0;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px;
    border-radius: 10px;
    font-size: 0.85em;
    overflow-x: auto;
    line-height: 1.5;
  }
  pre .kw { color: #c586c0; }
  pre .fn { color: #dcdcaa; }
  pre .str { color: #ce9178; }
  pre .cmt { color: #6a9955; }

  .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #444;
    color: #ddd;
    border: none;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background 0.15s;
  }
  .copy-btn:hover { background: #666; }
  .copy-btn.copied { background: #27ae60; color: white; }

  .hint {
    font-size: 0.85em;
    color: #999;
    text-align: center;
    margin-top: 6px;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 560px;
    width: 100%;
    margin-bottom: 28px;
    color: #aaa;
    font-size: 0.9em;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-top: 1px solid #ddd;
  }

  footer {
    margin-top: 20px;
    color: #aaa;
    font-size: 0.8em;
  }
  footer a { color: #aaa; }
</style>
</head>
<body>

<h1>Chitti</h1>
<p class="subtitle">Your cockatiel companion for Google Colab &amp; GitHub</p>

<!-- Option A: Bookmarklet -->
<div class="card">
  <h2>Option A: Bookmark <span class="label">Recommended</span></h2>
  <p>Drag the button below to your <strong>bookmark bar</strong>. Then click it on any Colab notebook to summon Chitti!</p>

  <div class="bookmarklet-wrap">
    <a class="bookmarklet"
       href="${BOOKMARKLET_JS}"
       title="Drag me to your bookmark bar!"
       onclick="alert('Drag this button to your bookmark bar instead of clicking it!'); return false;">
      Chitti
    </a>
  </div>

  <ol class="steps">
    <li>Make sure the <strong>bookmark bar</strong> is visible<br><span style="color:#999; font-size:0.9em">(Chrome: Ctrl+Shift+B / Cmd+Shift+B)</span></li>
    <li><strong>Drag</strong> the orange button above into your bookmark bar</li>
    <li>Open any <strong>Google Colab</strong> notebook or <strong>GitHub</strong> page</li>
    <li>Click the <strong>"Chitti"</strong> bookmark &mdash; she appears!</li>
  </ol>

  <p class="hint">One-time setup. Works on any Colab or GitHub tab forever.</p>
</div>

<div class="divider">or, if bookmarks don't work</div>

<!-- Option B: Colab Cell -->
<div class="card">
  <h2>Option B: Colab Cell <span class="label alt">Fallback</span></h2>
  <p>Copy the code below into a <strong>code cell</strong> at the top of your Colab notebook. Run it (Shift+Enter) to summon Chitti.</p>

  <div class="code-wrap">
    <pre><code><span class="kw">%%javascript</span>
<span class="cmt">// Summon Chitti!</span>
<span class="fn">fetch</span>(<span class="str">'${CDN_URL}'</span>)
  .<span class="fn">then</span>(r => r.<span class="fn">text</span>())
  .<span class="fn">then</span>(t => document.head.<span class="fn">appendChild</span>(
    Object.<span class="fn">assign</span>(document.<span class="fn">createElement</span>(<span class="str">'script'</span>), { textContent: t })
  ))</code></pre>
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
  </div>

  <ol class="steps">
    <li>Open your notebook in <strong>Google Colab</strong></li>
    <li>Add a <strong>code cell</strong> at the very top</li>
    <li><strong>Paste</strong> the code above into the cell</li>
    <li>Press <strong>Shift+Enter</strong> to run &mdash; Chitti appears!</li>
  </ol>

  <p class="hint">You can collapse the cell afterwards so it stays hidden.</p>
</div>

<footer>
  <a href="https://github.com/youmemonk/colab-pets" target="_blank">youmemonk/colab-pets</a>
</footer>

<script>
function copyCode(btn) {
  const code = \`%%javascript
// Summon Chitti!
fetch('${CDN_URL}')
  .then(r => r.text())
  .then(t => document.head.appendChild(
    Object.assign(document.createElement('script'), { textContent: t })
  ))\`;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}
</script>
</body>
</html>
LOADEREOF

echo "  Done! Built standalone/chitti-loader.html"

# ═══════════════════════════════════════════
#  Generate chitti.ipynb (Colab template notebook)
# ═══════════════════════════════════════════
echo ""
echo "Building chitti.ipynb..."

NOTEBOOK_OUT="$ROOT/standalone/chitti.ipynb"

cat > "$NOTEBOOK_OUT" << NOTEBOOKEOF
{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "name": "Chitti - Cockatiel Companion"
    },
    "kernelspec": {
      "name": "python3",
      "display_name": "Python 3"
    },
    "language_info": {
      "name": "python"
    }
  },
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": [
        "# Chitti \ud83d\udc26\n",
        "\n",
        "Run the cell below to summon your cockatiel companion!\n",
        "\n",
        "She'll hang out on your screen while you work. Try clicking on her, dragging her around, or just let her vibe."
      ]
    },
    {
      "cell_type": "code",
      "metadata": {},
      "source": [
        "%%javascript\n",
        "// Summon Chitti!\n",
        "fetch('${CDN_URL}')\n",
        "  .then(r => r.text())\n",
        "  .then(t => document.head.appendChild(\n",
        "    Object.assign(document.createElement('script'), { textContent: t })\n",
        "  ))"
      ],
      "execution_count": null,
      "outputs": []
    }
  ]
}
NOTEBOOKEOF

echo "  Done! Built standalone/chitti.ipynb"

echo ""
echo "=== Build Complete ==="
echo "  standalone/chitti.js       (${SIZE_KB} KB) — standalone script"
echo "  standalone/chitti-loader.html       — bookmarklet setup page"
echo "  standalone/chitti.ipynb             — Colab template notebook"
echo ""
echo "CDN URL: ${CDN_URL}"
