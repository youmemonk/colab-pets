// Chitti — Background service worker for love note API
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchNote') {
    fetchNote().then(note => sendResponse({ note })).catch(() => sendResponse({ note: null }));
    return true;
  }
});

async function fetchNote() {
  try {
    const res = await fetch('https://www.affirmations.dev');
    if (res.ok) {
      const data = await res.json();
      const a = data.affirmation;
      // Only wrap with personal touch sometimes, and only when it makes sense
      const r = Math.random();
      if (r < 0.3) return `Chitti found this for you: "${a}" 🪶`;
      if (r < 0.5) return `${a} ✨`;
      return a;
    }
  } catch (e) {}
  return null;
}
