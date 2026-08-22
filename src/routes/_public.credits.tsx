import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore, type Credit } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_public/credits")({
    component: CreditsPage,
});
function renderContribution(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    {part}
                </a>
            );
        }

        return part;
    });
}
function CreditsPage() {
    const [credits, setCredits] = useState<Credit[]>([]);
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState<Credit | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        name: "",
        role: "",
        contribution: "",
        order: 0,
    });

    async function loadCredits() {
        const data = await DataStore.getCredits();

        const sorted = [...data].sort(
            (a, b) => a.order - b.order
        );

        setCredits(sorted);
    }

    useEffect(() => {
        (async () => {
            try {
                await loadCredits();

                const { data } = await appwrite.auth.getUser();
                const uid = data.user?.id;

                if (uid) {
                    const roles = await DataStore.getUserRoles(uid);
                    setAuthorized(
                        roles.includes("website") || roles.includes("admin"),
                    );
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function startCreate() {
        setEditing(null);
        setForm({
            name: "",
            role: "",
            contribution: "",
            order: credits.length,
        });
        setShowForm(true);
    }

    function startEdit(credit: Credit) {
        setEditing(credit);
        setForm({
            name: credit.name,
            role: credit.role,
            contribution: credit.contribution,
            order: credit.order,
        });
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (editing?.id) {
            await DataStore.updateCredit(editing.id, form);
        } else {
            await DataStore.createCredit(form);
        }

        setShowForm(false);
        setEditing(null);
        await loadCredits();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this credit?")) return;

        await DataStore.deleteCredit(id);
        await loadCredits();
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-16">
                Loading credits...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="mb-10">
                <h1 className="text-3xl font-bold">Credits</h1>

                <p className="mt-2 text-muted-foreground">
                    The people who have helped build, improve, and support Alvey.
                </p>
            </div>

            {authorized && (
                <div className="mb-8">
                    <Button onClick={startCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Credit
                    </Button>
                </div>
            )}

            {showForm && authorized && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>
                            {editing ? "Edit Credit" : "Add Credit"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                placeholder="Name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                            />

                            <Input
                                placeholder="Role"
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                required
                            />

                            <Textarea
                                placeholder="What did they do?"
                                value={form.contribution}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        contribution: e.target.value,
                                    })
                                }
                                required
                            />

                            <Input
                                type="number"
                                placeholder="Display order"
                                value={form.order}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        order: Number(e.target.value),
                                    })
                                }
                            />

                            <div className="flex gap-2">
                                <Button type="submit">
                                    {editing ? "Save Changes" : "Add Credit"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditing(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {credits.length === 0 ? (
                    <p className="text-muted-foreground">
                        No credits have been added yet.
                    </p>
                ) : (
                    credits.map((credit) => (
                        <Card key={credit.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold text-lg">
                                            {credit.name}
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            {credit.role}
                                        </p>

                                        <div className="mt-3 text-sm leading-6">
                                            <ReactMarkdown
                                                components={{
                                                    a: ({ href, children }) => (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline underline-offset-2 hover:opacity-80"
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                }}
                                            >
                                                {credit.contribution}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {authorized && (
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => startEdit(credit)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() =>
                                                    credit.id && handleDelete(credit.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}