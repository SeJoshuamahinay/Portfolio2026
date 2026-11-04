// theme: dark by default, remembers the visitor's choice
(() => {
  const root = document.documentElement, KEY = 'theme';
  let saved; try { saved = localStorage.getItem(KEY); } catch (e) {}
  const apply = (t, persist) => {
    root.dataset.theme = t;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#f7f3f0' : '#050003';
    if (persist) try { localStorage.setItem(KEY, t); } catch (e) {}
    window.dispatchEvent(new Event('themechange'));
  };
  // no saved choice -> follow the system setting (and keep following it until the visitor picks one)
  const mq = matchMedia('(prefers-color-scheme: light)');
  root.dataset.theme = saved === 'light' || saved === 'dark' ? saved : (mq.matches ? 'light' : 'dark');
  mq.addEventListener && mq.addEventListener('change', e => {
    let s; try { s = localStorage.getItem(KEY); } catch (x) {}
    if (!s) { apply(e.matches ? 'light' : 'dark', false); const b = document.getElementById('theme'); if (b) b.setAttribute('aria-pressed', e.matches); }
  });
  addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('theme'); if (!b) return;
    const sync = () => { const l = root.dataset.theme === 'light';
      b.setAttribute('aria-pressed', l); b.setAttribute('aria-label', l ? 'Switch to dark mode' : 'Switch to light mode'); };
    sync();
    let fade;
    b.addEventListener('click', () => {
      clearTimeout(fade);
      root.classList.add('theming');
      apply(root.dataset.theme === 'light' ? 'dark' : 'light', true); sync();
      fade = setTimeout(() => root.classList.remove('theming'), 650);
    });
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = root.dataset.theme === 'light' ? '#f7f3f0' : '#050003';
  });
})();
