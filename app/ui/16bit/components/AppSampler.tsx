"use client";
import React from "react";
import styles from "./AppSampler.module.css";

interface AppSamplerProps {
  sampleId: number;
  setSampleId: (id: number) => void;
  sampleFile: File | null;
  setSampleFile: (file: File | null) => void;
  sendSample: () => Promise<void>;
  connected: boolean;
  uploading: boolean;
}

const AppSampler: React.FC<AppSamplerProps> = ({
  sampleId,
  setSampleId,
  sampleFile,
  setSampleFile,
  sendSample,
  connected,
  uploading,
}) => {
  return (
    <div className={styles.sampleUploadContainer}>
      <h2 className={styles.sampleUploadTitle}>Upload Sample</h2>
      <div className={styles.sampleUploadControls}>
        <label htmlFor="sample-id">Sample Number:</label>
        <select
          id="sample-id"
          value={sampleId}
          onChange={e => setSampleId(Number(e.target.value))}
          disabled={!connected || uploading}
          className={styles.sampleSelect}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <input
          type="file"
          accept="audio/*,.raw"
          onChange={e => setSampleFile(e.target.files?.[0] || null)}
          disabled={!connected || uploading}
          className={styles.fileInput}
        />
        <button
          className={styles.sendButton}
          onClick={sendSample}
          disabled={!connected || !sampleFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Send Sample'}
        </button>
      </div>
      <div className={styles.sampleUploadInfo}>
        Select a sample number (0-11) and upload a file to send to the Pico.<br />
        The file will be sent as binary after issuing the <code>write-sample</code> command.
      </div>
    </div>
  );
};

export default AppSampler; 