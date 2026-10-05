import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  validCallback,
  validRepository,
  type EnvFile,
  type GitHubUser,
} from "@/lib/contracts";
import {
  ApiError,
  authenticate,
  body,
  cookieOptions,
  database,
  failure,
  github,
  json,
  repositories,
  repositoryAccess,
  required,
  seal,
  unseal,
} from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type OAuthState = { nonce: string; redirect: string; expires: number };

async function handle(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (path === "/api/health" && request.method === "GET")
      return json({ status: "ok", service: "vathavaran-next" });
    if (
      ["/api/auth/github", "/api/auth/github/cli"].includes(path) &&
      request.method === "GET"
    ) {
      const redirect = path.endsWith("/cli")
        ? (request.nextUrl.searchParams.get("redirect_uri") ?? "")
        : "";
      if (path.endsWith("/cli") && !validCallback(redirect))
        throw new ApiError(
          400,
          "Use a loopback /callback or vathavaran://auth/callback redirect",
        );
      const state: OAuthState = {
        nonce: randomBytes(32).toString("hex"),
        redirect,
        expires: Date.now() + 600000,
      };
      const url = new URL("https://github.com/login/oauth/authorize");
      url.search = new URLSearchParams({
        client_id: required("GITHUB_CLIENT_ID"),
        redirect_uri: required("GITHUB_CALLBACK_URL"),
        scope: "read:user repo user:email",
        state: state.nonce,
      }).toString();
      const response =
        path.endsWith("/cli") ||
        request.nextUrl.searchParams.get("browser") === "1"
          ? NextResponse.redirect(url)
          : json({ url: url.toString() });
      response.cookies.set("varte_oauth", seal(state), {
        ...cookieOptions,
        maxAge: 600,
      });
      return response;
    }
    if (path === "/api/auth/github/callback" && request.method === "GET") {
      const state = unseal<OAuthState>(
        request.cookies.get("varte_oauth")?.value ?? "",
      );
      const nonce = request.nextUrl.searchParams.get("state") ?? "";
      if (
        !state ||
        state.expires < Date.now() ||
        nonce.length !== state.nonce.length ||
        !timingSafeEqual(Buffer.from(nonce), Buffer.from(state.nonce))
      )
        throw new ApiError(
          400,
          "Login expired or state invalid. Start sign-in again",
        );
      const code = request.nextUrl.searchParams.get("code");
      if (!code) throw new ApiError(400, "GitHub sign-in was cancelled");
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: required("GITHUB_CLIENT_ID"),
            client_secret: required("GITHUB_CLIENT_SECRET"),
            redirect_uri: required("GITHUB_CALLBACK_URL"),
            code,
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const data = await tokenResponse.json();
      if (!tokenResponse.ok || typeof data.access_token !== "string")
        throw new ApiError(401, "GitHub could not complete sign-in");
      const user = await github<GitHubUser>("/user", data.access_token);
      const destination = new URL(
        state.redirect || "/dashboard",
        required("APP_URL"),
      );
      if (state.redirect) {
        if (!validCallback(state.redirect))
          throw new ApiError(400, "Invalid callback");
        destination.searchParams.set("token", data.access_token);
        destination.searchParams.set("user", JSON.stringify(user));
        destination.searchParams.set("userId", String(user.id));
        destination.searchParams.set("userName", user.login);
      }
      const response = NextResponse.redirect(destination);
      if (!state.redirect)
        response.cookies.set(
          "varte_session",
          seal({ token: data.access_token, expires: Date.now() + 604800000 }),
          { ...cookieOptions, maxAge: 604800 },
        );
      response.cookies.set("varte_oauth", "", { ...cookieOptions, maxAge: 0 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (path === "/api/auth/logout" && request.method === "POST") {
      await authenticate(request);
      const response = json({ success: true });
      response.cookies.set("varte_session", "", {
        ...cookieOptions,
        maxAge: 0,
      });
      return response;
    }
    const { token, user } = await authenticate(request);
    if (path === "/api/user" && request.method === "GET") return json(user);
    if (path === "/api/repositories" && request.method === "GET")
      return json(await repositories(token));
    if (path === "/api/encryption-key" && request.method === "GET")
      return json({ encryptionKey: required("ENCRYPTION_KEY") });
    if (
      ["/api/env/pull", "/api/env/list"].includes(path) &&
      ["GET", "POST"].includes(request.method)
    ) {
      const input =
        request.method === "POST"
          ? await body(request)
          : Object.fromEntries(request.nextUrl.searchParams);
      const repo = input.repoFullName;
      if (repo !== undefined && !validRepository(repo))
        throw new ApiError(400, "Repository must be owner/name");
      if (path.endsWith("/pull") && !validRepository(repo))
        throw new ApiError(400, "Repository is required");
      let files: EnvFile[];
      if (validRepository(repo)) {
        await repositoryAccess(repo, token);
        const snapshot = await database()
          .collection("envFiles")
          .where("repoFullName", "==", repo)
          .get();
        files = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as EnvFile,
        );
        if (path.endsWith("/pull")) {
          const directory = input.directory ?? "";
          if (typeof directory !== "string")
            throw new ApiError(400, "Directory must be a string");
          files = files.filter((file) => (file.directory ?? "") === directory);
        }
      } else {
        const allowed = await repositories(token);
        files = [];
        // Bounded batches avoid Firestore composite indexes and preserve legacy documents.
        for (let index = 0; index < allowed.length; index += 30) {
          const names = allowed
            .slice(index, index + 30)
            .map((repo) => repo.full_name);
          const snapshot = await database()
            .collection("envFiles")
            .where("repoFullName", "in", names)
            .get();
          files.push(
            ...snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as EnvFile,
            ),
          );
        }
      }
      files.sort((a, b) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
      );
      return json({ success: true, envFiles: files });
    }
    if (path === "/api/env/push" && request.method === "POST") {
      const input = await body(request);
      if (!validRepository(input.repoFullName))
        throw new ApiError(400, "Repository must be owner/name");
      if (
        typeof input.envName !== "string" ||
        !input.envName.trim() ||
        input.envName.length > 240
      )
        throw new ApiError(
          400,
          "Environment file name is required (max 240 characters)",
        );
      if (
        typeof input.content !== "string" ||
        !/^U2FsdGVkX1[A-Za-z0-9+/=]+$/.test(input.content)
      )
        throw new ApiError(
          400,
          "Content must use the compatible encrypted format",
        );
      if (typeof input.directory !== "string" || input.directory.length > 1000)
        throw new ApiError(
          400,
          "Directory must be a string (max 1000 characters)",
        );
      await repositoryAccess(input.repoFullName, token, true);
      const now = new Date().toISOString();
      const entry = {
        userId: user.id,
        userName: user.login,
        repoFullName: input.repoFullName,
        repoName: input.repoFullName.split("/")[1],
        directory: input.directory,
        envName: input.envName.trim(),
        content: input.content,
        isEncrypted: true,
        createdAt: now,
        updatedAt: now,
      };
      const doc = await database().collection("envFiles").add(entry);
      return json(
        { success: true, id: doc.id, message: "Environment file saved" },
        201,
      );
    }
    throw new ApiError(404, "API endpoint not found");
  } catch (error) {
    return failure(error);
  }
}
export const GET = handle;
export const POST = handle;
