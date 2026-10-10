import fs from "fs";
import path from "path";

const routes = [
  "my-tutors",
  "schedule",
  "lessons",
  "reviews",
  "notifications",
  "profile",
  "settings",
];

for (const route of routes) {
  const content = `import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/${route}")({
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold capitalize">${route.replace("-", " ")}</h1>
        <p className="text-muted-foreground mt-1">Manage your ${route.replace("-", " ")}.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Feature Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This feature is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(process.cwd(), "src/routes", `_authenticated.${route}.tsx`), content);
}
console.log("Created student pages.");
