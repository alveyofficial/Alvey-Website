import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/blogs")({
  component: BlogsLayout,
});

function BlogsLayout() {
  return <Outlet />;
}