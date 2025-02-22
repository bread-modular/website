'use client';

import YouTubeEmbed from './YouTubeEmbed';
import styles from './MarkdownContent.module.css';

interface Props {
  content: string;
}

function getYouTubeId(url: string): string {
  // Remove any parameters after the video ID
  url = url.split('?')[0];
  
  // Extract video ID from youtu.be URLs
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1];
  }
  
  // Extract video ID from youtube.com URLs
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1].split('&')[0];
  }
  
  return '';
}

export default function MarkdownContent({ content }: Props) {
  // Process the content to replace YouTube embeds with the component
  const processedContent = content.replace(
    /\[embed\](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).+?)\[\/embed\]/g,
    (match, url) => {
      const videoId = getYouTubeId(url);
      return videoId ? `<div data-youtube-id="${videoId}"></div>` : match;
    }
  );

  // Split content into parts, separating YouTube embeds
  const parts = processedContent.split(/<div data-youtube-id="([^"]+)"><\/div>/);

  return (
    <div className={styles.content}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Regular markdown content
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        } else {
          // YouTube embed
          return <YouTubeEmbed key={index} videoId={part} />;
        }
      })}
    </div>
  );
} 