import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import { DataStore, type BlogPost } from "@/lib/data-store";
import { seoMeta, seoLinks } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_public/blogs/$slug")({
  loader: async ({ params }) => {
    try {
      const posts = await DataStore.getBlogPosts();

      const post =
        posts.find(
          (item) =>
            item.slug === params.slug &&
            item.status === "published",
        ) ?? null;

      const relatedPosts = post
        ? posts
            .filter(
              (item) =>
                item.status === "published" &&
                item.$id !== post.$id &&
                item.category === post.category,
            )
            .slice(0, 3)
        : [];

      return { post, relatedPosts };
    } catch (error) {
      console.error("Failed to load blog post:", error);
      return { post: null, relatedPosts: [] };
    }
  },

  head: ({ loaderData, params }) => {
    const post = loaderData?.post;

    return {
      meta: seoMeta({
        title: post ? `${post.title} | Alvey` : "Blog | Alvey",
        description: post
          ? post.content.replace(/\s+/g, " ").slice(0, 160)
          : "Read educational articles and study resources from Alvey.",
        path: `/blogs/${post?.slug ?? params.slug}`,
        image: post?.image,
        exactTitle: true,
      }),
      links: seoLinks(`/blogs/${post?.slug ?? params.slug}`),
    };
  },

  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, relatedPosts } = Route.useLoaderData();

  if (!post) {
    return (
      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#164E5E]/10 text-[#164E5E] dark:bg-[#3D7F8F]/20 dark:text-[#6FD4D8]">
            <BookOpen className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight">
            Article not found
          </h1>

          <p className="mt-3 text-muted-foreground">
            This article may have been removed or is not published yet.
          </p>

          <Link
            to="/blogs"
            className="inline-flex mt-8 items-center gap-2 rounded-xl bg-[#164E5E] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#3D7F8F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt)
    : null;

  return (
    <main className="flex-1 w-full">
      {/* Article hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#CFDFEF_0%,#F8FCFD_65%,white_100%)] dark:bg-[linear-gradient(180deg,#08131A_0%,#0D2330_65%,#111827_100%)]">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#164E5E]/10 blur-[100px] dark:bg-[#3D7F8F]/20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 md:pt-12 md:pb-16">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[#164E5E] dark:hover:text-[#6FD4D8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mt-10">
            <Badge className="rounded-full bg-[#164E5E] px-4 py-1.5 text-white hover:bg-[#164E5E]">
              {post.category}
            </Badge>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight leading-[1.08] md:text-6xl">
              {post.title}
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                By {post.authorName}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />

              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>

              {publishedDate && !Number.isNaN(publishedDate.getTime()) && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />

                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {publishedDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {/* Cover image */}
        {post.image && (
          <div className="relative -mt-4 overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-xl md:-mt-8">
            <img
              src={post.image}
              alt={post.title}
              className="block w-full max-h-[600px] object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className={`${post.image ? "mt-12" : "mt-10"} mx-auto max-w-3xl`}>
          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap leading-8">
            {post.content}
          </div>
        </div>

        {/* Article footer */}
        <div className="mx-auto mt-16 max-w-3xl border-t border-border/60 pt-8">
          <Link
            to="/blogs"
            className="group inline-flex items-center gap-2 font-semibold text-[#164E5E] transition-colors hover:text-[#3D7F8F] dark:text-[#6FD4D8] dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            More articles
          </Link>
        </div>
      </article>

      {/* Related articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border/60 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#164E5E] dark:text-[#6FD4D8]">
                  Keep reading
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  More from {post.category}
                </h2>
              </div>

              <Link
                to="/blogs"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#164E5E] hover:underline dark:text-[#6FD4D8]"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.$id}
                  to="/blogs/$slug"
                  params={{ slug: relatedPost.slug }}
                  className="group"
                >
                  <article className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="aspect-video overflow-hidden bg-muted">
                      {relatedPost.image ? (
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#164E5E]/10">
                          <BookOpen className="h-12 w-12 text-[#164E5E]/40" />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-sm font-medium text-[#164E5E] dark:text-[#6FD4D8]">
                        {relatedPost.category}
                      </p>

                      <h3 className="mt-2 text-xl font-bold leading-tight transition-colors group-hover:text-[#164E5E] dark:group-hover:text-[#6FD4D8]">
                        {relatedPost.title}
                      </h3>

                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{relatedPost.readTime}</span>

                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}