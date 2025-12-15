"use client";

import { Loader2, Database } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/ai";
import { ThinkBlock } from "./think-block";
import { ToolBlock } from "./tool-block";
import { removeToolBlocks } from "@/lib/tool-parser";

interface ParsedContent {
  thinkContent: string | null;
  mainContent: string;
  isThinking: boolean;
  isStreamingToolBlock: boolean;
  streamingToolName: string | null;
}

function extractStreamingToolName(content: string): string | null {
  // Try to extract tool name from incomplete tool block
  const toolMatch = content.match(/<tool_block>[\s\S]*?"tool"\s*:\s*"([^"]+)"/i);
  return toolMatch ? toolMatch[1] : null;
}

function parseMessageContent(content: string, isStreaming: boolean): ParsedContent {
  const thinkRegex = /<think(?:ing)?>([\s\S]*?)(?:<\/think(?:ing)?>|$)/i;
  const match = content.match(thinkRegex);

  // Check if there's an incomplete tool block being streamed
  const hasOpenToolBlock = content.includes("<tool_block>");
  const hasClosedToolBlock = content.includes("</tool_block>");
  const isStreamingToolBlock = isStreaming && hasOpenToolBlock && !hasClosedToolBlock;
  
  // Extract tool name if streaming
  const streamingToolName = isStreamingToolBlock ? extractStreamingToolName(content) : null;

  // Remove incomplete tool blocks from display (only show content before <tool_block>)
  let cleanedContent = content;
  if (isStreamingToolBlock) {
    // Remove everything from <tool_block> onwards while streaming
    const toolBlockIndex = content.indexOf("<tool_block>");
    if (toolBlockIndex !== -1) {
      cleanedContent = content.substring(0, toolBlockIndex);
    }
  } else {
    // Remove completed tool blocks
    cleanedContent = removeToolBlocks(content);
  }

  if (!match) {
    return {
      thinkContent: null,
      mainContent: cleanedContent.trim(),
      isThinking: false,
      isStreamingToolBlock,
      streamingToolName,
    };
  }

  const thinkContent = match[1];
  const hasClosingTag = /<\/think(?:ing)?>/i.test(content);

  // Remove the think block from main content
  const mainContent = cleanedContent.replace(thinkRegex, "").trim();

  return {
    thinkContent,
    mainContent,
    isThinking: !hasClosingTag,
    isStreamingToolBlock,
    streamingToolName,
  };
}

function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Simple streaming indicator for tool execution
function StreamingToolIndicator({ toolName }: { toolName: string | null }) {
  const displayName = toolName ? formatToolName(toolName) : "Tool";
  
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
      <Database className="h-4 w-4 text-blue-600 shrink-0" />
      <span className="text-sm font-medium text-blue-600">
        Executing {displayName}...
      </span>
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-auto" />
    </div>
  );
}

interface AssistantMessageProps {
  message: Message;
  isStreaming: boolean;
}

export function AssistantMessage({ message, isStreaming }: AssistantMessageProps) {
  const parsed = parseMessageContent(message.content, isStreaming);

  // Show loading state when no content yet
  if (!message.content) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing...
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        {/* ThinkBlock rendered outside/before the message text */}
        {parsed.thinkContent !== null && (
          <ThinkBlock
            content={parsed.thinkContent}
            isStreaming={parsed.isThinking && isStreaming}
            messageId={message.id}
          />
        )}
        {/* Markdown rendered content - ABOVE tool blocks */}
        {parsed.mainContent && (
          <div className="prose prose-sm prose-gray max-w-none text-gray-900">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs my-2">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-1">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-600 my-2">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-3 border-gray-200" />,
              }}
            >
              {parsed.mainContent}
            </ReactMarkdown>
          </div>
        )}
        {/* Streaming tool indicator - show after text content */}
        {parsed.isStreamingToolBlock && (
          <StreamingToolIndicator toolName={parsed.streamingToolName} />
        )}
        {/* Tool blocks - rendered BELOW the assistant text */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((toolCall) => (
              <ToolBlock
                key={toolCall.id}
                toolCall={toolCall}
                messageId={message.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}