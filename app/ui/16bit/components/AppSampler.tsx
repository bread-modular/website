"use client";
import React, { useState } from "react";
import styles from "./AppSampler.module.css";
import Keyboard from "./Keyboard";
import { AppSamplerState } from "../page";

interface AppSamplerProps {
  appState: AppSamplerState;
  onKeySelect: (key: number) => void;
  uploadSample: (key: number, file: File) => Promise<void>;
}

const AppSampler: React.FC<AppSamplerProps> = ({
  appState,
  uploadSample,
  onKeySelect
}) => {

  const [selectedKey, setSelectedKey] = useState<number | undefined>(undefined);
  const [uploadingSample, setUploadingSample] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const renderUploadControls = () => {
    if (selectedKey === undefined) {
      return <div>Select a key to upload a sample.</div>;
    }

    if (selectedKey === 0) {
      return <div>
        The sample at "C" is the default sample.<br/>
        it's not possible to upload a new one.
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
    <div className={styles.sampleUploadContainer}>
      <h2 className={styles.sampleUploadTitle}>Upload Sample</h2>
      <Keyboard 
        selectedKey={selectedKey}
        onKeyPress={handleKeySelect}
      />
      {renderUploadControls()}
      
    </div>
  );
};

export default AppSampler; 