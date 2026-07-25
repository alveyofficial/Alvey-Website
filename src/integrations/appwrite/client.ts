import { Account, Client, Databases, ID, OAuthProvider, Storage } from "appwrite";

const viteEnv =
  typeof import.meta !== "undefined"
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : undefined;

function readEnv(name: string, fallback = ""): string {
  try {
    if (viteEnv?.[name]) return viteEnv[name];

    const processEnv =
      typeof globalThis !== "undefined"
        ? (globalThis as typeof globalThis & {
          process?: { env?: Record<string, string | undefined> };
        }).process?.env
        : undefined;

    if (processEnv?.[name]) return processEnv[name] as string;
  } catch {
    // Ignore errors for process
  }
  return fallback;
}

export const APPWRITE_ENDPOINT = readEnv(
  "VITE_APPWRITE_ENDPOINT",
  "https://fra.cloud.appwrite.io/v1",
);
export const APPWRITE_PROJECT_ID = readEnv("VITE_APPWRITE_PROJECT_ID", "tutorslink");
export const APPWRITE_DATABASE_ID = readEnv("VITE_APPWRITE_DATABASE_ID", "Database");

const AUTH_EVENT = "tutorslink-auth-change";

function createClientInstance() {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
    throw new Error(
      "Missing Appwrite environment variables. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID.",
    );
  }

  const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

let cachedClient: ReturnType<typeof createClientInstance> | undefined;

function getClient() {
  if (!cachedClient) cachedClient = createClientInstance();
  return cachedClient;
}

function emitAuthChange(session: { user: Record<string, unknown> } | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
}
type NormalizedUser = {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  $id?: string;
} & Record<string, unknown>;

function normalizeUser(
  user: Record<string, unknown> | null
): NormalizedUser | null {
  if (!user) return null;

  return {
    ...user,
    id: (user.id as string) || (user.$id as string),
    email: user.email as string | undefined,
    displayName: user.displayName as string | undefined,
    name: user.name as string | undefined,
    $id: user.$id as string | undefined,
  };
}

export async function getCurrentUser() {
  try {
    return normalizeUser(await getClient().account.get());
  } catch {
    return null;
  }
}

export const appwrite = {
  get client() {
    return getClient().client;
  },
  get account() {
    return getClient().account;
  },
  get databases() {
    return getClient().databases;
  },
  get storage() {
    return getClient().storage;
  },
  auth: {
    async getUser() {
      const user = await getCurrentUser();
      return { data: { user } };
    },
    async getSession() {
      const user = await getCurrentUser();
      return { data: { session: user ? { user } : null } };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        await getClient().account.createEmailPasswordSession(email, password);
        const user = await getCurrentUser();
        emitAuthChange(user ? { user } : null);
        return { data: { session: user ? { user } : null }, error: null };
      } catch (error) {
        return {
          data: { session: null },
          error: error,
        };
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
    }) {
      try {
        const name = String(
          options?.data?.display_name ??
          options?.data?.name ??
          email.split("@")[0] ??
          "Alvey User"
        );
        await getClient().account.create(ID.unique(), email, password, name);
        await getClient().account.createEmailPasswordSession(email, password);
        const user = await getCurrentUser();
        emitAuthChange(user ? { user } : null);
        return { data: { session: user ? { user } : null }, error: null };
      } catch (error) {
        return {
          data: { session: null },
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    },
    async signOut() {
      try {
        await getClient().account.deleteSession("current");
        emitAuthChange(null);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    async createRecovery(email: string, redirectUrl: string) {
      try {
        await getClient().account.createRecovery(email, redirectUrl);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    async updateRecovery(userId: string, secret: string, password: string) {
      try {
        await getClient().account.updateRecovery(userId, secret, password);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    async signInWithOAuth(
      provider: "google" | "apple" | "microsoft" | "discord" | "linkedin",
      opts?: { redirect_uri?: string; extraParams?: Record<string, string> },
    ) {
      try {
        const success =
          opts?.redirect_uri ||
          (typeof window !== "undefined" ? window.location.origin : undefined);
        const failure =
          opts?.redirect_uri ||
          (typeof window !== "undefined" ? window.location.origin : undefined);
        await getClient().account.createOAuth2Session(provider as OAuthProvider, success, failure);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    onAuthStateChange(
      callback: (_event: string, session: { user: Record<string, unknown> } | null) => void,
    ) {
      const listener = (event: Event) => {
        const session = (event as CustomEvent).detail ?? null;
        callback("change", session);
      };
      if (typeof window !== "undefined") {
        window.addEventListener(AUTH_EVENT, listener);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (typeof window !== "undefined") {
                window.removeEventListener(AUTH_EVENT, listener);
              }
            },
          },
        },
      };
    },
  },
};

export { ID };
