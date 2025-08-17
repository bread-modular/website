'use client';

import styles from './SoundCloudEmbed.module.css';

interface Props {
  trackId: string;
}

export default function SoundCloudEmbed({ trackId }: Props) {
  if (!trackId) return null;

  // Basic sanitization: allow only digits to avoid injection
  const safeId = trackId.replace(/[^0-9]/g, '');
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    `https://api.soundcloud.com/tracks/${safeId}`
  )}&color=%23478be6&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;

  return (
    <div className={styles.scContainer}>
      <iframe
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={src}
        title="SoundCloud audio player"
      />
    </div>
  );
}
