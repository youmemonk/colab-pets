/* ============================================
   COLAB PETS - Popup Controller
   ============================================ */

(function () {
  'use strict';

  const petCards = document.querySelectorAll('.pet-card');
  let activePets = [];

  // Load saved state
  async function loadState() {
    try {
      const result = await chrome.storage.sync.get(['activePets', 'petNames']);
      activePets = result.activePets || ['cat'];
      const petNames = result.petNames || {};

      petCards.forEach(card => {
        const type = card.dataset.type;
        if (activePets.includes(type)) {
          card.classList.add('active');
          card.querySelector('.pet-card-status').textContent = 'On your screen!';
        }
        if (petNames[type]) {
          card.querySelector('.pet-card-name').textContent = petNames[type];
        }
      });
    } catch (e) {
      // Default state
      activePets = ['cat'];
      document.querySelector('[data-type="cat"]')?.classList.add('active');
    }
  }

  // Send message to content script
  function sendToContent(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {
          // Tab might not have content script
        });
      }
    });
  }

  // Toggle pet
  petCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const isActive = card.classList.contains('active');

      if (isActive) {
        // Remove pet
        card.classList.remove('active');
        card.querySelector('.pet-card-status').textContent = '';
        activePets = activePets.filter(p => p !== type);
        sendToContent({ action: 'removePet', type });
      } else {
        // Add pet
        if (activePets.length >= 5) {
          card.querySelector('.pet-card-status').textContent = 'Max 5 pets!';
          setTimeout(() => {
            card.querySelector('.pet-card-status').textContent = '';
          }, 2000);
          return;
        }
        card.classList.add('active');
        card.querySelector('.pet-card-status').textContent = 'On your screen!';
        activePets.push(type);
        sendToContent({ action: 'addPet', type });
      }

      // Save state
      chrome.storage.sync.set({ activePets });
    });
  });

  // Party button
  document.getElementById('party-btn').addEventListener('click', () => {
    sendToContent({ action: 'party' });

    // Mini party in popup too
    const btn = document.getElementById('party-btn');
    btn.textContent = '🎉🎊🥳';
    btn.style.transform = 'scale(1.1)';
    setTimeout(() => {
      btn.textContent = '🎉 Party!';
      btn.style.transform = '';
    }, 1500);
  });

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    activePets = [];
    petCards.forEach(card => {
      card.classList.remove('active');
      card.querySelector('.pet-card-status').textContent = '';
    });
    sendToContent({ action: 'removeAll' });
    chrome.storage.sync.set({ activePets: [] });
  });

  // Init
  loadState();
})();
