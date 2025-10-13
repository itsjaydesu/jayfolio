# Changelog

## [Unreleased]

### Fixed
- Removed conflicting `index.html` from project root
- Moved standalone field demo to `public/field-demo.html`
- Updated `next.config.js` cache headers for new location

### Added
- `DEVELOPMENT.md` - Comprehensive development guide
- Enhanced npm scripts: `lint:fix`, `clean`, `clean:all`, `validate`
- VSCode workspace settings for consistent formatting
- VSCode extension recommendations
- Improved `.gitignore` with better organization

### Changed
- Reorganized project structure for clearer separation of concerns
- Updated development workflow documentation

---

## Previous Changes

### Multilingual Support (Japanese)
- Added full Japanese language support with automatic detection
- Created `lib/i18n.js` for language detection and management
- Created `contexts/LanguageContext.jsx` for global language state
- Created `lib/translations.js` with 90+ translation keys
- Updated all content files to multilingual format
- Added `LanguageSwitcher` component with Earth icon design
- Enhanced `index.html` (now `field-demo.html`) with animated language toggles

### Components Updated
- `app/layout.jsx` - Wrapped in LanguageProvider
- `components/SiteShell.jsx` - Added language switcher and localized navigation
- `app/content/ContentContent.jsx` - Localized categories and UI text
- `components/PostCard.jsx` - Localized category names
- `lib/contentStore.js` - Added `readLocalizedEntries()` and `readLocalizedEntry()`

### Content
- Translated 5 blog entries to Japanese
- Updated content schema: `{ en: "text", ja: "text" }`
- Maintained backward compatibility with existing slugs

### Admin
- Admin area remains English-only
- No translation needed for `/administratorrrr` routes
