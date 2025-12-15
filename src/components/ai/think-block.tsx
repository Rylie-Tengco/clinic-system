"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

interface ThinkBlockProps {
  content: string;
  isStreaming?: boolean;
  messageId: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;
  if (seconds < 60) return `${seconds}.${String(remainingMs).padStart(3, "0").slice(0, 2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const ThinkContent = memo(
  ({ content }: { content: string }) => {
    return (
      <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
        {content.trim()}
      </div>
    );
  },
  (prev, next) => prev.content === next.content
);

ThinkContent.displayName = "ThinkContent";

function ThinkBlockComponent({ content, isStreaming = false, messageId }: ThinkBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoExpandedRef = useRef(false);

  useEffect(() => {
    if (isStreaming) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }

      if (!hasAutoExpandedRef.current) {
        setIsExpanded(true);
        hasAutoExpandedRef.current = true;
      }

      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (startTimeRef.current !== null) {
            setDuration(Date.now() - startTimeRef.current);
          }
        }, 100);
      }
    } else {
      if (startTimeRef.current !== null) {
        const finalDuration = Date.now() - startTimeRef.current;
        setDuration(finalDuration);
        startTimeRef.current = null;
      }

      if (!isStreaming && hasAutoExpandedRef.current) {
        setIsExpanded(false);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, messageId]);

  return (
    <div className="group/think">
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-gray-400 transition-colors hover:text-gray-600"
        >
          {isStreaming ? (
            <span className="text-sm italic animate-pulse">Thinking...</span>
          ) : (
            <span className="text-sm">Thought for {formatDuration(duration)}</span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <ChevronRight
              className={`h-3.5 w-3.5 transition-opacity ${isExpanded ? "opacity-100" : "opacity-0 group-hover/think:opacity-100"}`}
              strokeWidth={1.5}
            />
          )}
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[5000px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="border-l-2 border-gray-200 pl-3">
          <ThinkContent content={content} />
        </div>
      </div>
    </div>
  );
}

export const ThinkBlock = memo(ThinkBlockComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.messageId === nextProps.messageId
  );
});

ThinkBlock.displayName = "ThinkBlock";