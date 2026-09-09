/**
 * generators.js
 * -----------------------------------------------------------------------
 * All random-generation logic lives here: secure random helpers, word
 * databases, and the generator functions for each tool. Nothing in this
 * file touches the network - everything runs from local JS.
 * -----------------------------------------------------------------------
 */

const Generators = (() => {
  // ---- Secure random helpers ------------------------------------------

  /**
   * Returns a random integer in [0, max) using crypto.getRandomValues
   * when available (rejection sampling to avoid modulo bias), falling
   * back to Math.random on very old browsers.
   */
  function secureRandomInt(max) {
    if (max <= 0) return 0;
    if (window.crypto && window.crypto.getRandomValues) {
      const range = 256 - (256 % max); // largest multiple of max that fits in a byte
      const bytes = new Uint8Array(1);
      let value;
      do {
        window.crypto.getRandomValues(bytes);
        value = bytes[0];
      } while (value >= range);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }

  function secureRandomItem(arr) {
    return arr[secureRandomInt(arr.length)];
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---- Word database (Persian name generator) --------------------------

  const WORDS = {
    animals: [
      'روباه', 'گربه', 'پنگوئن', 'شاهین', 'نهنگ', 'خرگوش', 'گرگ', 'جغد',
      'میمون', 'ببر', 'شیر', 'پلنگ', 'خرس', 'عقاب', 'کبوتر', 'طوطی',
      'مورچه', 'زنبور', 'قورباغه', 'اختاپوس', 'دلفین', 'کوسه', 'اسب',
      'گوزن', 'راسو', 'سنجاب', 'خفاش', 'مار', 'لاک‌پشت', 'کرگدن',
      'زرافه', 'فیل', 'یوزپلنگ', 'کانگورو', 'کوآلا', 'پاندا', 'گراز',
    ],
    food: [
      'بلوبری', 'لیمو', 'توت‌فرنگی', 'پسته', 'انبه', 'نارگیل', 'هلو',
      'انار', 'زردآلو', 'کیوی', 'آناناس', 'وانیل', 'دارچین', 'شکلات',
      'کارامل', 'عسل', 'زعفران', 'نعنا', 'زنجبیل', 'بادام', 'گردو',
      'توت', 'آلبالو', 'گیلاس', 'خربزه', 'هندوانه', 'موز', 'انجیر',
    ],
    nature: [
      'کوهستان', 'رودخانه', 'دریاچه', 'جنگل', 'صحرا', 'طوفان', 'باران',
      'برف', 'مه', 'رعد', 'آتشفشان', 'غار', 'صخره', 'ابر', 'شبنم',
      'گردباد', 'یخچال', 'دشت', 'ساحل', 'موج', 'خورشید', 'ماه', 'ستاره',
    ],
    tech: [
      'پیکسل', 'کد', 'داده', 'ربات', 'سیگنال', 'شبکه', 'مدار', 'الگوریتم',
      'سرور', 'هسته', 'باینری', 'لیزر', 'هولوگرام', 'نانو', 'کوانتوم',
      'ماتریس', 'ترمینال', 'پروتکل', 'کوکی', 'بایت',
    ],
    space: [
      'کهکشان', 'سیاره', 'شهاب', 'مدار', 'ماهواره', 'سیاه‌چاله', 'نجم',
      'اختر', 'نبولا', 'شهابسنگ', 'کاوشگر', 'فضاپیما', 'دنباله‌دار',
    ],
    objects: [
      'چتر', 'فانوس', 'قطب‌نما', 'ساعت', 'کلید', 'آینه', 'عینک', 'جعبه',
      'نقشه', 'قایق', 'کلاه', 'جوهر', 'قلم', 'کوله', 'صندوقچه', 'زنگوله',
    ],
    adjectives: [
      'سرسخت', 'دیجیتال', 'خونسرد', 'مرموز', 'فضایی', 'شبگرد', 'سایبری',
      'خندان', 'شیطون', 'سریع', 'خواب‌آلود', 'رویایی', 'آرام', 'وحشی',
      'باهوش', 'مغرور', 'شجاع', 'کنجکاو', 'شوخ', 'ساکت', 'پرانرژی',
      'اسرارآمیز', 'شیک', 'بازیگوش', 'مستقل', 'خلاق', 'قهرمان', 'افسانه‌ای',
      'کوانتومی', 'الکترونیکی', 'نامرئی', 'درخشان', 'طلایی', 'نقره‌ای',
      'یخی', 'آتشین', 'ابری', 'ستاره‌ای', 'کیهانی', 'دیوانه', 'زیرک',
      'آبی', 'بنفش', 'فیروزه‌ای', 'نارنجی', 'صورتی',
    ],
  };

  const NAME_NOUNS = [
    ...WORDS.animals,
    ...WORDS.food,
    ...WORDS.nature,
    ...WORDS.tech,
    ...WORDS.space,
    ...WORDS.objects,
  ];

  const BRAND_SYLLABLES_PREFIX = [
    'نئو', 'تک', 'سایبر', 'پیکسل', 'داده', 'نوا', 'کوانت', 'زیپ', 'وب',
    'اسمارت', 'کلاود', 'فلش', 'لوکس', 'ورتکس', 'نبولا', 'اپتی', 'بایت',
    'ماکس', 'پرو', 'اولترا',
  ];

  const BRAND_SYLLABLES_SUFFIX = [
    'ینو', 'یار', 'چی', 'اکس', 'ورا', 'یکس', 'تو', 'یفای', 'یون', 'یکا',
    'ایکس', 'وب', 'لند', 'هاب', 'زون', 'یفای', 'یا', 'رو', 'سنس',
  ];

  const BRAND_CATEGORIES = {
    brand: 'برند',
    software: 'پروژه نرم‌افزاری',
    app: 'اپلیکیشن',
    shop: 'فروشگاه',
    game: 'بازی',
    ai: 'هوش مصنوعی',
    startup: 'استارتاپ',
    tech: 'تکنولوژی',
  };

  // ---- Transliteration helpers for username / email (Persian -> Latin) --

  const FA_TO_LATIN = {
    'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j',
    'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
    'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'y', 'ء': '', '‌': '',
  };

  function transliterate(faWord) {
    return faWord
      .split('')
      .map((ch) => (FA_TO_LATIN[ch] !== undefined ? FA_TO_LATIN[ch] : ch))
      .join('');
  }

  const ENGLISH_NOUNS = [
    'fox', 'wolf', 'nova', 'pixel', 'cyber', 'blaze', 'shadow', 'comet',
    'raven', 'storm', 'orbit', 'ember', 'frost', 'quartz', 'echo', 'nebula',
    'falcon', 'drift', 'byte', 'vortex', 'zenith', 'lynx', 'aurora', 'flux',
  ];
  const ENGLISH_ADJ = [
    'silent', 'swift', 'wild', 'bright', 'dark', 'cosmic', 'crazy', 'lucky',
    'quiet', 'brave', 'clever', 'lazy', 'electric', 'golden', 'frozen',
    'hidden', 'ancient', 'neon', 'stellar', 'quantum',
  ];

  // ---- 1. Persian creative name generator --------------------------------

  function generateName() {
    const noun = secureRandomItem(NAME_NOUNS);
    const adj = secureRandomItem(WORDS.adjectives);
    return `${noun} ${adj}`;
  }

  // ---- 2. Username generator ---------------------------------------------

  function randomizeCase(word) {
    return word
      .split('')
      .map((ch) => (secureRandomInt(2) === 0 ? ch.toUpperCase() : ch.toLowerCase()))
      .join('');
  }

  function generateUsername(options) {
    const {
      language = 'fa', // 'fa' | 'en' | 'mixed'
      length = 14,
      useNumbers = false,
      useUnderscore = false,
      useDot = false,
      useHyphen = false,
      useCapitals = false,
    } = options;

    let result;

    if (language === 'fa') {
      // Persian username: keep the Persian script itself (readable), joined with a separator.
      const noun = secureRandomItem(NAME_NOUNS);
      const adj = secureRandomItem(WORDS.adjectives);
      const sep = useUnderscore ? '_' : useDot ? '.' : useHyphen ? '-' : '_';
      result = `${noun}${sep}${adj}`;
      if (useNumbers) result += sep + (secureRandomInt(90) + 10);
    } else {
      let noun;
      let adj;
      if (language === 'en') {
        noun = secureRandomItem(ENGLISH_NOUNS);
        adj = secureRandomItem(ENGLISH_ADJ);
      } else {
        // mixed: Persian word transliterated to Latin + English adjective
        noun = transliterate(secureRandomItem(NAME_NOUNS));
        adj = secureRandomItem(ENGLISH_ADJ);
      }
      if (useCapitals) {
        noun = noun.charAt(0).toUpperCase() + noun.slice(1);
        adj = adj.charAt(0).toUpperCase() + adj.slice(1);
      }
      const sep = useUnderscore ? '_' : useDot ? '.' : useHyphen ? '-' : '';
      result = `${adj}${sep}${noun}`;
      if (useNumbers) result += (sep || '') + (secureRandomInt(90) + 10);
    }

    // Enforce the requested length: trim if too long, pad with digits if too short
    // (only for latin-script results, to avoid cutting Persian words mid-character in a confusing way).
    if (result.length > length) {
      result = result.slice(0, length);
    } else if (language !== 'fa') {
      while (result.length < length - 1) {
        result += secureRandomInt(10);
      }
    }

    return result;
  }

  // ---- 3. Password generator ----------------------------------------------

  const CHAR_POOLS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_+=?',
  };

  const AMBIGUOUS_CHARS = 'Il1O0';

  function generatePassword(options) {
    const {
      length = 16,
      useUpper = true,
      useLower = true,
      useNumbers = true,
      useSymbols = false,
      excludeAmbiguous = false,
    } = options;

    const activeCategories = [];
    if (useUpper) activeCategories.push('upper');
    if (useLower) activeCategories.push('lower');
    if (useNumbers) activeCategories.push('numbers');
    if (useSymbols) activeCategories.push('symbols');

    if (activeCategories.length === 0) {
      return { password: '', error: 'حداقل یک نوع کاراکتر را انتخاب کنید.' };
    }

    const buildPool = (key) => {
      let pool = CHAR_POOLS[key];
      if (excludeAmbiguous) {
        pool = pool
          .split('')
          .filter((ch) => !AMBIGUOUS_CHARS.includes(ch))
          .join('');
      }
      return pool;
    };

    const pools = activeCategories.map(buildPool);
    const fullPool = pools.join('');

    if (fullPool.length === 0) {
      return { password: '', error: 'با این تنظیمات کاراکتری برای تولید وجود ندارد.' };
    }

    if (length < activeCategories.length) {
      return { password: '', error: 'طول رمز برای شامل‌کردن همه دسته‌های انتخابی کافی نیست.' };
    }

    const chars = [];

    // Guarantee at least one character from each selected category.
    activeCategories.forEach((cat, i) => {
      chars.push(secureRandomItem(pools[i].split('')));
    });

    // Fill the rest from the combined pool.
    while (chars.length < length) {
      chars.push(secureRandomItem(fullPool.split('')));
    }

    shuffleInPlace(chars);

    return { password: chars.join(''), error: null };
  }

  function calculatePasswordStrength(password, options) {
    if (!password) return { label: 'ضعیف', score: 0 };

    let poolSize = 0;
    if (options.useUpper) poolSize += 26;
    if (options.useLower) poolSize += 26;
    if (options.useNumbers) poolSize += 10;
    if (options.useSymbols) poolSize += CHAR_POOLS.symbols.length;
    if (poolSize === 0) poolSize = 26;

    const entropy = password.length * Math.log2(poolSize);

    let label;
    let score;
    if (entropy < 35) {
      label = 'ضعیف';
      score = 1;
    } else if (entropy < 55) {
      label = 'متوسط';
      score = 2;
    } else if (entropy < 75) {
      label = 'خوب';
      score = 3;
    } else if (entropy < 100) {
      label = 'قوی';
      score = 4;
    } else {
      label = 'بسیار قوی';
      score = 5;
    }

    return { label, score, entropy: Math.round(entropy) };
  }

  // ---- 4. Email alias generator -------------------------------------------

  const FAKE_DOMAINS = ['example.com', 'example.net', 'example.org'];

  function generateEmail(options) {
    const { language = 'en', useNumbers = true, useDot = false, useUnderscore = false, domain } = options;

    let localPart;
    if (language === 'fa') {
      const noun = transliterate(secureRandomItem(NAME_NOUNS));
      const adj = secureRandomItem(WORDS.adjectives);
      const adjLatin = transliterate(adj);
      const sep = useDot ? '.' : useUnderscore ? '_' : '';
      localPart = `${noun}${sep}${adjLatin}`.toLowerCase();
    } else if (language === 'mixed') {
      const noun = transliterate(secureRandomItem(NAME_NOUNS));
      const adj = secureRandomItem(ENGLISH_ADJ);
      const sep = useDot ? '.' : useUnderscore ? '_' : '';
      localPart = `${adj}${sep}${noun}`.toLowerCase();
    } else {
      const noun = secureRandomItem(ENGLISH_NOUNS);
      const adj = secureRandomItem(ENGLISH_ADJ);
      const sep = useDot ? '.' : useUnderscore ? '_' : '';
      localPart = `${adj}${sep}${noun}`.toLowerCase();
    }

    if (useNumbers) {
      localPart += secureRandomInt(90) + 10;
    }

    const chosenDomain = domain || secureRandomItem(FAKE_DOMAINS);
    return `${localPart}@${chosenDomain}`;
  }

  // ---- 5. Brand / project name generator ----------------------------------

  function generateBrandName(category = 'brand') {
    const prefix = secureRandomItem(BRAND_SYLLABLES_PREFIX);
    const suffix = secureRandomItem(BRAND_SYLLABLES_SUFFIX);
    return `${prefix}${suffix}`;
  }

  // ---- 6. Random code generator --------------------------------------------

  function generateCode(options) {
    const {
      length = 12,
      useUpper = true,
      useLower = false,
      useNumbers = true,
      useSymbols = false,
      separator = '-',
      groupSize = 4,
    } = options;

    let pool = '';
    if (useUpper) pool += CHAR_POOLS.upper;
    if (useLower) pool += CHAR_POOLS.lower;
    if (useNumbers) pool += CHAR_POOLS.numbers;
    if (useSymbols) pool += CHAR_POOLS.symbols;

    if (!pool) return { code: '', error: 'حداقل یک نوع کاراکتر را انتخاب کنید.' };

    const chars = [];
    for (let i = 0; i < length; i++) {
      chars.push(secureRandomItem(pool.split('')));
    }

    let raw = chars.join('');

    if (separator && groupSize > 0) {
      const groups = [];
      for (let i = 0; i < raw.length; i += groupSize) {
        groups.push(raw.slice(i, i + groupSize));
      }
      raw = groups.join(separator);
    }

    return { code: raw, error: null };
  }

  const CODE_PRESETS = {
    digits4: { length: 4, useUpper: false, useLower: false, useNumbers: true, useSymbols: false, separator: '', groupSize: 0 },
    digits6: { length: 6, useUpper: false, useLower: false, useNumbers: true, useSymbols: false, separator: '', groupSize: 0 },
    otp: { length: 6, useUpper: false, useLower: false, useNumbers: true, useSymbols: false, separator: '', groupSize: 0 },
    code8: { length: 8, useUpper: true, useLower: false, useNumbers: true, useSymbols: false, separator: '', groupSize: 0 },
    code12: { length: 12, useUpper: true, useLower: false, useNumbers: true, useSymbols: false, separator: '-', groupSize: 4 },
    licenseKey: { length: 20, useUpper: true, useLower: false, useNumbers: true, useSymbols: false, separator: '-', groupSize: 5 },
  };

  // ---- 7. UUID v4 generator -------------------------------------------------

  function generateUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    // Manual RFC4122 v4 fallback using getRandomValues.
    const bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  function generateMultipleUUIDs(count) {
    const list = [];
    for (let i = 0; i < count; i++) list.push(generateUUID());
    return list;
  }

  return {
    secureRandomInt,
    secureRandomItem,
    generateName,
    generateUsername,
    generatePassword,
    calculatePasswordStrength,
    generateEmail,
    generateBrandName,
    generateCode,
    generateUUID,
    generateMultipleUUIDs,
    CODE_PRESETS,
    BRAND_CATEGORIES,
    FAKE_DOMAINS,
    CHAR_POOLS,
  };
})();
