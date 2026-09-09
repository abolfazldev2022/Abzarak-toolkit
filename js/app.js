/**
 * app.js
 * -----------------------------------------------------------------------
 * Wires together storage, generators and UI: page navigation, dashboard
 * cards, every generator page, history, and settings.
 * -----------------------------------------------------------------------
 */

(() => {
  'use strict';

  // Current in-memory result per generator (so Ctrl/Cmd+C, favorite, etc. work).
  const state = {
    activePage: 'home',
    name: '',
    username: '',
    password: '',
    passwordVisible: true,
    email: '',
    brand: '',
    code: '',
    uuids: [],
    usernameOptions: { language: 'fa', length: 14, useNumbers: true, useUnderscore: false, useDot: false, useHyphen: false, useCapitals: true },
    passwordOptions: { length: 16, useUpper: true, useLower: true, useNumbers: true, useSymbols: false, excludeAmbiguous: false },
    emailOptions: { language: 'en', domain: 'random', useNumbers: true, useDot: false, useUnderscore: false },
    codeOptions: { length: 12, useUpper: true, useLower: false, useNumbers: true, useSymbols: false, separator: '-' },
    brandCategory: 'brand',
    uuidCount: 1,
  };

  const PAGE_TITLES = {
    home: 'خانه',
    name: 'تولید نام',
    username: 'نام کاربری',
    password: 'رمز عبور',
    email: 'ایمیل',
    brand: 'نام برند',
    code: 'کد تصادفی',
    uuid: 'UUID',
    history: 'تاریخچه',
    settings: 'تنظیمات',
    about: 'درباره',
  };

  const DASHBOARD_CARDS = [
    { page: 'name', title: 'تولید اسم', desc: 'نام‌های خلاقانه و به‌یادماندنی فارسی', icon: 'M16 3h5v5M8 21H3v-5M21 3 3 21' },
    { page: 'username', title: 'تولید نام کاربری', desc: 'نام کاربری فارسی، انگلیسی یا ترکیبی', icon: 'user' },
    { page: 'password', title: 'تولید رمز عبور', desc: 'رمزهای قوی با تصادفی‌سازی امن', icon: 'lock' },
    { page: 'email', title: 'تولید ایمیل', desc: 'ایمیل آزمایشی برای تست و نمونه', icon: 'mail' },
    { page: 'brand', title: 'تولید نام برند', desc: 'نام‌های کوتاه برای برند و پروژه', icon: 'brand' },
    { page: 'code', title: 'تولید کد', desc: 'کد و کلید با قالب دلخواه', icon: 'code' },
    { page: 'uuid', title: 'تولید UUID', desc: 'شناسه‌های یکتای نسخهٔ ۴', icon: 'uuid' },
  ];

  const CARD_ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    brand: '<path d="M12 2 3 12l9 10 9-10z"/><circle cx="12" cy="12" r="2.4"/>',
    code: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    uuid: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M7 12h10"/>',
  };

  // ---- Page navigation -----------------------------------------------------

  function goToPage(pageId) {
    state.activePage = pageId;
    document.querySelectorAll('.page').forEach((el) => el.classList.remove('is-active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('is-active');

    document.getElementById('topbar-title').textContent = PAGE_TITLES[pageId] || '';

    document.querySelectorAll('.nav__item[data-page]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.page === pageId);
    });
    document.querySelectorAll('.bottom-nav__item[data-page]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.page === pageId);
    });

    if (pageId === 'history') renderHistory();
    if (pageId === 'settings') refreshSettingsUI();

    closeSidebar();
    document.querySelector('.content').scrollTo({ top: 0, behavior: 'instant' in window ? undefined : undefined });
    window.scrollTo(0, 0);
  }

  function setupNavigation() {
    document.querySelectorAll('[data-page]').forEach((el) => {
      el.addEventListener('click', () => goToPage(el.dataset.page));
    });
  }

  // ---- Sidebar (mobile drawer) ----------------------------------------------

  function openSidebar() {
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('sidebar-overlay').classList.add('is-open');
    document.getElementById('hamburger-btn').setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebar-overlay').classList.remove('is-open');
    document.getElementById('hamburger-btn').setAttribute('aria-expanded', 'false');
  }
  function setupSidebar() {
    document.getElementById('hamburger-btn').addEventListener('click', () => {
      const isOpen = document.getElementById('sidebar').classList.contains('is-open');
      isOpen ? closeSidebar() : openSidebar();
    });
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  }

  // ---- Dashboard --------------------------------------------------------------

  function renderDashboard() {
    const grid = document.getElementById('dashboard-cards');
    grid.innerHTML = DASHBOARD_CARDS.map((card) => {
      const iconPath = card.icon === 'M16 3h5v5M8 21H3v-5M21 3 3 21'
        ? '<path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3 3 21"/>'
        : CARD_ICONS[card.icon] || '';
      return `
        <button class="tool-card" data-page="${card.page}">
          <span class="tool-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg></span>
          <span class="tool-card__title">${card.title}</span>
          <span class="tool-card__desc">${card.desc}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-page]').forEach((el) => {
      el.addEventListener('click', () => goToPage(el.dataset.page));
    });

    document.getElementById('quick-name').addEventListener('click', () => {
      goToPage('name');
      runNameGenerate();
    });
    document.getElementById('quick-password').addEventListener('click', () => {
      goToPage('password');
      runPasswordGenerate();
    });
    document.getElementById('quick-username').addEventListener('click', () => {
      goToPage('username');
      runUsernameGenerate();
    });
  }

  // ---- Theme ------------------------------------------------------------------

  function initTheme() {
    const settings = Storage.getSettings();
    UI.applyTheme(settings.theme);
    UI.applyAnimationsSetting(settings.animationsEnabled);
    updateThemeIcon(settings.theme);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = Storage.getSettings();
        if (current.theme === 'system') {
          UI.applyTheme('system');
        }
      });
    }
  }

  function updateThemeIcon(preference) {
    const resolved = UI.resolveTheme(preference);
    const icon = document.getElementById('theme-icon');
    if (resolved === 'dark') {
      icon.innerHTML = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>';
    } else {
      icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
    }
  }

  function setupThemeToggle() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const settings = Storage.getSettings();
      const resolved = UI.resolveTheme(settings.theme);
      const next = resolved === 'dark' ? 'light' : 'dark';
      settings.theme = next;
      Storage.saveSettings(settings);
      UI.applyTheme(next);
      updateThemeIcon(next);
      refreshSettingsUI();
    });
  }

  // ---- Generic segmented / chip control helper ---------------------------------

  function setupSegmented(containerId, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        onChange(btn.dataset.value);
      });
    });
  }

  // =============================================================================
  // 1. NAME GENERATOR
  // =============================================================================

  function runNameGenerate(addToHistory = true) {
    state.name = Generators.generateName();
    document.getElementById('name-result').textContent = state.name;
    if (addToHistory) Storage.addHistoryItem({ type: 'name', value: state.name });
    updateFavoriteButton('name-favorite', 'name', state.name);
  }

  function setupNamePage() {
    document.getElementById('name-generate').addEventListener('click', runNameGenerate);
    document.getElementById('name-copy').addEventListener('click', () => UI.copyWithFeedback(state.name, 'اسم'));
    document.getElementById('name-favorite').addEventListener('click', () => {
      if (!state.name) return;
      Storage.toggleFavorite({ type: 'name', value: state.name });
      updateFavoriteButton('name-favorite', 'name', state.name);
    });
  }

  function updateFavoriteButton(btnId, type, value) {
    const btn = document.getElementById(btnId);
    if (!btn || !value) return;
    const favs = Storage.getFavorites();
    const isFav = favs.some((f) => f.type === type && f.value === value);
    btn.classList.toggle('is-active', isFav);
  }

  // =============================================================================
  // 2. USERNAME GENERATOR
  // =============================================================================

  function runUsernameGenerate(addToHistory = true) {
    state.username = Generators.generateUsername(state.usernameOptions);
    document.getElementById('username-result').textContent = state.username;
    if (addToHistory) Storage.addHistoryItem({ type: 'username', value: state.username });
  }

  function setupUsernamePage() {
    setupSegmented('username-language', (value) => {
      state.usernameOptions.language = value;
    });

    const lengthInput = document.getElementById('username-length');
    lengthInput.addEventListener('input', () => {
      state.usernameOptions.length = Number(lengthInput.value);
      document.getElementById('username-length-value').textContent = lengthInput.value;
    });

    const bindCheckbox = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => { state.usernameOptions[key] = el.checked; });
    };
    bindCheckbox('username-numbers', 'useNumbers');
    bindCheckbox('username-underscore', 'useUnderscore');
    bindCheckbox('username-dot', 'useDot');
    bindCheckbox('username-hyphen', 'useHyphen');
    bindCheckbox('username-capitals', 'useCapitals');

    document.getElementById('username-generate').addEventListener('click', runUsernameGenerate);
    document.getElementById('username-copy').addEventListener('click', () => UI.copyWithFeedback(state.username, 'نام کاربری'));
  }

  // =============================================================================
  // 3. PASSWORD GENERATOR
  // =============================================================================

  function renderPasswordDisplay() {
    const el = document.getElementById('password-result');
    if (!state.password) return;
    el.textContent = state.passwordVisible ? state.password : '•'.repeat(state.password.length);
  }

  function renderPasswordStrength() {
    const { label, score } = Generators.calculatePasswordStrength(state.password, state.passwordOptions);
    const bars = document.querySelectorAll('#strength-bars .strength__bar');
    bars.forEach((bar, i) => {
      bar.className = 'strength__bar';
      if (i < score) bar.classList.add(`is-filled-${score}`);
    });
    document.getElementById('strength-label').textContent = state.password ? label : '—';
  }

  function runPasswordGenerate(addToHistory = true) {
    const result = Generators.generatePassword(state.passwordOptions);
    if (result.error) {
      UI.toast(result.error, 'warning');
      return;
    }
    state.password = result.password;
    renderPasswordDisplay();
    renderPasswordStrength();
    if (addToHistory) Storage.addHistoryItem({ type: 'password', value: state.password });
  }

  function setupPasswordPage() {
    const lengthInput = document.getElementById('password-length');
    lengthInput.addEventListener('input', () => {
      state.passwordOptions.length = Number(lengthInput.value);
      document.getElementById('password-length-value').textContent = lengthInput.value;
    });

    const bindCheckbox = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => { state.passwordOptions[key] = el.checked; });
    };
    bindCheckbox('password-upper', 'useUpper');
    bindCheckbox('password-lower', 'useLower');
    bindCheckbox('password-numbers', 'useNumbers');
    bindCheckbox('password-symbols', 'useSymbols');
    bindCheckbox('password-exclude-ambiguous', 'excludeAmbiguous');

    document.getElementById('password-generate').addEventListener('click', runPasswordGenerate);
    document.getElementById('password-copy').addEventListener('click', () => UI.copyWithFeedback(state.password, 'رمز عبور'));

    document.getElementById('password-toggle-visibility').addEventListener('click', () => {
      state.passwordVisible = !state.passwordVisible;
      renderPasswordDisplay();
    });
  }

  // =============================================================================
  // 4. EMAIL GENERATOR
  // =============================================================================

  function runEmailGenerate(addToHistory = true) {
    const opts = { ...state.emailOptions };
    if (opts.domain === 'random') delete opts.domain;
    state.email = Generators.generateEmail(opts);
    document.getElementById('email-result').textContent = state.email;
    if (addToHistory) Storage.addHistoryItem({ type: 'email', value: state.email });
  }

  function setupEmailPage() {
    setupSegmented('email-language', (value) => { state.emailOptions.language = value; });

    document.getElementById('email-domain').addEventListener('change', (e) => {
      state.emailOptions.domain = e.target.value;
    });

    const bindCheckbox = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => { state.emailOptions[key] = el.checked; });
    };
    bindCheckbox('email-numbers', 'useNumbers');
    bindCheckbox('email-dot', 'useDot');
    bindCheckbox('email-underscore', 'useUnderscore');

    document.getElementById('email-generate').addEventListener('click', runEmailGenerate);
    document.getElementById('email-copy').addEventListener('click', () => UI.copyWithFeedback(state.email, 'ایمیل'));
  }

  // =============================================================================
  // 5. BRAND GENERATOR
  // =============================================================================

  function runBrandGenerate(addToHistory = true) {
    state.brand = Generators.generateBrandName(state.brandCategory);
    document.getElementById('brand-result').textContent = state.brand;
    document.getElementById('brand-category-label').textContent = Generators.BRAND_CATEGORIES[state.brandCategory];
    if (addToHistory) Storage.addHistoryItem({ type: 'brand', value: state.brand });
  }

  function setupBrandPage() {
    document.getElementById('brand-category').addEventListener('change', (e) => {
      state.brandCategory = e.target.value;
    });
    document.getElementById('brand-generate').addEventListener('click', runBrandGenerate);
    document.getElementById('brand-copy').addEventListener('click', () => UI.copyWithFeedback(state.brand, 'نام برند'));
  }

  // =============================================================================
  // 6. CODE GENERATOR
  // =============================================================================

  function runCodeGenerate(addToHistory = true) {
    const opts = { ...state.codeOptions, groupSize: 4 };
    // group size follows length/separator heuristics; keep consistent 4 unless preset overrides
    const result = Generators.generateCode(opts);
    if (result.error) {
      UI.toast(result.error, 'warning');
      return;
    }
    state.code = result.code;
    document.getElementById('code-result').textContent = state.code;
    if (addToHistory) Storage.addHistoryItem({ type: 'code', value: state.code });
  }

  function applyCodePreset(presetKey) {
    const preset = Generators.CODE_PRESETS[presetKey];
    if (!preset) return;
    state.codeOptions = { ...preset };

    document.getElementById('code-length').value = preset.length;
    document.getElementById('code-length-value').textContent = preset.length;
    document.getElementById('code-upper').checked = preset.useUpper;
    document.getElementById('code-lower').checked = preset.useLower;
    document.getElementById('code-numbers').checked = preset.useNumbers;
    document.getElementById('code-symbols').checked = preset.useSymbols;

    document.querySelectorAll('#code-separator button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.value === preset.separator);
    });
  }

  function setupCodePage() {
    document.getElementById('code-presets').querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#code-presets .chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        applyCodePreset(chip.dataset.preset);
        runCodeGenerate();
      });
    });

    const lengthInput = document.getElementById('code-length');
    lengthInput.addEventListener('input', () => {
      state.codeOptions.length = Number(lengthInput.value);
      document.getElementById('code-length-value').textContent = lengthInput.value;
    });

    const bindCheckbox = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => { state.codeOptions[key] = el.checked; });
    };
    bindCheckbox('code-upper', 'useUpper');
    bindCheckbox('code-lower', 'useLower');
    bindCheckbox('code-numbers', 'useNumbers');
    bindCheckbox('code-symbols', 'useSymbols');

    setupSegmented('code-separator', (value) => { state.codeOptions.separator = value; });

    document.getElementById('code-generate').addEventListener('click', runCodeGenerate);
    document.getElementById('code-copy').addEventListener('click', () => UI.copyWithFeedback(state.code, 'کد'));
  }

  // =============================================================================
  // 7. UUID GENERATOR
  // =============================================================================

  function runUUIDGenerate() {
    state.uuids = Generators.generateMultipleUUIDs(state.uuidCount);
    renderUUIDList();
    state.uuids.forEach((uuid) => Storage.addHistoryItem({ type: 'uuid', value: uuid }));
  }

  function renderUUIDList() {
    const list = document.getElementById('uuid-list');
    if (state.uuids.length === 0) {
      list.innerHTML = '<div class="uuid-item"><span class="ltr" style="color:var(--muted)">هنوز چیزی تولید نشده</span></div>';
      return;
    }
    list.innerHTML = state.uuids.map((uuid) => `<div class="uuid-item"><span class="ltr">${uuid}</span></div>`).join('');
  }

  function setupUUIDPage() {
    setupSegmented('uuid-count', (value) => { state.uuidCount = Number(value); });

    document.getElementById('uuid-generate').addEventListener('click', runUUIDGenerate);
    document.getElementById('uuid-copy').addEventListener('click', () => UI.copyWithFeedback(state.uuids.join('\n'), 'UUID'));
    document.getElementById('uuid-clear').addEventListener('click', () => {
      state.uuids = [];
      renderUUIDList();
    });

    renderUUIDList();
  }

  // =============================================================================
  // HISTORY PAGE
  // =============================================================================

  function renderHistory() {
    const container = document.getElementById('history-container');
    const items = Storage.getHistory();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/></svg></div>
          <p class="empty-state__title">هنوز چیزی در تاریخچه نیست</p>
          <p class="empty-state__desc">نتایجی که تولید می‌کنی اینجا نمایش داده می‌شوند.</p>
        </div>`;
      return;
    }

    const isLatinType = (type) => ['username', 'password', 'email', 'code', 'uuid'].includes(type);

    container.innerHTML = `<div class="history-list">${items.map((item) => `
      <div class="history-item" data-id="${item.id}">
        <span class="history-item__type">${UI.TYPE_LABELS[item.type] || item.type}</span>
        <div class="history-item__body">
          <div class="history-item__value ${isLatinType(item.type) ? 'ltr' : ''}">${escapeHtml(item.value)}</div>
          <div class="history-item__time">${UI.formatTimestamp(item.timestamp)}</div>
        </div>
        <div class="history-item__actions">
          <button class="icon-btn" data-copy="${item.id}" aria-label="کپی"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>
          <button class="icon-btn" data-delete="${item.id}" aria-label="حذف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>
        </div>
      </div>
    `).join('')}</div>`;

    container.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((i) => i.id === btn.dataset.copy);
        if (item) UI.copyWithFeedback(item.value, item.type);
      });
    });
    container.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Storage.removeHistoryItem(btn.dataset.delete);
        renderHistory();
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setupHistoryPage() {
    document.getElementById('history-clear-btn').addEventListener('click', () => {
      if (Storage.getHistory().length === 0) return;
      UI.openModal({
        title: 'پاک کردن تاریخچه',
        message: 'همهٔ موارد تاریخچه برای همیشه حذف می‌شوند. مطمئنی؟',
        confirmLabel: 'پاک کن',
        danger: true,
        onConfirm: () => {
          Storage.clearHistory();
          renderHistory();
          UI.toast('تاریخچه پاک شد', 'info');
        },
      });
    });
  }

  // =============================================================================
  // SETTINGS PAGE
  // =============================================================================

  function refreshSettingsUI() {
    const settings = Storage.getSettings();
    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.checked = radio.value === settings.theme;
    });
    document.getElementById('setting-history-size').value = String(settings.historySize);
    document.getElementById('setting-password-history').checked = settings.savePasswordHistory;
    document.getElementById('setting-animations').checked = settings.animationsEnabled;
  }

  function setupSettingsPage() {
    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const settings = Storage.getSettings();
        settings.theme = radio.value;
        Storage.saveSettings(settings);
        UI.applyTheme(radio.value);
        updateThemeIcon(radio.value);
      });
    });

    document.getElementById('setting-history-size').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.historySize = Number(e.target.value);
      Storage.saveSettings(settings);
      UI.toast('اندازهٔ تاریخچه به‌روزرسانی شد', 'success');
    });

    document.getElementById('setting-password-history').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.savePasswordHistory = e.target.checked;
      Storage.saveSettings(settings);
      if (!e.target.checked) Storage.purgePasswordHistory();
    });

    document.getElementById('setting-animations').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.animationsEnabled = e.target.checked;
      Storage.saveSettings(settings);
      UI.applyAnimationsSetting(e.target.checked);
    });

    document.getElementById('settings-clear-history').addEventListener('click', () => {
      UI.openModal({
        title: 'پاک کردن تاریخچه',
        message: 'همهٔ موارد تاریخچه برای همیشه حذف می‌شوند. مطمئنی؟',
        confirmLabel: 'پاک کن',
        danger: true,
        onConfirm: () => {
          Storage.clearHistory();
          UI.toast('تاریخچه پاک شد', 'info');
        },
      });
    });

    document.getElementById('settings-reset').addEventListener('click', () => {
      UI.openModal({
        title: 'بازنشانی تنظیمات',
        message: 'تمام تنظیمات به حالت پیش‌فرض برمی‌گردند. تاریخچه حذف نمی‌شود.',
        confirmLabel: 'بازنشانی کن',
        danger: true,
        onConfirm: () => {
          const defaults = Storage.resetSettings();
          UI.applyTheme(defaults.theme);
          UI.applyAnimationsSetting(defaults.animationsEnabled);
          updateThemeIcon(defaults.theme);
          refreshSettingsUI();
          UI.toast('تنظیمات بازنشانی شد', 'info');
        },
      });
    });

    document.getElementById('settings-clear-all').addEventListener('click', () => {
      UI.openModal({
        title: 'پاک کردن تمام داده‌ها',
        message: 'تنظیمات، تاریخچه و علاقه‌مندی‌ها برای همیشه پاک می‌شوند. این عملیات قابل بازگشت نیست.',
        confirmLabel: 'همه‌چیز را پاک کن',
        danger: true,
        onConfirm: () => {
          Storage.clearAllData();
          UI.applyTheme('system');
          UI.applyAnimationsSetting(true);
          updateThemeIcon('system');
          refreshSettingsUI();
          UI.toast('تمام داده‌ها پاک شد', 'info');
        },
      });
    });
  }

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  const PAGE_GENERATE_ACTIONS = {
    name: runNameGenerate,
    username: runUsernameGenerate,
    password: runPasswordGenerate,
    email: runEmailGenerate,
    brand: runBrandGenerate,
    code: runCodeGenerate,
    uuid: runUUIDGenerate,
  };

  const PAGE_RESULT_VALUES = () => ({
    name: state.name,
    username: state.username,
    password: state.password,
    email: state.email,
    brand: state.brand,
    code: state.code,
    uuid: state.uuids.join('\n'),
  });

  function isTypingContext(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (isTypingContext(e.target)) return;

      // Escape is handled by the modal itself when a modal is open.
      const action = PAGE_GENERATE_ACTIONS[state.activePage];

      if ((e.code === 'Space' || e.key.toLowerCase() === 'r') && action) {
        e.preventDefault();
        action();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && action) {
        const values = PAGE_RESULT_VALUES();
        const value = values[state.activePage];
        if (value) {
          e.preventDefault();
          UI.copyWithFeedback(value, PAGE_TITLES[state.activePage]);
        }
      }
    });
  }

  // =============================================================================
  // SERVICE WORKER (best-effort; skipped gracefully on file:// or unsupported browsers)
  // =============================================================================

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol === 'file:') return; // SW requires http(s)/localhost
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* silently ignore - core app still works fully without it */
      });
    });
  }

  // =============================================================================
  // INIT
  // =============================================================================

  function init() {
    UI.init();
    initTheme();
    setupNavigation();
    setupSidebar();
    setupThemeToggle();
    renderDashboard();

    setupNamePage();
    setupUsernamePage();
    setupPasswordPage();
    setupEmailPage();
    setupBrandPage();
    setupCodePage();
    setupUUIDPage();
    setupHistoryPage();
    setupSettingsPage();

    setupKeyboardShortcuts();
    registerServiceWorker();

    // Seed first results so pages don't look empty on first visit (kept out of history).
    runNameGenerate(false);
    runUsernameGenerate(false);
    runPasswordGenerate(false);
    runEmailGenerate(false);
    runBrandGenerate(false);
    runCodeGenerate(false);

    refreshSettingsUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
