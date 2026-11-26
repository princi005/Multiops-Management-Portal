import { Heart } from "lucide-react";

export default function PostLikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={liked} onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
        liked ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-100"
      }`}>
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      Like · {count}
    </button>
  );
}
