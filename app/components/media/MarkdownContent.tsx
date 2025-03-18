'use client';

import YouTubeEmbed from './YouTubeEmbed';
import styles from './MarkdownContent.module.css';
import { useEffect } from 'react';

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

// Enhance code blocks with syntax highlighting and better formatting
function enhanceCodeBlocks(html: string): string {
  // First handle pre/code blocks from standard markdown format
  let enhanced = html.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g, 
    (match, codeContent) => {
      // Check if there's a language identifier (like ```bash)
      const firstLine = codeContent.trim().split('\n')[0];
      let language = '';
      let processedContent = codeContent;
      
      if (firstLine && firstLine.match(/^[a-zA-Z0-9_-]+$/)) {
        language = firstLine;
        processedContent = codeContent.substring(firstLine.length).trim();
      }
      
      const languageClass = language ? ` language-${language}` : '';
      
      return `<pre class="${styles.codeBlock}"><code class="${styles.code}${languageClass}">${processedContent}</code></pre>`;
    }
  );
  
  // Then handle triple tilde (~~~) code blocks which might not be properly converted
  // This regex finds content between ~~~ patterns
  const tildeCodeBlockRegex = /~~~(?:\s*(\w+))?\s*\n([\s\S]*?)~~~\s*\n/g;
  enhanced = enhanced.replace(
    tildeCodeBlockRegex,
    (match, language, codeContent) => {
      const languageClass = language ? ` language-${language}` : '';
      return `<pre class="${styles.codeBlock}"><code class="${styles.code}${languageClass}">${codeContent.trim()}</code></pre>`;
    }
  );
  
  return enhanced;
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

  // Load Prism.js for syntax highlighting after component mounts
  useEffect(() => {
    // Check if Prism is already loaded
    if (typeof window !== 'undefined' && !window.Prism) {
      // Dynamically load Prism.js and its CSS
      const prismScript = document.createElement('script');
      prismScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      prismScript.async = true;
      
      const prismCss = document.createElement('link');
      prismCss.rel = 'stylesheet';
      prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
      
      document.head.appendChild(prismCss);
      document.body.appendChild(prismScript);
      
      // Load common language components
      const languages = ['bash', 'javascript', 'typescript', 'css', 'jsx', 'tsx', 'json', 'python'];
      languages.forEach(lang => {
        const script = document.createElement('script');
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
        script.async = true;
        document.body.appendChild(script);
      });
      
      prismScript.onload = () => {
        // Highlight all code blocks after Prism is loaded
        if (window.Prism) {
          window.Prism.highlightAll();
        }
      };
    } else if (typeof window !== 'undefined' && window.Prism) {
      // If Prism is already loaded, highlight all code blocks
      window.Prism.highlightAll();
    }
  }, []);

  return (
    <div className={styles.content}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Regular markdown content with heading IDs added and enhanced code blocks
          const htmlWithIds = addHeadingIds(part);
          const htmlWithEnhancedCode = enhanceCodeBlocks(htmlWithIds);
          return <div key={index} dangerouslySetInnerHTML={{ __html: htmlWithEnhancedCode }} />;
        } else {
          // YouTube embed
          return <YouTubeEmbed key={index} videoId={part} />;
        }
      })}
    </div>
  );
}

// Add TypeScript interface for Window with Prism
declare global {
  interface Window {
    Prism?: {
      highlightAll: () => void;
    };
  }
} 