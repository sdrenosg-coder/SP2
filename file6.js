// client/public/social-proof.js (new – social proof widget)
(function() {
  const script = document.currentScript;
  const businessSlug = script.getAttribute('data-business');
  if (!businessSlug) {
    console.error('Bookly social proof: data-business attribute required');
    return;
  }
  const baseUrl = new URL(script.src).origin;

  // Create container
  const container = document.createElement('div');
  container.id = 'bookly-social-proof';
  container.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; background:white; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); padding:12px; font-family:Inter,sans-serif; max-width:280px;';
  script.parentNode.insertBefore(container, script);

  // Fetch recent bookings (simulate for now)
  const messages = [
    'Someone just booked a Women\'s Haircut',
    'A new client booked a Full Color',
    'Manicure was booked 2 minutes ago',
    'Pedicure slot filled',
  ];

  function showNotification() {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const div = document.createElement('div');
    div.className = 'bookly-notification';
    div.style.cssText = 'padding:8px 0; font-size:14px; color:#333;';
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'opacity 0.5s';
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 500);
    }, 4000);
  }

  setInterval(showNotification, 8000);

  // Optional: load real bookings from API
  fetch(`${baseUrl}/api/widget/${businessSlug}/config`)
    .then(res => res.json())
    .then(data => {
      // Could update with real booking events if available
      console.log('Social proof loaded for', data.business?.name);
    })
    .catch(() => {});
})();
