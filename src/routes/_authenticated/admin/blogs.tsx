import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Save,
  Star,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore, type BlogPost } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/admin/blogs")({
  component: AdminBlogs,
});

const CATEGORIES = [
  "Students",
  "Tutors",
  "Study Tips",
  "IGCSE",
  "A-Levels",
  "University Education",
];

function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    image: "",
    category: "Students",
    readTime: "5 min read",
    status: "draft" as "draft" | "scheduled" | "published",
    scheduledAt: "",
    isFeatured: false,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);

    try {
      const data = await DataStore.getBlogPosts();

      setPosts(
        [...data].sort((a, b) => {
          const dateA = new Date(a.$createdAt || 0).getTime();
          const dateB = new Date(b.$createdAt || 0).getTime();
          return dateB - dateA;
        }),
      );
    } catch (error) {
      console.error("Failed to load blog posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditing(post);

      setForm({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        image: post.image || "",
        category: post.category || "Students",
        readTime: post.readTime || "5 min read",
        status: post.status || "draft",
        scheduledAt: post.scheduledAt || "",
        isFeatured: post.isFeatured || false,
      });
    } else {
      setEditing(null);

      setForm({
        title: "",
        slug: "",
        content: "",
        image: "",
        category: "Students",
        readTime: "5 min read",
        status: "draft",
        scheduledAt: "",
        isFeatured: false,
      });
    }

    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!form.content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (!form.readTime.trim()) {
      toast.error("Read time is required");
      return;
    }

    if (form.status === "scheduled" && !form.scheduledAt) {
      toast.error("Scheduled date and time are required");
      return;
    }

    setSaving(true);

    try {
      const { data } = await appwrite.auth.getUser();

      const authorId = data.user?.id;

      if (!authorId) {
        toast.error("You must be logged in");
        return;
      }

      const authorName =
        data.user?.name ||
        data.user?.email ||
        "Alvey Team";

      const postData = {
        title: form.title.trim(),
        slug: form.slug.trim().replace(/^\/+|\/+$/g, ""),
        content: form.content,
        image: form.image.trim() || undefined,
        category: form.category,
        readTime: form.readTime.trim(),
        status: form.status,
        scheduledAt:
          form.status === "scheduled"
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
        publishedAt:
          form.status === "published"
            ? editing?.publishedAt || new Date().toISOString()
            : undefined,
        authorId,
        authorName,
        isFeatured: form.isFeatured,
      };

      if (editing?.$id) {
        await DataStore.updateBlogPost(editing.$id, postData);
        toast.success("Blog post updated");
      } else {
        await DataStore.createBlogPost(postData);
        toast.success("Blog post created");
      }

      setShowEditor(false);
      await loadPosts();
    } catch (error) {
      console.error("Failed to save blog post:", error);
      toast.error("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!post.$id) return;

    const confirmed = window.confirm(
      `Delete "${post.title}"? This cannot be undone bro`,
    );

    if (!confirmed) return;

    try {
      await DataStore.deleteBlogPost(post.$id);
      toast.success("Blog post deleted");
      await loadPosts();
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        description="Create and manage Alvey blog articles."
        action={
          <Button className="gap-2" onClick={() => openEditor()}>
            <Plus className="h-4 w-4" />
            New Blog Post
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Blog Posts"
          description="Create your first blog post to publish it on the Alvey website."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.$id}>
              <CardContent className="p-5 space-y-4">
                {post.image && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                      /blogs/{post.slug}
                    </p>
                  </div>

                  {post.isFeatured && (
                    <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted">
                    {post.category}
                  </span>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      post.status === "published"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : post.status === "scheduled"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    By {post.authorName} · {post.readTime}
                  </p>

                  {post.publishedAt && (
                    <p>
                      Published{" "}
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}

                  {post.scheduledAt && post.status === "scheduled" && (
                    <p>
                      Scheduled{" "}
                      {new Date(post.scheduledAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openEditor(post)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(post)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Blog Post" : "New Blog Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Learning should feel..."
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value })
                }
                placeholder="learning-should-feel..."
              />

              <p className="text-xs text-muted-foreground">
                Your article will be available at /blogs/{form.slug || "..."}
              </p>
            </div>

            {/* Category + Read Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>

                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Read Time</Label>

                <Input
                  value={form.readTime}
                  onChange={(e) =>
                    setForm({ ...form, readTime: e.target.value })
                  }
                  placeholder="5 min read"
                />
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Image URL</Label>

              <Input
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
                placeholder="https://..."
              />

              <p className="text-xs text-muted-foreground">
                Optional. u can add image upload support later.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>

              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                rows={16}
                placeholder="Write your article here..."
                className="resize-y"
              />

              <p className="text-xs text-muted-foreground">
                Plain text for now. Rich text can be added later.
              </p>
            </div>

            {/* Status */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>

                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      status: value as "draft" | "scheduled" | "published",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.status === "scheduled" && (
                <div className="space-y-2">
                  <Label>Schedule Date & Time</Label>

                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        scheduledAt: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Featured */}
            <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isFeatured: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />

              <div>
                <p className="font-medium text-sm">
                  Featured article
                </p>

                <p className="text-xs text-muted-foreground">
                  Show this article as the featured post on the blog page.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditor(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Saving..."
                : editing
                  ? "Update Post"
                  : "Save Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}