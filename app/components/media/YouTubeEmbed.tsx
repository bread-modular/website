'use client';

import styles from './YouTubeEmbed.module.css';

interface Props {
  videoId: string;
}

export default function YouTubeEmbed({ videoId }: Props) {
  return (
    <div className={styles.videoContainer}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
} 