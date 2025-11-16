"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./Terminal.module.css";
import { MessageObj } from "@/app/lib/webserial";

interface TerminalProps {
  messages: MessageObj[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  connected: boolean;
  title?: string;
}

const Terminal: React.FC<TerminalProps> = ({
  messages,
  input,
  setInput,
  sendMessage,
  connected,
  title = "16bit Console",
}) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize with default values to match server-side rendering
  const [isMinimized, setIsMinimized] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isRightSide, setIsRightSide] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Load from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem('terminal-minimized');
      const savedHeight = localStorage.getItem('terminal-height');
      const savedPosition = localStorage.getItem('terminal-right-side');
      
      if (savedMinimized !== null) {
        setIsMinimized(JSON.parse(savedMinimized));
      }
      
      if (savedHeight !== null) {
        setTerminalHeight(parseInt(savedHeight, 10));
      }
      
      // Only load saved position if it exists, otherwise keep default (left/bottom)
      if (savedPosition !== null) {
        setIsRightSide(JSON.parse(savedPosition));
      }
      
      setIsHydrated(true);
    }
  }, []);

  // Save minimized state to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('terminal-minimized', JSON.stringify(isMinimized));
    }
  }, [isMinimized, isHydrated]);

  // Save height to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('terminal-height', terminalHeight.toString());
    }
  }, [terminalHeight, isHydrated]);

  // Save position to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('terminal-right-side', JSON.stringify(isRightSide));
    }
  }, [isRightSide, isHydrated]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current && !isMinimized) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const handlePositionToggle = () => {
    setIsRightSide(!isRightSide);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    if (isRightSide) {
      resizeStartY.current = e.clientX; // Use X coordinate for horizontal resize
      resizeStartHeight.current = terminalHeight; // This will be width when right-side
    } else {
      resizeStartY.current = e.clientY;
      resizeStartHeight.current = terminalHeight;
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (isRightSide) {
        // Horizontal resizing for right-side terminal
        const deltaX = resizeStartY.current - e.clientX;
        const newWidth = Math.max(200, Math.min(600, resizeStartHeight.current + deltaX));
        setTerminalHeight(newWidth); // Store width in terminalHeight state
      } else {
        // Vertical resizing for bottom terminal
        const deltaY = resizeStartY.current - e.clientY;
        const newHeight = Math.max(80, Math.min(400, resizeStartHeight.current + deltaY));
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isRightSide]);

  if (!isHydrated) {
    return null;
  }

  return (
    <div 
      className={`${styles.terminalContainer} ${isMinimized ? styles.minimized : ''} ${isRightSide ? styles.rightSide : ''}`}
      style={{ 
        height: isMinimized ? 'auto' : (isRightSide ? '100vh' : `${terminalHeight}px`),
        width: isRightSide && !isMinimized ? `${terminalHeight}px` : undefined
      }}
    >
      {/* Resize handle */}
      {!isMinimized && (
        <div 
          className={styles.resizeHandle}
          onMouseDown={handleResizeStart}
        />
      )}
      
      {/* Header with minimize/maximize and position buttons */}
      <div className={styles.terminalHeader}>
        <span className={styles.terminalTitle}>{title}</span>
        <div className={styles.headerButtons}>
          <button 
            className={styles.positionButton}
            onClick={handlePositionToggle}
            title={isRightSide ? "Move to bottom" : "Move to right side"}
          >
            {isRightSide ? "⬇" : "➡"}
          </button>
          <button 
            className={styles.minimizeButton}
            onClick={handleMinimizeToggle}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div 
            className={styles.messageContainer} 
            ref={messageContainerRef}
            style={{ 
              height: isRightSide 
                ? 'calc(100vh - 80px)' // Full height minus header and input
                : `${terminalHeight - 80}px` // Subtract header and input row height
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  styles.message +
                  " " +
                  (msg.type === "received"
                    ? styles.received
                    : msg.type === "sent"
                    ? styles.sent
                    : msg.type === "status"
                    ? styles.status
                    : msg.type === "error"
                    ? styles.error
                    : "")
                }
              >
                {msg.message}
              </div>
            ))}
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Type a command..."
              disabled={!connected}
            />
            <button
              className={styles.sendButton}
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Export the spacing class for use in parent components
export const terminalSpacingClass = styles.terminalSpacing;

export default Terminal; 