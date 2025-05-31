export interface AudioFileInfo {
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth?: number;
  isValid: boolean;
  needsConversion: boolean;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext when needed
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async analyzeAudioFile(file: File): Promise<AudioFileInfo> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const info: AudioFileInfo = {
        format: this.getFileExtension(file.name),
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        bitDepth: 16, // Assume 16-bit for decoded audio
        isValid: true,
        needsConversion: audioBuffer.sampleRate !== 44100 || audioBuffer.numberOfChannels !== 1
      };

      return info;
    } catch (error) {
      console.error('Error analyzing audio file:', error);
      return {
        format: this.getFileExtension(file.name),
        duration: 0,
        sampleRate: 0,
        channels: 0,
        isValid: false,
        needsConversion: true
      };
    }
  }

  async convertToRequiredFormat(file: File, onProgress?: (progress: number) => void): Promise<File> {
    try {
      onProgress?.(10);
      
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      onProgress?.(30);

      // Create a new buffer with the target format (mono, 44.1kHz)
      const targetSampleRate = 44100;
      const targetChannels = 1;
      
      // Calculate the new length based on sample rate conversion
      const newLength = Math.floor(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate);
      const newBuffer = audioContext.createBuffer(targetChannels, newLength, targetSampleRate);
      
      onProgress?.(50);

      // Convert to mono by averaging channels if needed
      const sourceData = audioBuffer.numberOfChannels === 1 
        ? audioBuffer.getChannelData(0)
        : this.mixToMono(audioBuffer);
      
      // Resample if needed
      const resampledData = audioBuffer.sampleRate !== targetSampleRate
        ? this.resample(sourceData, audioBuffer.sampleRate, targetSampleRate)
        : sourceData;
      
      onProgress?.(70);

      // Copy the resampled data to the new buffer
      newBuffer.copyToChannel(resampledData, 0);
      
      onProgress?.(80);

      // Convert to WAV format
      const wavData = this.audioBufferToWav(newBuffer);
      
      onProgress?.(90);

      const convertedBlob = new Blob([wavData], { type: 'audio/wav' });
      const convertedFile = new File([convertedBlob], 
        file.name.replace(/\.[^/.]+$/, '.wav'), 
        { type: 'audio/wav' }
      );

      onProgress?.(100);
      return convertedFile;
    } catch (error) {
      console.error('Error converting audio file:', error);
      throw new Error('Failed to convert audio file to required format');
    }
  }

  private mixToMono(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const monoData = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let channel = 0; channel < channels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / channels;
    }
    
    return monoData;
  }

  private resample(inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
      const fraction = inputIndex - inputIndexFloor;
      
      // Linear interpolation
      outputData[i] = inputData[inputIndexFloor] * (1 - fraction) + inputData[inputIndexCeil] * fraction;
    }
    
    return outputData;
  }

  private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert float samples to 16-bit PCM
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    return buffer;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
  }

  async processAudioFile(
    file: File, 
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{ file: File; info: AudioFileInfo }> {
    // Analyze the file
    onProgress?.('Analyzing audio file...', 10);
    const info = await this.analyzeAudioFile(file);

    if (!info.isValid) {
      throw new Error(`Invalid audio file: Unable to decode audio data. Please ensure the file is a valid audio format.`);
    }

    let processedFile = file;

    // Convert if needed
    if (info.needsConversion) {
      onProgress?.('Converting to required format...', 30);
      
      processedFile = await this.convertToRequiredFormat(file, (progress) => {
        // Map conversion progress to overall progress (30-90%)
        const overallProgress = 30 + (progress * 0.6);
        onProgress?.('Converting to required format...', overallProgress);
      });
    }

    onProgress?.('Ready to upload', 100);

    return {
      file: processedFile,
      info: {
        ...info,
        needsConversion: false // After processing, no conversion is needed
      }
    };
  }
} 