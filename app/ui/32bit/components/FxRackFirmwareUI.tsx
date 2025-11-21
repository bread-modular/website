"use client";

import React, { useState } from "react";
import styles from "./FxRackFirmwareUI.module.css";
import { MODE_CONFIGS, type Mode, type Bank } from "./fxrackConfig";

interface FxRackFirmwareUIProps {
  firmwareVersion?: string | null;
}

const FxRackFirmwareUI: React.FC<FxRackFirmwareUIProps> = ({ firmwareVersion }) => {
  const [mode, setMode] = useState<Mode>("delay_reverb_comb");
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const config = MODE_CONFIGS[mode];
  const bank = config.bank;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>FX Rack</h2>
        {firmwareVersion && (
          <span className={styles.version}>v{firmwareVersion}</span>
        )}
      </div>

      <div className={styles.modeSelector}>
        <label htmlFor="mode-select" className={styles.modeLabel}>SELECT MODE</label>
        <select
          id="mode-select"
          className={styles.modeSelect}
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          {Object.entries(MODE_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.caption}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.modulesContainer}>
        {/* 32bit Module */}
        <div className={styles.module32bit}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>32BIT</div>
          </div>

          <div className={styles.ioSection}>
            <div className={styles.ioColumn}>
              <div className={styles.ioLabel}>INPUT</div>
              <div className={styles.pinContainer}>
                <div 
                  className={styles.pin}
                  onMouseEnter={() => setHoveredElement("input-a1")}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className={styles.pinLabel}>A1</div>
                  <div className={styles.pinDescription}>{config.bit32.inputs.a1.label}</div>
                  {hoveredElement === "input-a1" && (
                    <div className={styles.tooltip}>
                      {config.bit32.inputs.a1.tooltip}
                    </div>
                  )}
                </div>
                <div 
                  className={styles.pin}
                  onMouseEnter={() => setHoveredElement("input-a2")}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className={styles.pinLabel}>A2</div>
                  <div className={styles.pinDescription}>{config.bit32.inputs.a2.label}</div>
                  {hoveredElement === "input-a2" && (
                    <div className={styles.tooltip}>
                      {config.bit32.inputs.a2.tooltip}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.ioColumn}>
              <div className={styles.ioLabel}>OUTPUT</div>
              <div className={styles.pinContainer}>
                <div 
                  className={styles.pin}
                  onMouseEnter={() => setHoveredElement("output-a1")}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className={styles.pinLabel}>A1</div>
                  <div className={styles.pinDescription}>{config.bit32.outputs.a1.label}</div>
                  {hoveredElement === "output-a1" && (
                    <div className={styles.tooltip}>
                      {config.bit32.outputs.a1.tooltip}
                    </div>
                  )}
                </div>
                <div 
                  className={styles.pin}
                  onMouseEnter={() => setHoveredElement("output-a2")}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className={styles.pinLabel}>A2</div>
                  <div className={styles.pinDescription}>{config.bit32.outputs.a2.label}</div>
                  {hoveredElement === "output-a2" && (
                    <div className={styles.tooltip}>
                      {config.bit32.outputs.a2.tooltip}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cvKnobsSection}>
            <div 
              className={styles.cvKnob}
              onMouseEnter={() => setHoveredElement("cv1")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.cvKnobCircle}></div>
              <div className={styles.cvKnobLabel}>
                <div className={styles.cvKnobLabelType}>CV1</div>
                <div>{config.bit32.cv1.label}</div>
              </div>
              {hoveredElement === "cv1" && (
                <div className={styles.tooltip}>
                  {config.bit32.cv1.tooltip}
                </div>
              )}
            </div>
            <div 
              className={styles.cvKnob}
              onMouseEnter={() => setHoveredElement("cv2")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.cvKnobCircle}></div>
              <div className={styles.cvKnobLabel}>
                <div className={styles.cvKnobLabelType}>CV2</div>
                <div>{config.bit32.cv2.label}</div>
              </div>
              {hoveredElement === "cv2" && (
                <div className={styles.tooltip}>
                  {config.bit32.cv2.tooltip}
                </div>
              )}
            </div>
          </div>

          <div className={styles.modeControl}>
            <div className={styles.modeControlGroup}>
              <div 
                className={styles.modeButtonContainer}
                onMouseEnter={() => setHoveredElement("mode-button")}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <div className={styles.modeButton}>
                  MODE
                </div>
                <div className={styles.modeButtonDescription}>{config.bit32.modeLabel}</div>
                {hoveredElement === "mode-button" && (
                  <div className={styles.tooltip}>
                    {config.bit32.modeTooltip}
                  </div>
                )}
              </div>
              <div 
                className={styles.ledContainer}
                onMouseEnter={() => setHoveredElement("led")}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <div className={styles.led}></div>
                <div className={styles.ledDescription}>{config.bit32.ledLabel}</div>
                {hoveredElement === "led" && (
                  <div className={styles.tooltip}>
                    {config.bit32.ledTooltip}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MCC Module */}
        <div className={styles.moduleMCC}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>MCC</div>
          </div>

          <div className={styles.mccKnobsContainer}>
            <div 
              className={styles.mccKnob}
              onMouseEnter={() => setHoveredElement("mcc-cv1")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.mccKnobCircle}></div>
              <div className={styles.mccKnobLabelContainer}>
                <div className={styles.mccKnobLabel}>CV1</div>
                <div className={styles.mccKnobDescription}>{config.mcc.cv1.label}</div>
              </div>
              {hoveredElement === "mcc-cv1" && (
                <div className={styles.tooltip}>
                  {config.mcc.cv1.tooltip}
                </div>
              )}
            </div>
            <div 
              className={styles.mccKnob}
              onMouseEnter={() => setHoveredElement("mcc-cv2")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.mccKnobCircle}></div>
              <div className={styles.mccKnobLabelContainer}>
                <div className={styles.mccKnobLabel}>CV2</div>
                <div className={styles.mccKnobDescription}>{config.mcc.cv2.label}</div>
              </div>
              {hoveredElement === "mcc-cv2" && (
                <div className={styles.tooltip}>
                  {config.mcc.cv2.tooltip}
                </div>
              )}
            </div>
            <div 
              className={styles.mccKnob}
              onMouseEnter={() => setHoveredElement("mcc-cv3")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.mccKnobCircle}></div>
              <div className={styles.mccKnobLabelContainer}>
                <div className={styles.mccKnobLabel}>CV3</div>
                <div className={styles.mccKnobDescription}>{config.mcc.cv3.label}</div>
              </div>
              {hoveredElement === "mcc-cv3" && (
                <div className={styles.tooltip}>
                  {config.mcc.cv3.tooltip}
                </div>
              )}
            </div>
            <div 
              className={styles.mccKnob}
              onMouseEnter={() => setHoveredElement("mcc-cv4")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className={styles.mccKnobCircle}></div>
              <div className={styles.mccKnobLabelContainer}>
                <div className={styles.mccKnobLabel}>CV4</div>
                <div className={styles.mccKnobDescription}>{config.mcc.cv4.label}</div>
              </div>
              {hoveredElement === "mcc-cv4" && (
                <div className={styles.tooltip}>
                  {config.mcc.cv4.tooltip}
                </div>
              )}
            </div>
          </div>

          <div className={styles.mccBankSection}>
            <div className={styles.bankLabel}>CC BANK</div>
            <div className={styles.bankBoxes}>
              {(["A", "B", "C"] as Bank[]).map((bankLetter) => (
                <div
                  key={bankLetter}
                  className={`${styles.bankBox} ${bank === bankLetter ? styles.bankBoxActive : ''}`}
                >
                  {bankLetter}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FxRackFirmwareUI;
