import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Plus, Pencil, Save, X } from "lucide-react";
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
import { DataStore } from "@/lib/data-store";
import type { Page as SitePage } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: AdminPages,
});

function AdminPages() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    slug: "",
    content: "",
    seo_title: "",
    seo_description: "",
    status: "draft",
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const data = await DataStore.getPages();
    setPages(data);
    setLoading(false);
  };

  const openEditor = (page?: SitePage) => {
    if (page) {
      setEditing(page);
      setForm({
        id: (page.id as string) || "",
        title: (page.title as string) || "",
        slug: (page.slug as string) || "",
        content: (page.content as string) || "",
        seo_title: (page.seo_title as string) || "",
        seo_description: (page.seo_description as string) || "",
        status: (page.status as string) || "draft",
      });
    } else {
      setEditing(null);
      setForm({
        id: "",
        title: "",
        slug: "",
        content: "",
        seo_title: "",
        seo_description: "",
        status: "draft",
      });
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    await DataStore.savePage(form);
    toast.success(editing ? "Page updated" : "Page created");
    setShowEditor(false);
    loadPages();
  };

  return (
    <div>
      <PageHeader
        title="Static Pages"
        description="Manage website content pages."
        action={
          <Button className="gap-2" onClick={() => openEditor()}>
            <Plus className="h-4 w-4" /> New Page
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Pages"
          description="No content pages have been created."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{p.title as string}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{p.slug as string}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"}`}
                  >
                    {p.status as string}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(p.updated_at as string).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => openEditor(p)}
                >
                  <Pencil className="h-4 w-4" /> Edit Page
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="about"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                placeholder="Page content..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  placeholder="SEO title"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Textarea
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                rows={2}
                placeholder="Meta description for search engines"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
