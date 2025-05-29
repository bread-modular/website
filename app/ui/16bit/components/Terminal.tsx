"use client";
import React from "react";
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
  return (
    <>
      <div className={styles.messageContainer}>
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
  );
};

export default Terminal; 