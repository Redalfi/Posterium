const $ = (id) => document.getElementById(id);
const CATS = ['İncəsənət', 'Jurnal üz qabıqları', 'Album Covers', 'Patentlər', 'Flower Market', 'Fərdi sifariş'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const opts = (sel) => (CATS.includes(sel) || !sel ? CATS : [sel, ...CATS])
  .map((c) => `<option${c === sel ? ' selected' : ''}>${esc(c)}</option>`).join('');
const say = (t, err) => { $('st').textContent = t; $('st').className = 'msg' + (err ? ' e' : ''); };

async function api(url, opt) {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Xəta baş verdi.');
  return j;
}
const show = (admin) => { $('login').hidden = admin; $('app').hidden = !admin; if (admin) load(); };

$('nc').innerHTML = opts();
api('/api/me').then((m) => show(m.admin)).catch(() => show(false));

$('lf').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('u').value.trim(), password: $('pw').value }) });
    $('pw').value = ''; $('le').textContent = ''; show(true);
  } catch (x) { $('le').textContent = x.message; }
});
$('out').onclick = async () => { await api('/api/logout', { method: 'POST' }); show(false); };

async function load() {
  const list = await api('/api/posters');
  $('list').innerHTML = list.length ? list.map((p) => `
    <article class="p" data-id="${p.id}">
      <div class="th" ${p.image ? `style="background-image:url(/uploads/${encodeURIComponent(p.image)})"` : ''}>${p.image ? '' : 'Şəkil yoxdur'}</div>
      <div class="f">
        <input data-f="title" value="${esc(p.title)}" aria-label="Ad">
        <div class="r">
          <select data-f="category" aria-label="Kateqoriya">${opts(p.category)}</select>
          <input data-f="price" type="number" min="0" step="0.5" value="${esc(p.price)}" placeholder="Qiymət ₼" aria-label="Qiymət">
        </div>
        <textarea data-f="description" rows="2" aria-label="Təsvir">${esc(p.description)}</textarea>
        <div class="r">
          <label class="btn ghost small">Şəkli dəyiş<input type="file" accept="image/jpeg,image/png,image/webp" data-up hidden></label>
          <button class="btn ghost small" data-del>Sil</button>
        </div>
      </div>
    </article>`).join('') : '<p class="msg">Hələ poster yoxdur. Yuxarıdan əlavə edin.</p>';
}

$('add').onclick = async function () {
  const title = $('nt').value.trim();
  if (!title) { say('Poster adını yazın.', true); return; }
  const fd = new FormData();
  fd.append('title', title); fd.append('category', $('nc').value);
  fd.append('price', $('np').value); fd.append('description', $('nd').value);
  if ($('ni').files[0]) fd.append('image', $('ni').files[0]);
  this.disabled = true; say('Əlavə olunur...');
  try {
    await api('/api/posters', { method: 'POST', body: fd });
    ['nt', 'np', 'nd', 'ni'].forEach((i) => ($(i).value = ''));
    say('Poster əlavə olundu.'); load();
  } catch (x) { say(x.message, true); }
  this.disabled = false;
};

// Sahə dəyişəndə və ya yeni şəkil seçiləndə avtomatik yadda saxlanılır
$('list').addEventListener('change', async (e) => {
  const row = e.target.closest('.p'); if (!row) return;
  const fd = new FormData();
  row.querySelectorAll('[data-f]').forEach((el) => fd.append(el.dataset.f, el.value));
  const file = e.target.matches('[data-up]') ? e.target.files[0] : null;
  if (file) fd.append('image', file);
  say('Saxlanılır...');
  try {
    const p = await api('/api/posters/' + row.dataset.id, { method: 'PUT', body: fd });
    if (file) { const th = row.querySelector('.th'); th.textContent = ''; th.style.backgroundImage = `url(/uploads/${encodeURIComponent(p.image)})`; }
    say('Yadda saxlanıldı.');
  } catch (x) { say(x.message, true); }
});

let armed = null; // Silmək üçün iki dəfə klik
$('list').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  if (armed !== b) { armed = b; b.textContent = 'Əminsiniz?'; setTimeout(() => { if (armed === b) { armed = null; b.textContent = 'Sil'; } }, 4000); return; }
  try { await api('/api/posters/' + b.closest('.p').dataset.id, { method: 'DELETE' }); say('Poster silindi.'); load(); }
  catch (x) { say(x.message, true); }
});
