// Setzt ein eingebettetes Video erst ein, wenn jemand auf den Platzhalter klickt.
(function () {
  document.addEventListener('click', function (e) {
    var knopf = e.target.closest('.embed-play');
    if (!knopf) return;
    var box = knopf.closest('.embed');
    var url = new URL(box.dataset.src);
    url.searchParams.set('autoplay', '1');
    var frame = document.createElement('iframe');
    frame.src = url.href;
    frame.title = box.dataset.title || 'Video';
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.allowFullscreen = true;
    box.replaceWith(frame);
    frame.focus();
  });
})();
