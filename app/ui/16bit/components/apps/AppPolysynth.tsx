"use client";
import styles from "./AppPolysynth.module.css";
import common from "./AppCommon.module.css";
import { AppPolysynthState } from "../../page";
import MCC from "../common/MCC";
import CV16Bit from "../common/CV16Bit";
import { FX_LIBRARY } from "../../data/fxLibrary";

interface AppPolysynthProps {
  appState: AppPolysynthState;
  onWaveformChange?: (waveform: string) => void;
}

const AppPolysynth: React.FC<AppPolysynthProps> = ({ 
  appState, 
  onWaveformChange 
}) => {

  const handleWaveformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWaveform = event.target.value;
    onWaveformChange?.(selectedWaveform);
  };

  return (
    <div className={common.appContainer + ' ' + styles.polysynthContainer}>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Voices</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={styles.waveformSelector}>
            <label htmlFor="waveform-select" className={styles.waveformLabel}>
              Waveform:
            </label>
            <select
              id="waveform-select"
              value={appState.waveform}
              onChange={handleWaveformChange}
              className={styles.waveformDropdown}
            >
              <option value="saw">Saw</option>
              <option value="square">Square</option>
              <option value="tri">Triangle</option>
            </select>
          </div>
        </div>
        <div className={common.appGroupLabelsContainer}>
          <CV16Bit cv1="Attack" cv2="Release" title="Amp Envelope" />
        </div>
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Ladder Filter</h2>
        <MCC 
          knobs={FX_LIBRARY["ladder-filter"].knobs}
          knobDescriptions={FX_LIBRARY["ladder-filter"].knobDescriptions}
          bank="A"
          title={FX_LIBRARY["ladder-filter"].title}
        />
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Output</h2>
        <div className={common.appDualContainer}>
          <div className={common.appDualLeft}>A1: With filter</div>
          <div className={common.appDualRight}>A2: Without filter</div>
        </div>
      </div>
    </div>
  );
};

export default AppPolysynth; 