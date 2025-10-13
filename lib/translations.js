// Translation management system for jayfolio

export const TRANSLATIONS = {
  en: {
    // Navigation
    'nav.about': 'About',
    'nav.projects': 'Projects',
    'nav.content': 'Content',
    'nav.sounds': 'Sounds',
    'nav.art': 'Art',
    
    // Content Page
    'content.title': 'Content & Writing',
    'content.lead': 'Essays, blog posts, and comedy pieces exploring technology, culture, and the absurdity of modern life. Open any piece to read the full entry with embedded media and references.',
    'content.all': 'All',
    'content.essays': 'Essays',
    'content.blog': 'Blog',
    'content.comedy': 'Comedy',
    'content.empty': 'No {category} entries found.',
    'content.category-count': '({count})',
    
    // Status messages
    'status.waiting': 'Hello',
    'status.waiting-desc': 'Please select a channel that interests you',
    'status.active': 'active',
    'status.preview': 'preview',
    
    // Common
    'brand.name': 'jayfolio',
    'language.switch': 'Language',
    'return.home': 'Return Home',
    
    // Reading time and metadata
    'reading.time': '{minutes} min read',
    'published.date': 'Published',
    'tags.label': 'Tags',
    'admin.edit': 'Edit',
    
    // Categories
    'category.essay': 'Essay',
    'category.blog': 'Blog',
    'category.comedy': 'Comedy'
  },
  
  ja: {
    // Navigation
    'nav.about': 'について',
    'nav.projects': 'プロジェクト',
    'nav.content': 'コンテンツ',
    'nav.sounds': 'サウンド',
    'nav.art': 'アート',
    
    // Content Page
    'content.title': 'コンテンツ＆ライティング',
    'content.lead': 'テクノロジー、文化、そして現代の不条理を探求するエッセイ、ブログ、コメディ作品。どの作品を開いても、埋め込みメディアと参考文献付きで全文をお読みいただけます。',
    'content.all': 'すべて',
    'content.essays': 'エッセイ',
    'content.blog': 'ブログ',
    'content.comedy': 'コメディ',
    'content.empty': '{category}の記事が見つかりません。',
    'content.category-count': '（{count}）',
    
    // Status messages
    'status.waiting': 'こんにちは',
    'status.waiting-desc': '興味のあるチャネルを選択してください',
    'status.active': 'アクティブ',
    'status.preview': 'プレビュー',
    
    // Common
    'brand.name': 'jayfolio',
    'language.switch': '言語',
    'return.home': 'ホームに戻る',
    
    // Reading time and metadata
    'reading.time': '約{minutes}分で読める',
    'published.date': '公開日',
    'tags.label': 'タグ',
    'admin.edit': '編集',
    
    // Categories
    'category.essay': 'エッセイ',
    'category.blog': 'ブログ',
    'category.comedy': 'コメディ'
  }
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'nav.about')
 * @param {string} language - Language code ('en' or 'ja')
 * @param {object} vars - Variables for string interpolation
 * @returns {string} Translated text
 */
export function t(key, language = 'en', vars = {}) {
  const translation = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;
  
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
export function getLocalizedContent(contentField, language = 'en') {
  if (!contentField) return '';
  
  // If it's a string, return as-is (backward compatibility)
  if (typeof contentField === 'string') {
    return contentField;
  }
  
  // If it's an object with language keys, return the appropriate language
  if (typeof contentField === 'object') {
    return contentField[language] || contentField['en'] || Object.values(contentField)[0] || '';
  }
  
  return '';
}

/**
 * Check if content has Japanese translation
 * @param {object} contentField - Content field to check
 * @returns {boolean} True if Japanese translation exists
 */
export function hasJapaneseTranslation(contentField) {
  if (!contentField || typeof contentField !== 'object') {
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
export function getCategoryName(category, language = 'en') {
  const categoryMap = {
    essay: {
      en: 'Essay',
      ja: 'エッセイ'
    },
    blog: {
      en: 'Blog', 
      ja: 'ブログ'
    },
    comedy: {
      en: 'Comedy',
      ja: 'コメディ'
    }
  };
  
  return categoryMap[category.toLowerCase()]?.[language] || category;
}
