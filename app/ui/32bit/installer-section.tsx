'use client';

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export type FirmwareOption = {
  id: string;
  label: string;
  manifestUrl: string;
};

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements {
      "esp-web-install-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        manifest?: string;
      };
    }
  }
}

type FirmwareInstallerSectionProps = {
  firmwares: FirmwareOption[];
};

export default function FirmwareInstallerSection({ firmwares }: FirmwareInstallerSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (document.querySelector("script[data-esp-web-tools]")) {
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/esp-web-tools@9/dist/web/install-button.js?module";
    script.dataset.espWebTools = "true";
    document.head.appendChild(script);
  }, []);

  if (!firmwares.length) {
    return <p className={styles.sectionDescription}>No firmware bundles were found in /public/32bit.</p>;
  }

  const current = firmwares[selectedIndex];

  return (
    <div className={styles.installerSection}>
      <label htmlFor="firmware-select" className={styles.fieldLabel}>
        Firmware build
      </label>
      <select
        id="firmware-select"
        className={styles.firmwareSelect}
        value={String(selectedIndex)}
        onChange={(event) => setSelectedIndex(Number(event.target.value))}
      >
        {firmwares.map((firmware, index) => (
          <option key={firmware.id} value={index}>
            {firmware.label}
          </option>
        ))}
      </select>

      <p className={styles.manifestHint}>
        Manifest: <span>{current.manifestUrl}</span>
      </p>

      <div className={styles.installButtonWrapper}>
        <esp-web-install-button manifest={current.manifestUrl}></esp-web-install-button>
      </div>
    </div>
  );
}
