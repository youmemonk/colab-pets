(function () {
  'use strict';

  function send(msg) {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg).then(resolve).catch(() => resolve(null));
        else resolve(null);
      });
    });
  }

  // Ambient sound toggles
  const ambBtns = document.querySelectorAll('.amb-btn');
  chrome.storage.sync.get(['mangoAmbient'], r => {
    const cur = r.mangoAmbient || '';
    ambBtns.forEach(b => b.classList.toggle('active', b.dataset.type === cur));
  });
  ambBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ambBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      send({ action: 'ambient', type: type || null });
    });
  });

  // Page effects
  document.querySelectorAll('.fx-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fx = btn.dataset.fx;
      send({ action: fx === 'randomFx' ? 'randomFx' : fx });
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    });
  });

  // Load stats
  async function loadStats() {
    const r = await send({ action: 'getStats' });
    if (r?.stats) {
      document.getElementById('s-cells').textContent = r.stats.cells || 0;
      document.getElementById('s-errors').textContent = r.stats.errors || 0;
      const mins = Math.round((Date.now() - (r.stats.session || Date.now())) / 60000);
      document.getElementById('s-time').textContent = mins;
    }
    if (r?.mood) {
      const moods = { content: 'content 🧡', happy: 'happy 😊', excited: 'excited 🎉', curious: 'curious 👀', annoyed: 'hmph 😤', concerned: 'worried 😟', sleepy: 'sleepy 💤' };
      document.getElementById('mood-val').textContent = moods[r.mood] || r.mood;
    }
  }
  loadStats();
})();
