let _timer = null;
let _el = null;

function _getEl() {
  if (!_el) _el = document.getElementById('toast');
  return _el;
}

export function showToast(msg, duration = 2400) {
  const el = _getEl();
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(_timer);
  _timer = setTimeout(() => el.classList.remove('on'), duration);
}
