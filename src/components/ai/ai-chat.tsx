"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Bot, Loader2 } from "lucide-react";
import type { Message, ToolCall } from "@/types/ai";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";
import { parseToolBlocks, formatToolResultForAI } from "@/lib/tool-parser";
import { executeTool } from "@/lib/tool-executor";

const MAX_TOOL_ITERATIONS = 9999;

interface StreamResult {
  content: string;
  abortedForTool: boolean;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Detect tool block patterns in streaming content
  const detectToolBlockClose = (content: string): boolean => {
    return content.includes("</tool_block>");
  };

  const detectToolBlockStart = (content: string): boolean => {
    return content.includes("<tool_block>");
  };

  const streamAssistantResponse = async (
    conversationMessages: Array<{ role: string; content: string }>,
    assistantMessageId: string,
    onToolBlockDetected?: (content: string) => void
  ): Promise<StreamResult> => {
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: conversationMessages }),
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let fullContent = "";
    let toolBlockStarted = false;
    let abortedForTool = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "" || trimmedLine === "data: [DONE]") continue;

          if (trimmedLine.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.content) {
                fullContent += data.content;

                // Update UI with current content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );

                // Check for tool block start
                if (!toolBlockStarted && detectToolBlockStart(fullContent)) {
                  toolBlockStarted = true;
                }

                // Check for tool block close - abort stream immediately
                if (toolBlockStarted && detectToolBlockClose(fullContent)) {
                  abortedForTool = true;
                  // Cancel the reader and abort the fetch
                  await reader.cancel();
                  abortControllerRef.current?.abort();
                  
                  // Notify about tool block detection
                  if (onToolBlockDetected) {
                    onToolBlockDetected(fullContent);
                  }
                  
                  return { content: fullContent, abortedForTool: true };
                }
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      // Handle abort error gracefully
      if (error instanceof Error && error.name === "AbortError") {
        return { content: fullContent, abortedForTool };
      }
      throw error;
    }

    return { content: fullContent, abortedForTool: false };
  };

  const executeToolsAndContinue = async (
    content: string,
    assistantMessageId: string,
    conversationMessages: Array<{ role: string; content: string }>,
    iteration: number
  ): Promise<void> => {
    if (iteration >= MAX_TOOL_ITERATIONS) {
      console.warn("Max tool iterations reached");
      // Add user-visible notice to the current message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: msg.content + "\n\n---\n\n*Maximum tool iterations reached. Please send a follow-up message if you need more actions.*",
              }
            : msg
        )
      );
      return;
    }

    const toolBlocks = parseToolBlocks(content);
    if (toolBlocks.length === 0) {
      return;
    }

    // Create tool calls from parsed blocks
    const toolCalls: ToolCall[] = toolBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      params: block.params,
      status: "pending" as const,
    }));

    // Update message with pending tool calls
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? { ...msg, toolCalls }
          : msg
      )
    );

    // Execute each tool and collect results
    const toolResults: Array<{ toolCall: ToolCall; resultMessage: string }> = [];

    for (const toolCall of toolCalls) {
      // Update status to executing
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                toolCalls: msg.toolCalls?.map((tc) =>
                  tc.id === toolCall.id ? { ...tc, status: "executing" as const } : tc
                ),
              }
            : msg
        )
      );

      // Execute the tool
      const result = await executeTool(toolCall.params);

      // Update with result
      const updatedToolCall: ToolCall = {
        ...toolCall,
        status: result.success ? "success" : "error",
        result,
      };

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                toolCalls: msg.toolCalls?.map((tc) =>
                  tc.id === toolCall.id ? updatedToolCall : tc
                ),
              }
            : msg
        )
      );

      // Format result for AI
      const resultMessage = formatToolResultForAI(toolCall.name, result);
      toolResults.push({ toolCall: updatedToolCall, resultMessage });
    }

    // Send tool results back to AI as a user message
    const toolResultContent = toolResults
      .map((r) => r.resultMessage)
      .join("\n\n");

    // Build updated conversation with tool result
    const updatedConversation = [
      ...conversationMessages,
      { role: "assistant", content },
      { role: "user", content: toolResultContent },
    ];

    // Create new assistant message for continuation
    const continuationMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: continuationMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    // Stream the continuation response
    const streamResult = await streamAssistantResponse(
      updatedConversation,
      continuationMessageId
    );

    // If aborted for tool, recursively process
    if (streamResult.abortedForTool) {
      await executeToolsAndContinue(
        streamResult.content,
        continuationMessageId,
        updatedConversation,
        iteration + 1
      );
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      const conversationMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const streamResult = await streamAssistantResponse(
        conversationMessages,
        assistantMessageId
      );

      // If stream was aborted for tool execution, process tools
      if (streamResult.abortedForTool) {
        await executeToolsAndContinue(
          streamResult.content,
          assistantMessageId,
          conversationMessages,
          0
        );
      }
    } catch (_error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Healthcare AI Assistant
            </h3>
            <p className="max-w-sm text-sm text-gray-500">
              Ask me anything about patients, appointments, medical records, or FHIR healthcare standards. I can also create patient records for you.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  isStreaming={isLoading}
                />
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - 2 rows: textarea on top, circular send button bottom right */}
      <div className="shrink-0 bg-gray-50 px-4 pb-4 pt-3">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
            {/* Row 1: Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about patients, appointments, or create a new patient record..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {/* Row 2: Circular send button aligned right */}
            <div className="flex justify-end pt-1.5">
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}