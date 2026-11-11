const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let posters = [], active = 'Hamısı', whatsapp = '';

async function init() {
  try {
    const [cfg, list] = await Promise.all([
      fetch('/api/config').then((r) => r.json()),
      fetch('/api/posters').then((r) => r.json())
    ]);
    whatsapp = cfg.whatsapp; posters = list;
    hero(); chips(); grid();
  } catch {
    $('#grid').innerHTML = '<p class="msg e">Posterlər yüklənmədi. Səhifəni yeniləyin.</p>';
  }
}

// Hero divarında ilk 3 şəkilli poster göstərilir
function hero() {
  const withImg = posters.filter((p) => p.image).slice(0, 3);
  document.querySelectorAll('.frame i').forEach((el, i) => {
    if (withImg[i]) { el.className = ''; el.style.backgroundImage = `url(/uploads/${encodeURIComponent(withImg[i].image)})`; }
  });
}

function chips() {
  const cats = ['Hamısı', ...new Set(posters.map((p) => p.category).filter(Boolean))];
  $('#chips').innerHTML = cats.map((c) => `<button class="chip" aria-pressed="${c === active}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
}

function grid() {
  const list = posters.filter((p) => active === 'Hamısı' || p.category === active);
  if (!list.length) { $('#grid').innerHTML = '<p class="msg">Hələ poster əlavə olunmayıb.</p>'; return; }
  $('#grid').innerHTML = list.map((p) => `
    <article class="card">
      <div class="art">${p.image ? `<img src="/uploads/${encodeURIComponent(p.image)}" alt="${esc(p.title)}" loading="lazy">` : 'Şəkil yoxdur'}</div>
      <h3>${esc(p.title)}</h3>
      ${p.category ? `<p class="cat">${esc(p.category)}</p>` : ''}
      ${p.description ? `<p class="cat">${esc(p.description)}</p>` : ''}
      <p class="price">${p.price != null ? esc(p.price) + ' ₼' : 'Qiymət sifarişdə'}</p>
      <button class="btn small" data-order="${esc(p.title)}">Sifariş et</button>
    </article>`).join('');
}

$('#chips').addEventListener('click', (e) => {
  const c = e.target.closest('[data-c]'); if (!c) return;
  active = c.dataset.c; chips(); grid();
});
$('#grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-order]'); if (!b) return;
  $('#f').poster.value = b.dataset.order;
  $('#sifaris').scrollIntoView();
  $('#f').ad.focus();
});

$('#f').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target, m = $('#fm');
  if (!f.ad.value.trim() || !f.tel.value.trim() || !f.poster.value.trim()) { m.textContent = 'Ad, telefon və poster xanalarını doldurun.'; return; }
  m.textContent = '';
  const t = 'Salam! Posterium saytından sifariş:\n' +
    `Ad: ${f.ad.value.trim()}\nTelefon: ${f.tel.value.trim()}\nPoster: ${f.poster.value.trim()}\n` +
    `Ölçü: ${f.olcu.value}\nÇərçivə: ${f.cerceve.value}` +
    (f.qeyd.value.trim() ? `\nQeyd: ${f.qeyd.value.trim()}` : '');
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
});

init();
