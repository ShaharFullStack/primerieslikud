export class ToastComponent {
  constructor(rootEl, msgEl) {
    this.rootEl = rootEl;
    this.msgEl = msgEl;
    this._timer = null;
  }

  show(message) {
    this.msgEl.textContent = message;
    this.rootEl.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.rootEl.classList.remove('show'), 3200);
  }
}
