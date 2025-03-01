'use client';

import YouTubeEmbed from './YouTubeEmbed';
import styles from './MarkdownContent.module.css';

interface Props {
  content: string;
}

function getYouTubeId(url: string): string {
  if (!url) return '';
  
  // Clean the URL - remove @ prefix if present
  url = url.trim();
  if (url.startsWith('@')) {
    url = url.substring(1);
  }
  
  // Remove any parameters after the video ID for youtu.be links
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split(/[?#]/)[0];
  }
  
  // Extract video ID from youtube.com URLs
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('v') || '';
  }
  
  return '';
}

export default function MarkdownContent({ content }: Props) {
  // Process the content to replace YouTube embeds with the component
  let processedContent = content;
  
  // Handle [embed]URL[/embed] format
  processedContent = processedContent.replace(
    /\[embed\](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).+?)\[\/embed\]/g,
    (match, url) => {
      const videoId = getYouTubeId(url);
      return videoId ? `<div data-youtube-id="${videoId}"></div>` : match;
    }
  );
  
  // Handle @URL format (for YouTube links)
  processedContent = processedContent.replace(
    /@(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).+?)(?:\s|$)/g,
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