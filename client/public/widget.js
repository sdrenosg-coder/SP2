(function() {
  const script = document.currentScript;
  const businessSlug = script.getAttribute('data-business');
  if (!businessSlug) {
    console.error('Bookly widget: data-business attribute required');
    return;
  }
  const baseUrl = new URL(script.src).origin;
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/b/${businessSlug}?embed=1`;
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  script.parentNode.insertBefore(iframe, script);
})();
