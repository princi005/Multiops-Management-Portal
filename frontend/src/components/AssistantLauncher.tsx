import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AssistantLauncher() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/workspace/modules/ai-assistant")}
      aria-label="Open AI Assistant preview"
      title="AI Assistant preview"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-white shadow-xl ring-4 ring-white/80 transition hover:scale-105 hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-300"
    >
      <Bot className="h-7 w-7" aria-hidden="true" />
    </button>
  );
}