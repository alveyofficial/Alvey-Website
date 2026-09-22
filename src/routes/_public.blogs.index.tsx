import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  Search,
} from "lucide-react";
import { DataStore, type BlogPost } from "@/lib/data-store";
import { seoMeta, seoLinks } from "@/lib/seo";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_public/blogs/")({
  head: () => ({
    meta: seoMeta({
      title: "Our Blog | Alvey",
      description:
        "Explore study tips, education guides, and helpful resources from Alvey.",
      path: "/blogs",
      exactTitle: true,
    }),
    links: seoLinks("/blogs"),
  }),
  component: BlogsPage,
});

const CATEGORIES = [
  "All",
  "Students",
  "Tutors",
  "Study Tips",
  "IGCSE",
  "A-Levels",
  "University Education",
];

function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    DataStore.getBlogPosts()
      .then(setPosts)
      .catch((error) => {
        console.error("Failed to load blog posts:", error);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const publishedPosts = useMemo(() => {
    return posts
      .filter((post) => post.status === "published")
      .sort((a, b) => {
        const dateA = a.publishedAt
          ? new Date(a.publishedAt).getTime()
          : 0;
        const dateB = b.publishedAt
          ? new Date(b.publishedAt).getTime()
          : 0;

        return dateB - dateA;
      });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedPosts.filter((post) => {
      const matchesCategory =
        category === "All" || post.category === category;

      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [publishedPosts, search, category]);

  const recentPosts = filteredPosts.slice(0, 6);

  const studentPosts = publishedPosts
    .filter((post) =>
      ["Students", "Study Tips", "IGCSE", "A-Levels", "University Education"].includes(
        post.category,
      ),
    )
    .slice(0, 2);

  const tutorPosts = publishedPosts
    .filter((post) => post.category === "Tutors")
    .slice(0, 2);

  return (
    <main className="flex-1 w-full">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/50 bg-[linear-gradient(180deg,#CFDFEF_0%,#F8FCFD_75%,white_100%)] dark:bg-[linear-gradient(180deg,#08131A_0%,#0D2330_75%,#111827_100%)]">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#164E5E]/10 blur-[120px] dark:bg-[#3D7F8F]/20" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-[#3D7F8F]/10 blur-[120px] dark:bg-[#6FD4D8]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#164E5E] dark:text-[#6FD4D8]">
            Alvey
          </p>

          <h1 className="mt-4 text-5xl font-extrabold tracking-tight md:text-7xl">
            Our Blog
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Ideas, study strategies, education guides, and practical advice
            for students and tutors.
          </p>

          <a
            href="#newsletter"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#164E5E] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#164E5E]/20 transition-all hover:-translate-y-0.5 hover:bg-[#3D7F8F]"
          >
            <Mail className="h-4 w-4" />
            Subscribe
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search + category controls */}
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles..."
              className="h-12 rounded-full pl-12"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === item
                    ? "bg-[#164E5E] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#164E5E] border-t-transparent" />
          </div>
        ) : publishedPosts.length === 0 ? (
          <EmptyBlogs />
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold">
              No articles match your search
            </h2>
            <p className="mt-2 text-muted-foreground">
              Try another search term or category.
            </p>
          </div>
        ) : (
          <>
            {/* Recent posts */}
            <section>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#164E5E] dark:text-[#6FD4D8]">
                    Latest
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                    Recent articles
                  </h2>
                </div>

                <span className="hidden text-sm text-muted-foreground sm:block">
                  {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "article" : "articles"}
                </span>
              </div>

              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {recentPosts.map((post) => (
                  <BlogCard key={post.$id} post={post} />
                ))}
              </div>
            </section>

            {/* Category columns */}
            {category === "All" && !search && (
              <section className="mt-20">
                <div className="grid gap-10 lg:grid-cols-2">
                  <CategorySection
                    title="For Students"
                    description="Study smarter with practical guides, revision advice, and education tips."
                    posts={studentPosts}
                  />

                  <CategorySection
                    title="For Tutors"
                    description="Resources and insights to help tutors teach, connect, and grow."
                    posts={tutorPosts}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </section>

      {/* Newsletter */}
      <section
        id="newsletter"
        className="relative mt-8 overflow-hidden bg-[#164E5E] text-white"
      >
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#6FD4D8]/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#3D7F8F]/40 blur-3xl" />

        {/* Decorative wave */}
        <div className="absolute -top-1 left-0 right-0 h-10 overflow-hidden">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="h-full w-full fill-background"
          >
            <path d="M0,20 C240,70 480,70 720,25 C960,-20 1200,0 1440,45 L1440,0 L0,0 Z" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#A8EEF0]">
            Stay in the loop
          </p>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
            Join Our Newsletter for Updates & Offers
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/75">
            Get useful education content, new articles, and Alvey updates
            delivered straight to your inbox.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="email"
                required
                placeholder="Enter your email address"
                className="h-14 rounded-xl border-0 bg-white pl-12 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              className="h-14 rounded-xl bg-[#6FD4D8] px-7 font-bold text-[#0D3945] transition-colors hover:bg-[#A8EEF0]"
            >
              Subscribe
            </button>
          </form>

          <p className="mt-4 text-xs text-white/50">
            No spam. Just useful updates from Alvey.
          </p>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/blogs/$slug"
      params={{ slug: post.slug }}
      className="group block"
    >
      <article className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#164E5E]/10">
              <BookOpen className="h-12 w-12 text-[#164E5E]/40" />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium">
            <span className="text-[#164E5E] dark:text-[#6FD4D8]">
              {post.category}
            </span>

            {post.publishedAt && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />

                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
              </>
            )}
          </div>

          <h3 className="mt-3 text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-[#164E5E] dark:group-hover:text-[#6FD4D8]">
            {post.title}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {post.content}
          </p>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>

            <span className="flex items-center gap-1 font-semibold text-[#164E5E] dark:text-[#6FD4D8]">
              Read
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function CategorySection({
  title,
  description,
  posts,
}: {
  title: string;
  description: string;
  posts: BlogPost[];
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.$id}
              to="/blogs/$slug"
              params={{ slug: post.slug }}
              className="group flex gap-4"
            >
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-36">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#164E5E]/10">
                    <BookOpen className="h-8 w-8 text-[#164E5E]/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#164E5E] dark:text-[#6FD4D8]">
                  {post.category}
                </p>

                <h3 className="mt-1 line-clamp-2 font-bold leading-tight transition-colors group-hover:text-[#164E5E] dark:group-hover:text-[#6FD4D8]">
                  {post.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {post.content}
                </p>
              </div>
            </Link>
          ))}

          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-[#164E5E] hover:underline dark:text-[#6FD4D8]"
          >
            Older Entries
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            New articles coming soon.
          </p>

          <Link
            to="/blogs"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#164E5E] hover:underline dark:text-[#6FD4D8]"
          >
            Browse all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyBlogs() {
  return (
    <div className="py-24 text-center">
      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />

      <h2 className="mt-5 text-2xl font-bold">No articles yet</h2>

      <p className="mt-2 text-muted-foreground">
        Check back soon for new articles from Alvey.
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}