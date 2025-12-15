import type { ParsedToolBlock } from "@/types/ai";

/**
 * Parse tool blocks from AI response content
 * Format: <tool_block><params>{"key": "value"}</params></tool_block>
 */
export function parseToolBlocks(content: string): ParsedToolBlock[] {
  const toolBlocks: ParsedToolBlock[] = [];
  const regex = /<tool_block>([\s\S]*?)<\/tool_block>/gi;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const blockContent = match[1];
    const paramsMatch = blockContent.match(/<params>([\s\S]*?)<\/params>/i);
    
    if (paramsMatch) {
      try {
        const paramsJson = paramsMatch[1].trim();
        const params = JSON.parse(paramsJson);
        const toolName = params.tool || "unknown";
        
        toolBlocks.push({
          id: crypto.randomUUID(),
          name: toolName,
          params: params,
          raw: match[0],
        });
      } catch {
        // Skip malformed JSON
        console.warn("Failed to parse tool block params:", paramsMatch[1]);
      }
    }
  }
  
  return toolBlocks;
}

/**
 * Check if content has an incomplete tool block (still streaming)
 */
export function hasIncompleteToolBlock(content: string): boolean {
  const openTags = (content.match(/<tool_block>/gi) || []).length;
  const closeTags = (content.match(/<\/tool_block>/gi) || []).length;
  return openTags > closeTags;
}

/**
 * Remove tool blocks from content for display purposes
 */
export function removeToolBlocks(content: string): string {
  return content.replace(/<tool_block>[\s\S]*?<\/tool_block>/gi, "").trim();
}

/**
 * Extract the content before the first tool block
 */
export function getContentBeforeToolBlock(content: string): string {
  const index = content.indexOf("<tool_block>");
  if (index === -1) return content;
  return content.substring(0, index).trim();
}

/**
 * Format tool result for sending back to AI
 */
export function formatToolResultForAI(
  toolName: string,
  result: { success: boolean; data?: unknown; error?: string }
): string {
  if (result.success) {
    return `[Tool Result: ${toolName}]\n${JSON.stringify(result.data, null, 2)}`;
  }
  return `[Tool Error: ${toolName}]\n${result.error || "Unknown error occurred"}`;
}