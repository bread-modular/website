'use client';

import { useEffect, useRef } from 'react';
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

// Function to add IDs to heading tags for anchor links
function addHeadingIds(html: string): string {
  // Add ids to h1, h2, and h3 tags with anchor links
  return html
    .replace(/<h1>(.+?)<\/h1>/g, (match, content) => {
      const id = content.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h1 id="${id}" class="${styles.headingWithAnchor}">
        <a href="#${id}" class="${styles.headingLink}">${content}</a><a href="#${id}" class="${styles.anchorLink}" aria-hidden="true">#</a>
      </h1>`;
    })
    .replace(/<h2>(.+?)<\/h2>/g, (match, content) => {
      const id = content.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h2 id="${id}" class="${styles.headingWithAnchor}">
        <a href="#${id}" class="${styles.headingLink}">${content}</a><a href="#${id}" class="${styles.anchorLink}" aria-hidden="true">#</a>
      </h2>`;
    })
    .replace(/<h3>(.+?)<\/h3>/g, (match, content) => {
      const id = content.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h3 id="${id}" class="${styles.headingWithAnchor}">
        <a href="#${id}" class="${styles.headingLink}">${content}</a><a href="#${id}" class="${styles.anchorLink}" aria-hidden="true">#</a>
      </h3>`;
    });
}

export default function MarkdownContent({ content }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Add scroll event listener to show anchor links when headings are near the top
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = window.innerWidth <= 768;
    if (!isMobile || !contentRef.current) return;

    const handleScroll = () => {
      // Find all headings in the content
      const headings = contentRef.current?.querySelectorAll('h1, h2, h3');
      if (!headings) return;

      // Check each heading's position
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        
        // If heading is near the top of the viewport (within 200px)
        if (rect.top >= 0 && rect.top <= 200) {
          heading.classList.add(styles.headingInView);
        } else {
          heading.classList.remove(styles.headingInView);
        }
      });
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Run once on mount to check initial positions
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={styles.content} ref={contentRef}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Regular markdown content with heading IDs added
          const htmlWithIds = addHeadingIds(part);
          return <div key={index} dangerouslySetInnerHTML={{ __html: htmlWithIds }} />;
        } else {
          // YouTube embed
          return <YouTubeEmbed key={index} videoId={part} />;
        }
      })}
    </div>
  );
} 