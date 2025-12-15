import { AIChat } from "@/components/ai/ai-chat";

export default function AIPage() {
  return (
    <div className="-mx-4 -mb-4 -mt-3 flex h-[calc(100dvh-2rem)] flex-col pt-8 sm:-m-6 sm:h-dvh sm:pt-0 lg:-m-8">
      <AIChat />
    </div>
  );
}