'use client';

import styles from './YouTubeEmbed.module.css';

interface Props {
  videoId: string;
  startTime?: string;
}

export default function YouTubeEmbed({ videoId, startTime }: Props) {
  // Convert timestamp to seconds if needed
  const getStartTimeInSeconds = (time: string): string => {
    // If it's already just numbers, return as is
    if (/^\d+$/.test(time)) {
      return time;
    }
    
    // Handle formats like "1m42s" or "2h30m15s"
    let totalSeconds = 0;
    const hours = time.match(/(\d+)h/);
    const minutes = time.match(/(\d+)m/);
    const seconds = time.match(/(\d+)s/);
    
    if (hours) totalSeconds += parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1]);
    
    return totalSeconds.toString();
  };

  const embedUrl = startTime 
    ? `https://www.youtube.com/embed/${videoId}?start=${getStartTimeInSeconds(startTime)}`
    : `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className={styles.videoContainer}>
      <iframe
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
} 