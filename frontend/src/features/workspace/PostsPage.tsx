import { useMemo, useState } from "react";
import { HeartHandshake, Megaphone } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import AppButton from "../../components/ui/AppButton";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import PostComposer from "./posts/PostComposer";
import PostFilters from "./posts/PostFilters";
import PostsFeed from "./posts/PostsFeed";
import RecognitionComposer from "./posts/RecognitionComposer";
import { samplePosts } from "./posts/samplePosts";
import type { CompanyPost, PostFilter, PostVisibility } from "./posts/types";

export default function PostsPage() {
  const { data: user } = useCurrentUser();
  const [posts, setPosts] = useState<CompanyPost[]>(samplePosts);
  const [filter, setFilter] = useState<PostFilter>("all");
  const [composer, setComposer] = useState<"post" | "recognition">("post");

  const currentName = user?.full_name || user?.email || "Current user";

  const visiblePosts = useMemo(() => {
    return [...posts]
      .filter((post) => {
        if (filter === "private") return post.visibility === "private";
        if (post.visibility === "private") return false;
        if (filter === "announcements") return post.kind === "announcement";
        if (filter === "recognition") return post.kind === "recognition";
        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [posts, filter]);

  function addPost(message: string) {
    const post: CompanyPost = {
      id: String(Date.now()),
      kind: "announcement",
      visibility: "company",
      author: currentName,
      recipient: null,
      message,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      comments: [],
    };
    setPosts((items) => [post, ...items]);
    setFilter("all");
  }

  function addRecognition(input: { recipient: string; message: string; visibility: PostVisibility }) {
    const post: CompanyPost = {
      id: String(Date.now()),
      kind: "recognition",
      visibility: input.visibility,
      author: currentName,
      recipient: input.recipient,
      message: input.message,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      comments: [],
    };
    setPosts((items) => [post, ...items]);
    setFilter(input.visibility === "private" ? "private" : "recognition");
  }

  function toggleLike(postId: string) {
    setPosts((items) => items.map((post) => {
      if (post.id !== postId) return post;
      const likedByMe = !post.likedByMe;
      return { ...post, likedByMe, likes: Math.max(0, post.likes + (likedByMe ? 1 : -1)) };
    }));
  }

  function addComment(postId: string, message: string) {
    setPosts((items) => items.map((post) => post.id === postId
      ? {
          ...post,
          comments: [...post.comments, {
            id: String(Date.now()),
            author: currentName,
            message,
            createdAt: new Date().toISOString(),
          }],
        }
      : post));
  }

  return (
    <div className="min-h-screen">
      <PortalHeader title="Posts" subtitle="Company feed" email={user?.email} accent="violet" />
      <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
        <header>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">My workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Posts</h1>
          <p className="mt-2 text-sm text-slate-500">Company updates, employee interactions, and appreciation.</p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
            Frontend preview · local page state
          </span>
          <div className="flex gap-2">
            <AppButton type="button" variant={composer === "post" ? "primary" : "secondary"} onClick={() => setComposer("post")}>
              <Megaphone className="h-4 w-4" />Write a post
            </AppButton>
            <AppButton type="button" variant={composer === "recognition" ? "primary" : "secondary"} onClick={() => setComposer("recognition")}>
              <HeartHandshake className="h-4 w-4" />Give recognition
            </AppButton>
          </div>
        </div>

        <SurfaceCard>
          {composer === "post"
            ? <PostComposer onPublish={addPost} />
            : <RecognitionComposer onPublish={addRecognition} />}
        </SurfaceCard>

        <PostFilters value={filter} onChange={setFilter} />

        <PostsFeed posts={visiblePosts} onLike={toggleLike} onAddComment={addComment} />

        <aside className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-5 text-amber-950">
          Preview data is held in this page only. Private appreciation is not protected by server-side access rules in this phase.
        </aside>
      </main>
    </div>
  );
}

