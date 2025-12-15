"use client";

import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Database, Loader2 } from "lucide-react";
import { memo, useState } from "react";
import type { ToolCall } from "@/types/ai";

interface ToolBlockProps {
  toolCall: ToolCall;
  messageId: string;
}

function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusColor(status: ToolCall["status"]): string {
  switch (status) {
    case "pending":
    case "executing":
      return "text-blue-600";
    case "success":
      return "text-emerald-600";
    case "error":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function getStatusBgColor(status: ToolCall["status"]): string {
  switch (status) {
    case "pending":
    case "executing":
      return "bg-blue-50 border-blue-200";
    case "success":
      return "bg-emerald-50 border-emerald-200";
    case "error":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

function StatusIcon({ status }: { status: ToolCall["status"] }) {
  switch (status) {
    case "pending":
    case "executing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Database className="h-4 w-4 text-gray-600" />;
  }
}

function ToolBlockComponent({ toolCall, messageId: _messageId }: ToolBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasResult = toolCall.result !== undefined;
  const resultData = toolCall.result?.data;
  const resultError = toolCall.result?.error;

  return (
    <div className={`rounded-lg border ${getStatusBgColor(toolCall.status)} overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors"
      >
        <Database className="h-4 w-4 text-gray-500 shrink-0" />
        <span className={`text-sm font-medium ${getStatusColor(toolCall.status)}`}>
          {formatToolName(toolCall.name)}
        </span>
        <div className="flex-1" />
        <StatusIcon status={toolCall.status} />
        {hasResult && (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )
        )}
      </button>

      {/* Parameters summary */}
      <div className="px-3 pb-2">
        <div className="text-xs text-gray-500 font-mono bg-white/50 rounded px-2 py-1 overflow-x-auto">
          {Object.entries(toolCall.params)
            .filter(([key]) => key !== "tool")
            .map(([key, value]) => (
              <span key={key} className="inline-block mr-3">
                <span className="text-gray-400">{key}:</span>{" "}
                <span className="text-gray-700">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </span>
            ))}
        </div>
      </div>

      {/* Expandable result */}
      {hasResult && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-200/50 px-3 py-2">
            <div className="text-xs font-medium text-gray-500 mb-1">
              {toolCall.result?.success ? "Result" : "Error"}
            </div>
            {resultError ? (
              <div className="text-sm text-red-600 bg-white/50 rounded px-2 py-1">
                {resultError}
              </div>
            ) : (
              <pre className="text-xs text-gray-700 bg-white/50 rounded px-2 py-1 overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const ToolBlock = memo(ToolBlockComponent, (prevProps, nextProps) => {
  return (
    prevProps.toolCall.id === nextProps.toolCall.id &&
    prevProps.toolCall.status === nextProps.toolCall.status &&
    prevProps.messageId === nextProps.messageId
  );
});

ToolBlock.displayName = "ToolBlock";