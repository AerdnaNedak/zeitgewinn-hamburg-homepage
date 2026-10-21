// Themenfilter und Suche für die Blogübersicht.
(function () {
  var grid = document.getElementById('grid');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.filter button[data-thema]'));
  var info = document.getElementById('info');
  var leer = document.getElementById('leer');
  var q = document.getElementById('q');
  var details = document.querySelector('.filter details');
  var mobil = window.matchMedia('(max-width:900px)');
  var aktiv = null;

  cards.forEach(function (c) {
    c._themen = (c.dataset.themen || '').split(' ');
    c._text = c.textContent.toLowerCase();
  });

  function zeigen() {
    var match = aktiv && aktiv.dataset.match ? aktiv.dataset.match.split(' ') : null;
    var term = q.value.trim().toLowerCase();
    var n = 0;
    cards.forEach(function (c) {
      var ok = (!match || c._themen.some(function (t) { return match.indexOf(t) >= 0; })) &&
        (!term || c._text.indexOf(term) >= 0);
      c.hidden = !ok;
      if (ok) n++;
    });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === aktiv || (!aktiv && !b.dataset.thema))); });
    var name = aktiv && aktiv.dataset.thema ? aktiv.firstChild.textContent.trim() : 'Alle Themen';
    info.innerHTML = '<span><strong>' + n + '</strong> Artikel · ' + name.replace(/[<>&]/g, '') + '</span>';
    leer.hidden = n > 0;
  }

  function waehle(b, merken) {
    aktiv = b && b.dataset.thema ? b : null;
    if (merken) {
      var url = new URL(location.href);
      if (aktiv) url.searchParams.set('thema', aktiv.dataset.thema); else url.searchParams.delete('thema');
      history.replaceState(null, '', url);
    }
    zeigen();
  }

  document.querySelector('.filter').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-thema]');
    if (!b) return;
    waehle(b, true);
    if (mobil.matches) { details.open = false; grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  q.addEventListener('input', zeigen);

  function sync() { details.open = !mobil.matches; }
  mobil.addEventListener('change', sync);
  sync();

  var start = new URLSearchParams(location.search).get('thema');
  waehle(buttons.filter(function (b) { return b.dataset.thema === start; })[0] || null, false);
})();
