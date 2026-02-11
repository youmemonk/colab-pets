(function () {
  'use strict';

  const cards = document.querySelectorAll('.pet-card');
  let active = [];

  function send(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
    });
  }

  async function load() {
    try {
      const r = await chrome.storage.sync.get(['activePets']);
      active = r.activePets || ['cat'];
      cards.forEach(c => {
        if (active.includes(c.dataset.type)) {
          c.classList.add('active');
          c.querySelector('.pstatus').textContent = 'On screen!';
        }
      });
    } catch (e) {
      active = ['cat'];
      document.querySelector('[data-type="cat"]')?.classList.add('active');
    }
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const on = card.classList.contains('active');
      if (on) {
        card.classList.remove('active');
        card.querySelector('.pstatus').textContent = '';
        active = active.filter(p => p !== type);
        send({ action: 'removePet', type });
      } else {
        if (active.length >= 5) {
          card.querySelector('.pstatus').textContent = 'Max 5!';
          setTimeout(() => { card.querySelector('.pstatus').textContent = ''; }, 2000);
          return;
        }
        card.classList.add('active');
        card.querySelector('.pstatus').textContent = 'On screen!';
        active.push(type);
        send({ action: 'addPet', type });
      }
      chrome.storage.sync.set({ activePets: active });
    });
  });

  document.getElementById('party-btn').addEventListener('click', () => {
    send({ action: 'party' });
    const b = document.getElementById('party-btn');
    b.textContent = '🎉🎊🥳'; b.style.transform = 'scale(1.1)';
    setTimeout(() => { b.textContent = '🎉 Party!'; b.style.transform = ''; }, 1200);
  });

  document.getElementById('tricks-btn').addEventListener('click', () => {
    send({ action: 'tricks' });
    const b = document.getElementById('tricks-btn');
    b.textContent = '✨ Doing tricks!'; b.style.transform = 'scale(1.1)';
    setTimeout(() => { b.textContent = '🐾 Tricks!'; b.style.transform = ''; }, 1200);
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    active = [];
    cards.forEach(c => { c.classList.remove('active'); c.querySelector('.pstatus').textContent = ''; });
    send({ action: 'removeAll' });
    chrome.storage.sync.set({ activePets: [] });
  });

  load();
})();
