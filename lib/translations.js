// Translation management system for jayfolio

export const LANGUAGE_CODES = ["en", "ja"];

export const TRANSLATIONS = {
  en: {
    // Navigation
    "nav.about": "Jay",
    "nav.projects": "Projects",
    "nav.content": "Content",
    "nav.sounds": "Sounds",
    "nav.art": "Art",
    "nav.mobile-menu-label": "Select a page",
    "nav.mobile-menu-placeholder": "Choose a destination",

    // Content Page
    "content.title": "Content & Writing",
    "content.lead":
      "Essays, blog posts, and comedy pieces exploring technology, culture, and the absurdity of modern life. Open any piece to read the full entry with embedded media and references.",
    "content.all": "All",
    "content.essays": "Essays",
    "content.blog": "Blog",
    "content.comedy": "Comedy",
    "content.empty": "No {category} entries found.",
    "content.category-count": "({count})",

    // Status messages
    "status.waiting": "Hello",
    "status.waiting-desc": "Please select a channel \nthat interests you",
    "status.mode.waiting": "waiting for your selection",
    "status.mode.active": "active",
    "status.mode.preview": "preview",

    // Projects Page
    "projects.title": "Projects",
    "projects.all": "All",
    "projects.useful-tools": "Useful Tools",
    "projects.fun": "Fun",
    "projects.events": "Events",
    "projects.startups": "Startups",
    "projects.empty": "No {category} projects found.",
    "projects.back": "Back to Projects",

    // Sounds Page
    "sounds.empty": "No sound entries yet. Upload one via the admin console.",

    // Art Page
    "art.empty": "No art entries yet. Upload one via the admin console.",

    // Admin Channel Settings
    "channel.settings.title": "Channel Copy",
    "channel.settings.description":
      "Select a channel to edit its contextual hero content.",
    "channel.about.title": "About Channel Copy",
    "channel.about.description":
      "Edit the about capsule hero, history, and studio signals.",
    "channel.projects.title": "Projects Hero Copy",
    "channel.projects.description":
      "Update the projects hero title and lead text.",
    "channel.content.title": "Content Hero Copy",
    "channel.content.description":
      "Tune the content hero headline and descriptive lead.",
    "channel.sounds.title": "Sounds Hero Copy",
    "channel.sounds.description":
      "Adjust the sounds hero headline and supporting copy.",
    "channel.art.title": "Art Hero Copy",
    "channel.art.description":
      "Curate the art hero headline with language tuned for generative studies.",

    // Field Settings (Admin)
    "field.settings.title": "Field Settings",
    "field.settings.description":
      "Adjust the dotfield baseline and per-channel overrides.",
    "field.base.mood": "Base Field Mood",
    "field.base.description": "These values load with every visit.",
    "field.amplitude": "Amplitude",
    "field.frequency.x": "Frequency X",
    "field.frequency.y": "Frequency Y",
    "field.swirl.strength": "Swirl Strength",
    "field.swirl.scale": "Swirl Scale",
    "field.flow.speed": "Flow Speed",
    "field.point.scale": "Point Scale",
    "field.pointer.warp": "Pointer Warp",
    "field.ripple.strength": "Ripple Strength",
    "field.ripple.speed": "Ripple Speed",
    "field.ripple.width": "Ripple Width",
    "field.ripple.fade": "Ripple Fade",
    "field.glow": "Glow",
    "field.brightness": "Brightness",
    "field.contrast": "Contrast",
    "field.fog.density": "Fog Density",
    "field.auto.rotate": "Auto Rotate",
    "field.show.stats": "Show Stats",
    "field.about.channel": "About Channel",
    "field.projects.channel": "Projects Channel",
    "field.content.channel": "Content Channel",
    "field.sounds.channel": "Sounds Channel",
    "field.art.channel": "Art Channel",
    "field.overrides.description":
      "Overrides applied when visitors open this channel.",
    "field.reset.defaults": "Reset Defaults",
    "field.save.settings": "Save Settings",
    "field.saving": "Saving...",
    "field.saved": "Saved",
    "field.reset.notice": "Reset to defaults (unsaved)",

    // Common
    "brand.name": "jayfolio",
    "language.switch": "Language",
    "language.toggle.tooltip.en": "Switch to Japanese",
    "language.toggle.tooltip.ja": "Switch to English",
    "language.toggle.aria.en":
      "Current language: English. Click to switch to Japanese",
    "language.toggle.aria.ja":
      "Current language: Japanese. Click to switch to English",
    "return.home": "Return Home",
    "dotfield.open": "Open dotfield",
    "edit.entry": "Edit entry",
    "back.to": "Back to {section}",
    "post.view": "View {title}",

    // Reading time and metadata
    "reading.time": "{minutes} min read",
    "published.date": "Published",
    "tags.label": "Tags",
    "admin.edit": "Edit",

    // Retro Menu
    "menu.social.aria": "Open Jay Winder's X profile",
    "menu.close": "Close",
    "menu.field-effects": "Field Effects",
    "menu.tooltip.effect-active": "{effect} active",
    "menu.tooltip.reset-timer": "Resets in {seconds}s",
    "menu.tooltip.no-auto-reset": "No auto-reset",
    "effects.calmReset": "Zen",
    "effects.calmReset.tooltip": "Reset to default state",
    "effects.jitter": "Jitter",
    "effects.jitter.tooltip": "Trigger rapid ripple bursts",
    "effects.swirlPulse": "Swirl",
    "effects.swirlPulse.tooltip": "Enhance swirl motion",
    "effects.spiralFlow": "Spiral",
    "effects.spiralFlow.tooltip": "Unfurl logarithmic spiral currents",
    "effects.riverFlow": "Quake",
    "effects.riverFlow.tooltip": "Send seismic ripples through the field",
    "effects.mandelbrotZoom": "Hop",
    "effects.mandelbrotZoom.tooltip": "Dive through a Julia set zoom",
    "effects.reactionDiffusionBloom": "Bloom",
    "effects.reactionDiffusionBloom.tooltip": "Grow Gray-Scott bloom patterns",
    "effects.harmonicPendulum": "Blink",
    "effects.harmonicPendulum.tooltip": "Trace chaotic harmonic pendulums",
    "effects.starfield": "Stars",
    "effects.starfield.tooltip": "Bloom into a drifting starfield",

    // Categories
    "category.essay": "Essay",
    "category.blog": "Blog",
    "category.comedy": "Comedy",
  },

  ja: {
    // Navigation
    "nav.about": "ジェイ",
    "nav.projects": "プロジェクト",
    "nav.content": "コンテンツ",
    "nav.sounds": "サウンド",
    "nav.art": "アート",
    "nav.mobile-menu-label": "ページを選択",
    "nav.mobile-menu-placeholder": "移動先を選択",

    // Content Page
    "content.title": "コンテンツ＆ライティング",
    "content.lead":
      "テクノロジー、文化、そして現代社会の滑稽さを探るエッセイ、ブログ、コメディ作品。開いたエントリーでは埋め込みメディアと参考文献付きで全文を読めます。",
    "content.all": "すべて",
    "content.essays": "エッセイ",
    "content.blog": "ブログ",
    "content.comedy": "コメディ",
    "content.empty": "{category}の記事が見つかりません。",
    "content.category-count": "（{count}）",

    // Projects Page
    "projects.title": "プロジェクト",
    "projects.all": "すべて",
    "projects.useful-tools": "実用ツール",
    "projects.fun": "遊び心",
    "projects.events": "イベント",
    "projects.startups": "スタートアップ",
    "projects.empty": "{category}のプロジェクトは見つかりません。",
    "projects.back": "プロジェクトに戻る",

    // Sounds Page
    "sounds.empty":
      "サウンドエントリーはまだありません。管理コンソールから追加してください。",

    // Art Page
    "art.empty":
      "アートエントリーはまだありません。管理コンソールから追加してください。",

    // Admin Channel Settings
    "channel.settings.title": "チャンネルコピー",
    "channel.settings.description":
      "編集したいチャンネルを選び、ヒーローコピーを調整します。",
    "channel.about.title": "Aboutチャンネルコピー",
    "channel.about.description":
      "Aboutのヒーロー文章、沿革、スタジオシグナルを編集します。",
    "channel.projects.title": "プロジェクトヒーローコピー",
    "channel.projects.description":
      "プロジェクトの見出しとリード文を更新します。",
    "channel.content.title": "コンテンツヒーローコピー",
    "channel.content.description": "コンテンツの見出しと紹介文を調整します。",
    "channel.sounds.title": "サウンドヒーローコピー",
    "channel.sounds.description": "サウンドの見出しと補足文を編集します。",
    "channel.art.title": "アートヒーローコピー",
    "channel.art.description":
      "ジェネラティブスタディ向けにアートの見出しを整えます。",

    // Field Settings (Admin)
    "field.settings.title": "フィールド設定",
    "field.settings.description":
      "ドットフィールドのベースラインとチャンネルごとのオーバーライドを調整します。",
    "field.base.mood": "ベースフィールドムード",
    "field.base.description": "これらの値は訪問ごとに読み込まれます。",
    "field.amplitude": "振幅",
    "field.frequency.x": "周波数 X",
    "field.frequency.y": "周波数 Y",
    "field.swirl.strength": "渦の強さ",
    "field.swirl.scale": "渦のスケール",
    "field.flow.speed": "フロースピード",
    "field.point.scale": "ポイントスケール",
    "field.pointer.warp": "ポインターワープ",
    "field.ripple.strength": "リップル強度",
    "field.ripple.speed": "リップルスピード",
    "field.ripple.width": "リップル幅",
    "field.ripple.fade": "リップルフェード",
    "field.glow": "グロー",
    "field.brightness": "明るさ",
    "field.contrast": "コントラスト",
    "field.fog.density": "フォグ密度",
    "field.auto.rotate": "自動回転",
    "field.show.stats": "統計を表示",
    "field.about.channel": "Aboutチャンネル",
    "field.projects.channel": "プロジェクトチャンネル",
    "field.content.channel": "コンテンツチャンネル",
    "field.sounds.channel": "サウンドチャンネル",
    "field.art.channel": "アートチャンネル",
    "field.overrides.description":
      "訪問者がこのチャンネルを開いたときに適用されるオーバーライド。",
    "field.reset.defaults": "デフォルトにリセット",
    "field.save.settings": "設定を保存",
    "field.saving": "保存中...",
    "field.saved": "保存済み",
    "field.reset.notice": "デフォルトにリセット（未保存）",

    // Status messages
    "status.waiting": "ようこそ",
    "status.waiting-desc": "気になるチャンネルを選択してください",
    "status.mode.waiting": "選択待ち",
    "status.mode.active": "アクティブ",
    "status.mode.preview": "プレビュー",

    // Common
    "brand.name": "ジェイフォリオ",
    "language.switch": "言語",
    "language.toggle.tooltip.en": "日本語に切り替える",
    "language.toggle.tooltip.ja": "英語に切り替える",
    "language.toggle.aria.en":
      "現在の言語: 英語。クリックすると日本語に切り替わります",
    "language.toggle.aria.ja":
      "現在の言語: 日本語。クリックすると英語に切り替わります",
    "return.home": "ホームに戻る",
    "dotfield.open": "ドットフィールドを開く",
    "edit.entry": "エントリーを編集",
    "back.to": "{section}に戻る",
    "post.view": "「{title}」を開く",

    // Reading time and metadata
    "reading.time": "約{minutes}分で読める",
    "published.date": "公開日",
    "tags.label": "タグ",
    "admin.edit": "編集",

    // Categories
    "category.essay": "エッセイ",
    "category.blog": "ブログ",
    "category.comedy": "コメディ",

    // Retro Menu
    "menu.social.aria": "Jay WinderのXプロフィールを開く",
    "menu.close": "閉じる",
    "menu.field-effects": "フィールド効果",
    "menu.tooltip.effect-active": "{effect}が稼働中",
    "menu.tooltip.reset-timer": "{seconds}秒後にリセット",
    "menu.tooltip.no-auto-reset": "自動リセットなし",
    "effects.calmReset": "禅",
    "effects.calmReset.tooltip": "初期状態にリセット",
    "effects.jitter": "ジッター",
    "effects.jitter.tooltip": "高速なリップルを発生させる",
    "effects.swirlPulse": "スワール",
    "effects.swirlPulse.tooltip": "渦の動きを強調する",
    "effects.spiralFlow": "スパイラル",
    "effects.spiralFlow.tooltip": "対数渦の流れを織りなす",
    "effects.riverFlow": "クエイク",
    "effects.riverFlow.tooltip": "フィールド全体に地震波のような揺らぎを送る",
    "effects.mandelbrotZoom": "ホップ",
    "effects.mandelbrotZoom.tooltip": "ジュリア集合のズームへ飛び込む",
    "effects.reactionDiffusionBloom": "ブルーム",
    "effects.reactionDiffusionBloom.tooltip": "グレイ・スコットの模様を育てる",
    "effects.harmonicPendulum": "ブリンク",
    "effects.harmonicPendulum.tooltip": "カオス的な振り子の軌跡を描く",
    "effects.starfield": "スターズ",
    "effects.starfield.tooltip": "漂う星雲へと変調させる",
  },
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'nav.about')
 * @param {string} language - Language code ('en' or 'ja')
 * @param {object} vars - Variables for string interpolation
 * @returns {string} Translated text
 */
export function t(key, language = "en", vars = {}) {
  const translation =
    TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"][key] || key;

  // Simple variable interpolation
  return translation.replace(/\{(\w+)\}/g, (match, varName) => {
    return vars[varName] !== undefined ? vars[varName] : match;
  });
}

/**
 * Get localized content field with fallback
 * @param {object} contentField - Content field that might be localized
 * @param {string} language - Current language
 * @returns {string} Localized content with fallback
 */
export function getLocalizedContent(contentField, language = "en") {
  if (!contentField) return "";

  if (typeof contentField === "string") {
    return contentField;
  }

  if (typeof contentField === "object") {
    if (Array.isArray(contentField)) {
      return contentField.join(", ");
    }
    return (
      contentField[language] ||
      contentField["en"] ||
      Object.values(contentField)[0] ||
      ""
    );
  }

  return "";
}

function coerceToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function getLocalizedTags(tagsField, language = "en") {
  if (!tagsField) return [];

  if (Array.isArray(tagsField)) {
    return coerceToArray(tagsField);
  }

  if (typeof tagsField === "object") {
    const raw =
      tagsField[language] ||
      (language !== "en" ? tagsField["en"] : null) ||
      Object.values(tagsField).find((value) => coerceToArray(value).length) ||
      [];
    return coerceToArray(raw);
  }

  if (typeof tagsField === "string") {
    return coerceToArray(tagsField);
  }

  return [];
}

/**
 * Check if content has Japanese translation
 * @param {object} contentField - Content field to check
 * @returns {boolean} True if Japanese translation exists
 */
export function hasJapaneseTranslation(contentField) {
  if (!contentField || typeof contentField !== "object") {
    return false;
  }

  return Boolean(contentField.ja && contentField.ja.trim());
}

/**
 * Get entry categories in Japanese
 * @param {string} category - Category name
 * @param {string} language - Current language
 * @returns {string} Localized category name
 */
export function getCategoryName(category, language = "en") {
  if (!category) return "";
  const normalized = String(category)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-");

  const categoryMap = {
    essay: {
      en: "Essay",
      ja: "エッセイ",
    },
    essays: {
      en: "Essays",
      ja: "エッセイ",
    },
    blog: {
      en: "Blog",
      ja: "ブログ",
    },
    comedy: {
      en: "Comedy",
      ja: "コメディ",
    },
    "useful-tools": {
      en: "Useful Tools",
      ja: "実用ツール",
    },
    fun: {
      en: "Fun",
      ja: "遊び心",
    },
    events: {
      en: "Events",
      ja: "イベント",
    },
    startups: {
      en: "Startups",
      ja: "スタートアップ",
    },
    all: {
      en: "All",
      ja: "すべて",
    },
    sounds: {
      en: "Sounds",
      ja: "サウンド",
    },
    art: {
      en: "Art",
      ja: "アート",
    },
  };

  return categoryMap[normalized]?.[language] || category;
}
