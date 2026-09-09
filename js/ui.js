/**
 * ui.js
 * -----------------------------------------------------------------------
 * Reusable UI primitives: toast notifications, modal dialogs, theme
 * application, and small DOM helpers shared across pages.
 * -----------------------------------------------------------------------
 */

const UI = (() => {
  let toastContainer;
  let modalRoot;
  let modalPreviouslyFocused = null;

  function init() {
    toastContainer = document.getElementById('toast-container');
    modalRoot = document.getElementById('modal-root');
  }

  // ---- Theme --------------------------------------------------------------

  function resolveTheme(preference) {
    if (preference === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return preference;
  }

  function applyTheme(preference) {
    const resolved = resolveTheme(preference);
    document.documentElement.setAttribute('data-theme', resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#0F1115' : '#F7F8FA');
    }
  }

  function applyAnimationsSetting(enabled) {
    document.documentElement.classList.toggle('no-animations', !enabled);
  }

  // ---- Toasts ---------------------------------------------------------------

  function toast(message, type = 'success', duration = 2600) {
    if (!toastContainer) return;

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    const icons = {
      success: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
      info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
      warning: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.7 3.86a2 2 0 0 0-3.4 0Z"/></svg>',
      error: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
    };

    el.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span class="toast__msg"></span>`;
    el.querySelector('.toast__msg').textContent = message;

    toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--visible'));

    const remove = () => {
      el.classList.remove('toast--visible');
      setTimeout(() => el.remove(), 220);
    };

    const timer = setTimeout(remove, duration);
    el.addEventListener('click', () => {
      clearTimeout(timer);
      remove();
    });
  }

  // ---- Clipboard --------------------------------------------------------------

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('clipboard api unavailable');
    } catch (e) {
      // Fallback for non-secure contexts (e.g. file://) or older browsers.
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (err) {
        return false;
      }
    }
  }

  async function copyWithFeedback(text, label) {
    if (!text) {
      toast('چیزی برای کپی وجود ندارد', 'warning');
      return;
    }
    const ok = await copyToClipboard(text);
    toast(ok ? 'کپی شد ✓' : 'کپی انجام نشد، دوباره تلاش کنید', ok ? 'success' : 'error');
  }

  // ---- Modals -------------------------------------------------------------------

  function openModal({ title, message, confirmLabel = 'تأیید', cancelLabel = 'انصراف', danger = false, onConfirm }) {
    if (!modalRoot) return;

    modalPreviouslyFocused = document.activeElement;

    modalRoot.innerHTML = `
      <div class="modal-overlay" data-close>
        <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
          <h2 id="modal-title" class="modal__title"></h2>
          <p id="modal-desc" class="modal__desc"></p>
          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" data-cancel>${cancelLabel}</button>
            <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm>${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;

    modalRoot.querySelector('.modal__title').textContent = title;
    modalRoot.querySelector('.modal__desc').textContent = message;
    modalRoot.classList.add('modal-root--open');

    const overlay = modalRoot.querySelector('.modal-overlay');
    const confirmBtn = modalRoot.querySelector('[data-confirm]');
    const cancelBtn = modalRoot.querySelector('[data-cancel]');

    function close() {
      modalRoot.classList.remove('modal-root--open');
      modalRoot.innerHTML = '';
      document.removeEventListener('keydown', onKeydown);
      if (modalPreviouslyFocused && modalPreviouslyFocused.focus) modalPreviouslyFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        // simple focus trap between the two buttons
        const focusables = [cancelBtn, confirmBtn];
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? (idx <= 0 ? 1 : 0) : idx === 1 ? 0 : 1;
        focusables[next].focus();
      }
    }

    overlay.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) close();
    });
    cancelBtn.addEventListener('click', close);
    confirmBtn.addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });

    document.addEventListener('keydown', onKeydown);
    confirmBtn.focus();
  }

  // ---- Misc DOM helpers ---------------------------------------------------------

  function formatTimestamp(ts) {
    const date = new Date(ts);
    return date.toLocaleString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  }

  const TYPE_LABELS = {
    name: '🎲 اسم',
    username: '👤 نام کاربری',
    password: '🔐 رمز عبور',
    email: '📧 ایمیل',
    brand: '🏷️ نام برند',
    code: '🔑 کد تصادفی',
    uuid: '🆔 UUID',
  };

  return {
    init,
    applyTheme,
    resolveTheme,
    applyAnimationsSetting,
    toast,
    copyToClipboard,
    copyWithFeedback,
    openModal,
    formatTimestamp,
    TYPE_LABELS,
  };
})();
