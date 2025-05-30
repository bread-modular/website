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
}

const Terminal: React.FC<TerminalProps> = ({
  messages,
  input,
  setInput,
  sendMessage,
  connected,
}) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize with default values to match server-side rendering
  const [isMinimized, setIsMinimized] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(150);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Load from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem('terminal-minimized');
      const savedHeight = localStorage.getItem('terminal-height');
      
      if (savedMinimized !== null) {
        setIsMinimized(JSON.parse(savedMinimized));
      }
      
      if (savedHeight !== null) {
        setTerminalHeight(parseInt(savedHeight, 10));
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current && !isMinimized) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = terminalHeight;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(80, Math.min(400, resizeStartHeight.current + deltaY));
      setTerminalHeight(newHeight);
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
  }, [isResizing]);

  return (
    <div 
      className={`${styles.terminalContainer} ${isMinimized ? styles.minimized : ''}`}
      style={{ height: isMinimized ? 'auto' : `${terminalHeight}px` }}
    >
      {/* Resize handle */}
      {!isMinimized && (
        <div 
          className={styles.resizeHandle}
          onMouseDown={handleResizeStart}
        />
      )}
      
      {/* Header with minimize/maximize button */}
      <div className={styles.terminalHeader}>
        <span className={styles.terminalTitle}>Terminal</span>
        <button 
          className={styles.minimizeButton}
          onClick={handleMinimizeToggle}
          title={isMinimized ? "Maximize" : "Minimize"}
        >
          {isMinimized ? "▲" : "▼"}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div 
            className={styles.messageContainer} 
            ref={messageContainerRef}
            style={{ height: `${terminalHeight - 80}px` }} // Subtract header and input row height
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