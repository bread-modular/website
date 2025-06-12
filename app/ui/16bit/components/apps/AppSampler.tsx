"use client";
import React, { useState } from "react";
import styles from "./AppSampler.module.css";
import common from "./AppCommon.module.css";
import Keyboard from "../common/Keyboard";
import SampleFX from "../common/SampleFX";
import CV16Bit from "../common/CV16Bit";
import { AppSamplerState } from "../../page";

export interface AppSamplerProps {
  appState: AppSamplerState;
  onKeySelect: (key: number) => void;
  uploadSample: (key: number, file: File) => Promise<void>;
  onFxChange?: (fxIndex: string, fxValue: string) => Promise<void>;
}

const AppSampler: React.FC<AppSamplerProps> = ({
  appState, 
  uploadSample,
  onKeySelect,
  onFxChange
}) => {

  const [selectedKey, setSelectedKey] = useState<number | undefined>(undefined);
  const [uploadingSample, setUploadingSample] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settingFx, setSettingFx] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeySelect = (key: number) => {
    setSelectedKey(key);
    onKeySelect(key);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUploadSample = async () => {
    if (!selectedKey || !selectedFile) {
      return;
    }

    setError(null);

    try {
      setUploadingSample(true);
      await uploadSample(selectedKey, selectedFile);
      setUploadingSample(false);
    } catch (error: unknown) {
      console.error('Error uploading sample:', error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setUploadingSample(false);
    }
  };

  const handleFxChange = async (fxIndex: string, fxValue: string) => {
    if (onFxChange) {
      try {
        setSettingFx(true);
        await onFxChange(fxIndex, fxValue);
      } catch (error) {
        console.error("Error changing FX:", error);
      } finally {
        setSettingFx(false);
      }
    }
  };

  const renderUploadControls = () => {
    if (selectedKey === undefined) {
      return <div>Select a key to upload a sample.</div>;
    }

    if (selectedKey === 0) {
      return <div>
        {'The sample at "C" is the default sample. It\'s not possible to upload a new one.'}
      </div>;
    }

    return (
      <div>
        <div>
          <div className={styles.sampleUploadControls}>
            <div>
              Select a 16bit mono wavefile with 44.1kHz sample rate.
            </div>
            <input
              type="file"
              accept="audio/*,.raw"
              onChange={handleFileSelect}
              disabled={uploadingSample}
              className={styles.fileInput}
            />
            <button
              className={styles.uploadButton}
              onClick={handleUploadSample}
              disabled={!selectedFile || uploadingSample}
            >
              {uploadingSample ? 'Uploading...' : 'Upload'}
            </button>
            {error && <div className={styles.errorBox}>{error}</div>}
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className={common.appContainer + ' ' + styles.sampleContainer}>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Samples</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={`${common.appGroupLabel} ${common.appGroupLeft}`}>
            Group A
          </div>
          <div className={`${common.appGroupLabel} ${common.appGroupRight}`}>
            Group B
          </div>
        </div>
        <Keyboard 
          selectedKey={selectedKey}
          onKeyPress={handleKeySelect}
        />
        {renderUploadControls()}
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Filter</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={`${common.appGroupLabel} ${common.appGroupLeft}`}>
            Group A
          </div>
          <div className={`${common.appGroupLabel} ${common.appGroupRight}`}>
            Group B
          </div>
        </div>
        <div className={styles.filterInfoContainer}>
          <div className={styles.filterInfoGroupA}>
            <CV16Bit cv1="Highpass" cv2="Lowpass" title="Filter" />
          </div>
          <div className={styles.filterInfoGroupB}>
            <div className={styles.bypassIndicator}>
              <div className={styles.crossIcon}>✕</div>
              <div className={styles.bypassText}>Bypass the Filter</div>
            </div>
          </div>
        </div>
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>FX</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={`${common.appGroupLabel} ${common.appGroupLeft}`}>
            Group A
          </div>
          <div className={`${common.appGroupLabel} ${common.appGroupRight}`}>
            Group B
          </div>
        </div>
        <SampleFX
          fx1={appState.fx1}
          fx2={appState.fx2}
          fx3={appState.fx3}
          onFxChange={handleFxChange}
          loading={settingFx}
        />
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Output</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={`${common.appGroupLabel} ${common.appGroupLeft}`}>
            Group A
          </div>
          <div className={`${common.appGroupLabel} ${common.appGroupRight}`}>
            Group B
          </div>
        </div>
        <div className={common.appDualContainer}>
          <div className={common.appDualLeft}>
            A1 & A2
          </div>
          <div className={common.appDualRight}>
            A1 & A2
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSampler; 