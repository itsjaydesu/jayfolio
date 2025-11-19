"use client";

/* eslint-disable react/no-unknown-property */

import { useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../lib/translations";

const EFFECT_SEQUENCE = [
  'jitter',
  'swirlPulse',
  'spiralFlow',
  'riverFlow',
  'mandelbrotZoom',
  'reactionDiffusionBloom',
  'harmonicPendulum',
  'starfield'
];

export default function FieldEffectsPanel({
  activeEffectInfo,
  onFieldEffect,
  className = "",
  style = {}
}) {
  const { language } = useLanguage();

  const fieldEffectsLabel = useMemo(
    () => t('menu.field-effects', language),
    [language]
  );

  const effectLabels = useMemo(
    () => ({
      calmReset: t('effects.calmReset', language),
      jitter: t('effects.jitter', language),
      swirlPulse: t('effects.swirlPulse', language),
      spiralFlow: t('effects.spiralFlow', language),
      riverFlow: t('effects.riverFlow', language),
      mandelbrotZoom: t('effects.mandelbrotZoom', language),
      reactionDiffusionBloom: t('effects.reactionDiffusionBloom', language),
      harmonicPendulum: t('effects.harmonicPendulum', language),
      starfield: t('effects.starfield', language),
    }),
    [language]
  );

  const effectTooltips = useMemo(
    () => ({
      calmReset: t('effects.calmReset.tooltip', language),
      jitter: t('effects.jitter.tooltip', language),
      swirlPulse: t('effects.swirlPulse.tooltip', language),
      spiralFlow: t('effects.spiralFlow.tooltip', language),
      riverFlow: t('effects.riverFlow.tooltip', language),
      mandelbrotZoom: t('effects.mandelbrotZoom.tooltip', language),
      reactionDiffusionBloom: t('effects.reactionDiffusionBloom.tooltip', language),
      harmonicPendulum: t('effects.harmonicPendulum.tooltip', language),
      starfield: t('effects.starfield.tooltip', language),
    }),
    [language]
  );

  return (
    <div 
      className={`field-effects-panel ${className}`}
      style={style}
      role="menu"
      aria-label={fieldEffectsLabel}
    >
      <div className="field-effects-panel__header">
        <span className="field-effects-panel__title">{fieldEffectsLabel}</span>
        {activeEffectInfo && activeEffectInfo.name && (
          <span className="field-effects-panel__status">
            {activeEffectInfo.name}
          </span>
        )}
      </div>

      <div className="field-effects-panel__content">
        <button
          type="button"
          className={`field-effects-panel__btn field-effects-panel__btn--zen ${!activeEffectInfo ? 'is-active' : ''}`}
          onClick={() => onFieldEffect('calmReset')}
          title={effectTooltips.calmReset}
        >
          <span>{effectLabels.calmReset}</span>
        </button>

        <div className="field-effects-panel__grid">
          {EFFECT_SEQUENCE.map((effectKey) => (
            <button
              key={effectKey}
              type="button"
              className={`field-effects-panel__btn ${activeEffectInfo?.type === effectKey ? 'is-active' : ''}`}
              onClick={() => onFieldEffect(effectKey)}
              title={effectTooltips[effectKey]}
            >
              <span>{effectLabels[effectKey]}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .field-effects-panel {
          background: rgba(5, 5, 5, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          width: 300px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          color: #fff;
          font-family: var(--font-sans, sans-serif);
          animation: panelFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        @keyframes panelFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .field-effects-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.6;
        }

        .field-effects-panel__status {
          color: #64ffda;
          opacity: 1;
          font-weight: 600;
        }

        .field-effects-panel__content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-effects-panel__btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #ccc;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .field-effects-panel__btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          transform: translateY(-1px);
        }

        .field-effects-panel__btn:active {
          transform: translateY(0);
        }

        .field-effects-panel__btn.is-active {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          color: #fff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
        }

        .field-effects-panel__btn--zen {
          width: 100%;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .field-effects-panel__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .field-effects-panel__footer {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .field-effects-panel__toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 8px;
          color: #999;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .field-effects-panel__toggle:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .field-effects-panel__toggle.is-active {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .field-effects-panel__toggle-icon {
          opacity: 0.6;
          display: flex;
          align-items: center;
        }

        .field-effects-panel__toggle-status {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.5;
          letter-spacing: 0.05em;
        }

        .field-effects-panel__toggle.is-active .field-effects-panel__toggle-status {
          color: #64ffda;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
