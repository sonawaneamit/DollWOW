"use client";

import { Gem, Layers3, Package } from "lucide-react";
import type { ConfigurationPreset, PresetId } from "@/lib/customization/presets";
import { formatMoney } from "@/lib/utils/currency";
import styles from "./ConfigurationPresets.module.css";

const icons = { starter: Package, popular: Layers3, premium: Gem };

export function ConfigurationPresets<T extends ConfigurationPreset>({ presets, activeId, handle, currencyCode, onSelect }: {
  presets: T[];
  activeId?: PresetId;
  handle: string;
  currencyCode: string;
  onSelect: (preset: T) => void;
}) {
  return (
    <fieldset className={styles.section} data-configuration-presets>
      <legend className={styles.legend}>Choose your setup</legend>
      <div className={styles.grid}>
        {presets.map(preset => {
          const Icon = icons[preset.id];
          return (
            <div key={preset.id} className={`${styles.tile} ${styles[preset.id]}`} data-selected={activeId === preset.id}>
              <label className={styles.choice}>
                <input type="radio" name={`preset-${handle}`} value={preset.id} checked={activeId === preset.id} onChange={() => onSelect(preset)} />
                <span className={styles.copy}>
                  <span className={styles.title}>{preset.label}</span>
                  <span className={styles.description}>{preset.description}</span>
                </span>
                <Icon className={styles.art} strokeWidth={1} aria-hidden="true" />
                <strong className={styles.price}>{formatMoney(preset.totalPrice, currencyCode)}</strong>
              </label>
              <details className={styles.details}>
                <summary>Included choices</summary>
                <ul>{preset.highlights.map(label => <li key={label}>{label}</li>)}</ul>
              </details>
            </div>
          );
        })}
      </div>
      <p className={styles.note}>Before shipping, tax and checkout discounts. Factory-installed features must be chosen before production.</p>
    </fieldset>
  );
}
