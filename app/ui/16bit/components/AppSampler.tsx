"use client";
import React, { useState } from "react";
import styles from "./AppSampler.module.css";
import Keyboard from "./Keyboard";
import SampleFX from "./SampleFX";
import { AppSamplerState } from "../page";

interface AppSamplerProps {
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

    try {
      setUploadingSample(true);
      await uploadSample(selectedKey, selectedFile);
      setUploadingSample(false);
    } catch (error) {
      console.error('Error uploading sample:', error);
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
        The sample at "C" is the default sample.<br/>
        It's not possible to upload a new one.
      </div>;
    }

    return (
      <div>
        <div>
          <div className={styles.sampleUploadControls}>
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
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className={styles.sampleContainer}>
      <div className={styles.sampleSection}>
        <h2 className={styles.sampleSubTitle}>Samples</h2>
        <div className={styles.groupLabelsContainer}>
          <div className={`${styles.groupLabel} ${styles.groupA}`}>
            Group A
          </div>
          <div className={`${styles.groupLabel} ${styles.groupB}`}>
            Group B
          </div>
        </div>
        <Keyboard 
          selectedKey={selectedKey}
          onKeyPress={handleKeySelect}
        />
        {renderUploadControls()}
      </div>
      <div className={styles.sampleSection}>
        <h2 className={styles.sampleSubTitle}>Filter</h2>
        <div className={styles.groupLabelsContainer}>
          <div className={`${styles.groupLabel} ${styles.groupA}`}>
            Group A
          </div>
          <div className={`${styles.groupLabel} ${styles.groupB}`}>
            Group B
          </div>
        </div>
        <div className={styles.filterInfoContainer}>
          <div className={styles.filterInfoGroupA}>
            <div>CV1: Highpass</div>
            <div>CV2: Lowpass</div>
          </div>
          <div className={styles.filterInfoGroupB}>
            Bypass the filter
          </div>
        </div>
      </div>
      <div className={styles.sampleSection}>
        <h2 className={styles.sampleSubTitle}>FX</h2>
        <div className={styles.groupLabelsContainer}>
          <div className={`${styles.groupLabel} ${styles.groupA}`}>
            Group A
          </div>
          <div className={`${styles.groupLabel} ${styles.groupB}`}>
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
      <div className={styles.sampleSection}>
        <h2 className={styles.sampleSubTitle}>Output</h2>
        <div className={styles.groupLabelsContainer}>
          <div className={`${styles.groupLabel} ${styles.groupA}`}>
            Group A
          </div>
          <div className={`${styles.groupLabel} ${styles.groupB}`}>
            Group B
          </div>
        </div>
        <div className={styles.filterInfoContainer}>
          <div className={styles.filterInfoGroupA}>
            A1 & A2
          </div>
          <div className={styles.filterInfoGroupB}>
            A1 & A2
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSampler; 