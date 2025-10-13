'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminFetch } from '@/components/admin-session-context';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from '@/lib/fieldDefaults';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

const FIELD_BASE_CONTROLS = [
  { id: 'amplitude', labelKey: 'field.amplitude', min: 30, max: 140, step: 1 },
  { id: 'waveXFrequency', labelKey: 'field.frequency.x', min: 0.05, max: 0.45, step: 0.005 },
  { id: 'waveYFrequency', labelKey: 'field.frequency.y', min: 0.05, max: 0.45, step: 0.005 },
  { id: 'swirlStrength', labelKey: 'field.swirl.strength', min: 0, max: 3, step: 0.01 },
  { id: 'swirlFrequency', labelKey: 'field.swirl.scale', min: 0.001, max: 0.02, step: 0.0005 },
  { id: 'animationSpeed', labelKey: 'field.flow.speed', min: 0.05, max: 1.2, step: 0.01 },
  { id: 'pointSize', labelKey: 'field.point.scale', min: 6, max: 32, step: 0.5 },
  { id: 'mouseInfluence', labelKey: 'field.pointer.warp', min: 0.001, max: 0.02, step: 0.0005 },
  { id: 'rippleStrength', labelKey: 'field.ripple.strength', min: 10, max: 120, step: 1 },
  { id: 'rippleSpeed', labelKey: 'field.ripple.speed', min: 120, max: 520, step: 5 },
  { id: 'rippleWidth', labelKey: 'field.ripple.width', min: 8, max: 40, step: 0.1 },
  { id: 'rippleDecay', labelKey: 'field.ripple.fade', min: 0.0005, max: 0.01, step: 0.0001 },
  { id: 'opacity', labelKey: 'field.glow', min: 0.3, max: 1, step: 0.01 },
  { id: 'brightness', labelKey: 'field.brightness', min: 0.1, max: 0.6, step: 0.01 },
  { id: 'contrast', labelKey: 'field.contrast', min: 0.6, max: 2.5, step: 0.05 },
  { id: 'fogDensity', labelKey: 'field.fog.density', min: 0.0002, max: 0.003, step: 0.0001 }
];

const FIELD_BOOLEAN_CONTROLS = [
  { id: 'autoRotate', labelKey: 'field.auto.rotate' },
  { id: 'showStats', labelKey: 'field.show.stats' }
];

const FIELD_INFLUENCE_GROUPS = [
  {
    id: 'about',
    labelKey: 'field.about.channel',
    fields: [
      { id: 'mouseInfluence', labelKey: 'field.pointer.warp', min: 0.001, max: 0.02, step: 0.0005 },
      { id: 'animationSpeed', labelKey: 'field.flow.speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'brightness', labelKey: 'field.brightness', min: 0.1, max: 0.6, step: 0.01 }
    ]
  },
  {
    id: 'projects',
    labelKey: 'field.projects.channel',
    fields: [
      { id: 'animationSpeed', labelKey: 'field.flow.speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'swirlStrength', labelKey: 'field.swirl.strength', min: 0, max: 3, step: 0.01 },
      { id: 'pointSize', labelKey: 'field.point.scale', min: 6, max: 32, step: 0.5 }
    ]
  },
  {
    id: 'content',
    labelKey: 'field.content.channel',
    fields: [
      { id: 'animationSpeed', labelKey: 'field.flow.speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'rippleWidth', labelKey: 'field.ripple.width', min: 8, max: 40, step: 0.1 },
      { id: 'contrast', labelKey: 'field.contrast', min: 0.6, max: 2.5, step: 0.05 }
    ]
  },
  {
    id: 'sounds',
    labelKey: 'field.sounds.channel',
    fields: [
      { id: 'rippleStrength', labelKey: 'field.ripple.strength', min: 10, max: 120, step: 1 },
      { id: 'rippleDecay', labelKey: 'field.ripple.fade', min: 0.0005, max: 0.01, step: 0.0001 },
      { id: 'mouseInfluence', labelKey: 'field.pointer.warp', min: 0.001, max: 0.02, step: 0.0005 }
    ]
  },
  {
    id: 'art',
    labelKey: 'field.art.channel',
    fields: [
      { id: 'rippleStrength', labelKey: 'field.ripple.strength', min: 10, max: 120, step: 1 },
      { id: 'rippleDecay', labelKey: 'field.ripple.fade', min: 0.0005, max: 0.01, step: 0.0001 },
      { id: 'mouseInfluence', labelKey: 'field.pointer.warp', min: 0.001, max: 0.02, step: 0.0005 }
    ]
  }
];

function buildDefaultFieldSettings() {
  return {
    base: { ...FIELD_DEFAULT_BASE },
    influences: Object.keys(FIELD_DEFAULT_INFLUENCES).reduce((acc, key) => {
      acc[key] = { ...FIELD_DEFAULT_INFLUENCES[key] };
      return acc;
    }, {})
  };
}

export default function FieldSettingsPage() {
  const adminFetch = useAdminFetch();
  const { language } = useLanguage();
  const [fieldSettings, setFieldSettings] = useState(null);
  const [isSavingField, setIsSavingField] = useState(false);
  const [fieldStatus, setFieldStatus] = useState('');

  const hasFieldData = useMemo(() => Boolean(fieldSettings), [fieldSettings]);

  const handleFieldBaseChange = useCallback((key, rawValue) => {
    setFieldSettings((prev) => {
      if (!prev || rawValue === '') return prev;
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) return prev;
      return {
        ...prev,
        base: {
          ...prev.base,
          [key]: numeric
        }
      };
    });
  }, []);

  const handleFieldBooleanChange = useCallback((key, value) => {
    setFieldSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        base: {
          ...prev.base,
          [key]: value
        }
      };
    });
  }, []);

  const handleFieldInfluenceChange = useCallback((section, key, rawValue) => {
    setFieldSettings((prev) => {
      if (!prev || rawValue === '') return prev;
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) return prev;
      return {
        ...prev,
        influences: {
          ...prev.influences,
          [section]: {
            ...(prev.influences?.[section] ?? {}),
            [key]: numeric
          }
        }
      };
    });
  }, []);

  const handleFieldReset = useCallback(() => {
    setFieldSettings(buildDefaultFieldSettings());
    setFieldStatus(t('field.reset.notice', language));
  }, [language]);

  const handleFieldSave = useCallback(async () => {
    if (!fieldSettings) return;
    try {
      setIsSavingField(true);
      setFieldStatus('');

      const normalizedBase = Object.entries(FIELD_DEFAULT_BASE).reduce((acc, [key, defaultValue]) => {
        const value = fieldSettings.base?.[key];
        if (typeof defaultValue === 'boolean') {
          acc[key] = typeof value === 'boolean' ? value : defaultValue;
        } else {
          acc[key] = typeof value === 'number' ? value : defaultValue;
        }
        return acc;
      }, {});

      const normalizedInfluences = Object.entries(FIELD_DEFAULT_INFLUENCES).reduce((acc, [section, defaults]) => {
        const applied = fieldSettings.influences?.[section] ?? {};
        acc[section] = Object.entries(defaults).reduce((inner, [key, defaultValue]) => {
          const value = applied[key];
          inner[key] = typeof value === 'number' ? value : defaultValue;
          return inner;
        }, {});
        return acc;
      }, {});

      const response = await adminFetch('/api/field-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base: normalizedBase, influences: normalizedInfluences })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save field settings');
      }

      setFieldSettings({
        base: { ...result.base },
        influences: Object.keys(result.influences || {}).reduce((acc, key) => {
          acc[key] = { ...result.influences[key] };
          return acc;
        }, {})
      });
      setFieldStatus(t('field.saved', language));
    } catch (error) {
      console.error(error);
      setFieldStatus(error.message);
    } finally {
      setIsSavingField(false);
    }
  }, [adminFetch, fieldSettings, language]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const response = await adminFetch('/api/field-settings', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load field settings');
        }
        if (!ignore) {
          setFieldSettings({
            base: { ...data.base },
            influences: Object.keys(data.influences || {}).reduce((acc, key) => {
              acc[key] = { ...data.influences[key] };
              return acc;
            }, {})
          });
          setFieldStatus('');
        }
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setFieldStatus(error.message);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [adminFetch]);

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>{t('field.settings.title', language)}</h1>
          <p>{t('field.settings.description', language)}</p>
        </div>
      </header>
      <section className="admin-editor-panel admin-editor-panel--field">
        {!hasFieldData ? (
          <p className="admin-loading">Loading field settings…</p>
        ) : (
          <div className="field-settings">
            <section className="field-settings__section">
              <header className="field-settings__header">
                <h2>{t('field.base.mood', language)}</h2>
                <p>{t('field.base.description', language)}</p>
              </header>
              <div className="field-settings__grid">
                {FIELD_BASE_CONTROLS.map((control) => (
                  <div key={control.id} className="admin-field field-settings__field">
                    <label htmlFor={`field-base-${control.id}`}>{t(control.labelKey, language)}</label>
                    <input
                      id={`field-base-${control.id}`}
                      type="number"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={fieldSettings.base?.[control.id] ?? ''}
                      onChange={(event) => handleFieldBaseChange(control.id, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="field-settings__toggles">
                {FIELD_BOOLEAN_CONTROLS.map((control) => (
                  <label key={control.id} className="field-toggle">
                    <input
                      type="checkbox"
                      checked={!!fieldSettings.base?.[control.id]}
                      onChange={(event) => handleFieldBooleanChange(control.id, event.target.checked)}
                    />
                    <span>{t(control.labelKey, language)}</span>
                  </label>
                ))}
              </div>
            </section>

            {FIELD_INFLUENCE_GROUPS.map((group) => (
              <section key={group.id} className="field-settings__section">
                <header className="field-settings__header">
                  <h3>{t(group.labelKey, language)}</h3>
                  <p>{t('field.overrides.description', language)}</p>
                </header>
                <div className="field-settings__grid field-settings__grid--influence">
                  {group.fields.map((control) => (
                    <div key={`${group.id}-${control.id}`} className="admin-field field-settings__field">
                      <label htmlFor={`field-${group.id}-${control.id}`}>{t(control.labelKey, language)}</label>
                      <input
                        id={`field-${group.id}-${control.id}`}
                        type="number"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={fieldSettings.influences?.[group.id]?.[control.id] ?? ''}
                        onChange={(event) => handleFieldInfluenceChange(group.id, control.id, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="admin-actions field-settings__actions">
              {fieldStatus && <span className="admin-status">{fieldStatus}</span>}
              <div className="admin-actions__buttons">
                <button type="button" className="admin-ghost" onClick={handleFieldReset}>
                  {t('field.reset.defaults', language)}
                </button>
                <button
                  type="button"
                  className="admin-primary"
                  onClick={handleFieldSave}
                  disabled={isSavingField}
                >
                  {isSavingField ? t('field.saving', language) : t('field.save.settings', language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
