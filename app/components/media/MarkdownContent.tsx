'use client';

import YouTubeEmbed from './YouTubeEmbed';
import styles from './MarkdownContent.module.css';
import { useEffect } from 'react';
import useImagePreview from '../../utils/useImagePreview';
import { ModuleIO } from '@/lib/modules';

interface Props {
  content: string;
  inputs?: ModuleIO[];
  outputs?: ModuleIO[];
}

function getYouTubeData(url: string): { videoId: string; startTime?: string } {
  if (!url) return { videoId: '' };
  
  // Clean the URL - remove @ prefix if present and decode HTML entities
  url = url.trim();
  if (url.startsWith('@')) {
    url = url.substring(1);
  }
  
  // Decode HTML entities (like &#x26; back to &)
  url = url.replace(/&#x26;/g, '&').replace(/&amp;/g, '&');
  
  let videoId = '';
  let startTime: string | undefined;
  
  // Handle youtu.be links
  if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/')[1];
    const [id, params] = parts.split('?');
    videoId = id;
    
    // Extract start time from parameters
    if (params) {
      const urlParams = new URLSearchParams(params);
      const t = urlParams.get('t');
      if (t) startTime = t;
    }
  }
  
  // Handle youtube.com URLs
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
    const t = urlParams.get('t');
    if (t) startTime = t;
  }
  
  return { videoId, startTime };
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

// Function to process images with custom max-width syntax
function processImagesWithMaxWidth(html: string): string {
  // Match img tags and check for #max-width parameter in src
  return html.replace(/<img([^>]*?)src="([^"]*?)(#max-width=([^"]*?))?"\s*([^>]*?)>/g, (match, beforeSrc, imageSrc, maxWidthParam, maxWidthValue, afterSrc) => {
    if (maxWidthParam && maxWidthValue) {
      // Remove the #max-width parameter from the src
      const cleanSrc = imageSrc;
      // Add inline style for max-width
      const style = `style="max-width: ${maxWidthValue};"`;
      return `<img${beforeSrc}src="${cleanSrc}" ${style}${afterSrc}>`;
    }
    return match;
  });
}

// Function to render input/output sections
function renderIOSection(inputs?: ModuleIO[], outputs?: ModuleIO[]): string {
  if (!inputs || !outputs || (inputs.length === 0 && outputs.length === 0)) {
    return '';
  }

  let html = '<div class="io-section">';
  
  if (inputs.length > 0) {
    html += '<div class="io-group"><h2>Inputs</h2><ol class="io-list">';
    inputs.forEach((input) => {
      html += `<li class="io-item">
        <span class="io-shortname">${input.shortname}</span>
        <span class="io-description">${input.description}</span>
      </li>`;
    });
    html += '</ol></div>';
  }

  if (outputs.length > 0) {
    html += '<div class="io-group"><h2>Outputs</h2><ol class="io-list">';
    outputs.forEach((output) => {
      html += `<li class="io-item">
        <span class="io-shortname">${output.shortname}</span>
        <span class="io-description">${output.description}</span>
      </li>`;
    });
    html += '</ol></div>';
  }

  html += '</div>';
  return html;
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
      const languageLabel = language ? `<span class="${styles.languageLabel}">${language}</span>` : '';
      
      return `<div class="${styles.codeBlock}">
        <div class="${styles.codeHeader}">
          <div>${languageLabel}</div>
          <div>
            <button class="${styles.copyButton}" onclick="copyCodeToClipboard(this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
        <pre><code class="${styles.code}${languageClass}">${processedContent}</code></pre>
      </div>`;
    }
  );
  
  // Then handle triple tilde (~~~) code blocks which might not be properly converted
  // This regex finds content between ~~~ patterns
  const tildeCodeBlockRegex = /~~~(?:\s*(\w+))?\s*\n([\s\S]*?)~~~\s*\n/g;
  enhanced = enhanced.replace(
    tildeCodeBlockRegex,
    (match, language, codeContent) => {
      const languageClass = language ? ` language-${language}` : '';
      const languageLabel = language ? `<span class="${styles.languageLabel}">${language}</span>` : '';
      return `<div class="${styles.codeBlock}">
        <div class="${styles.codeHeader}">
          <div>${languageLabel}</div>
          <div>
            <button class="${styles.copyButton}" onclick="copyCodeToClipboard(this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
        <pre><code class="${styles.code}${languageClass}">${codeContent.trim()}</code></pre>
      </div>`;
    }
  );
  
  return enhanced;
}

export default function MarkdownContent({ content, inputs, outputs }: Props) {
  // Process the content to replace YouTube embeds with the component
  let processedContent = content;
  
  // Handle [io/] replacement
  const ioSectionHtml = renderIOSection(inputs, outputs);
  processedContent = processedContent.replace(/\[io\/\]/g, ioSectionHtml);
  
  // Handle [embed]URL[/embed] format
  processedContent = processedContent.replace(
    /\[embed\](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).+?)\[\/embed\]/g,
    (match, url) => {
      const { videoId, startTime } = getYouTubeData(url);
      return videoId ? `<div data-youtube-id="${videoId}" data-youtube-start="${startTime || ''}"></div>` : match;
    }
  );
  
  // Handle @URL format (for YouTube links)
  processedContent = processedContent.replace(
    /@(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).+?)(?:\s|$)/g,
    (match, url) => {
      const { videoId, startTime } = getYouTubeData(url);
      return videoId ? `<div data-youtube-id="${videoId}" data-youtube-start="${startTime || ''}"></div>` : match;
    }
  );

  // Split content into parts, separating YouTube embeds
  const parts = processedContent.split(/<div data-youtube-id="([^"]+)" data-youtube-start="([^"]*)"><\/div>/);

  // Handle image click events with the hook
  useImagePreview({
    containerSelector: `.${styles.content}`,
    dependencies: [content]
  });

  // Load Prism.js for syntax highlighting after component mounts
  useEffect(() => {
    // Add the copy code function to the window object
    if (typeof window !== 'undefined') {
      window.copyCodeToClipboard = (button) => {
        const codeBlockDiv = button.closest(`.${styles.codeBlock}`);
        if (!codeBlockDiv) return;
        
        const codeElement = codeBlockDiv.querySelector('code');
        if (!codeElement) return;
        
        const code = codeElement.textContent || '';
        
        // Function to show success feedback
        const showSuccessFeedback = () => {
          const spanElement = button.querySelector('span');
          if (!spanElement) return;
          
          const originalText = spanElement.textContent || 'Copy';
          button.classList.add(styles.copyButtonSuccess);
          spanElement.textContent = 'Copied!';
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.classList.remove(styles.copyButtonSuccess);
            const span = button.querySelector('span');
            if (span) span.textContent = originalText;
          }, 2000);
        };
        
        // Try using the Clipboard API first (modern browsers)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code)
            .then(showSuccessFeedback)
            .catch(err => {
              console.error('Clipboard API error: ', err);
              // Fall back to older method
              fallbackCopyTextToClipboard(code);
            });
        } else {
          // Fallback for browsers that don't support the Clipboard API
          fallbackCopyTextToClipboard(code);
        }
        
        // Fallback copy method using a temporary textarea element
        function fallbackCopyTextToClipboard(text: string) {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          
          // Make the textarea out of viewport
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          textArea.style.width = '2em';
          textArea.style.height = '2em';
          textArea.style.padding = '0';
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';
          textArea.style.opacity = '0';
          
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand('copy');
            if (successful) {
              showSuccessFeedback();
            } else {
              console.error('Fallback: Unable to copy');
            }
          } catch (err) {
            console.error('Fallback: Unable to copy', err);
          }
          
          document.body.removeChild(textArea);
        }
      };
    }

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
    <>
      <div className={styles.content}>
        {parts.map((part, index) => {
          if (index % 3 === 0) {
            // Process regular markdown content
            let processedPart = addHeadingIds(part);
            processedPart = processImagesWithMaxWidth(processedPart);
            processedPart = enhanceCodeBlocks(processedPart);
            return <div key={index} dangerouslySetInnerHTML={{ __html: processedPart }} />;
          } else if (index % 3 === 1) {
            // YouTube embed - part is videoId
            const videoId = part;
            const startTime = parts[index + 1]; // Next part is startTime
            return <YouTubeEmbed key={index} videoId={videoId} startTime={startTime || undefined} />;
          }
          // Skip startTime parts (index % 3 === 2) as they're handled above
          return null;
        })}
      </div>
    </>
  );
}

// Add TypeScript interface for Window with Prism
declare global {
  interface Window {
    Prism?: {
      highlightAll: () => void;
    };
    copyCodeToClipboard?: (button: HTMLButtonElement) => void;
  }
}