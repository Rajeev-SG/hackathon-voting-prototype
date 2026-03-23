#!/usr/bin/env node

const args = process.argv.slice(2);

function readArg(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
}

const email = readArg("--email");
const appUrl = readArg("--app-url") ?? process.env.APP_URL ?? "http://localhost:3000";
const redirectPath = readArg("--redirect") ?? "/";
const expiresInSeconds = Number(readArg("--expires-in-seconds") ?? "900");
const secretKey = process.env.CLERK_SECRET_KEY;

if (!email) {
  console.error("Usage: node scripts/create-clerk-sign-in-token.mjs --email user@example.com [--app-url https://app.example.com] [--redirect /]");
  process.exit(1);
}

if (!secretKey) {
  console.error("Missing CLERK_SECRET_KEY.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${secretKey}`,
  "Content-Type": "application/json"
};

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const json = await response.json();

  if (!response.ok) {
    const detail = json?.errors?.[0]?.long_message ?? json?.errors?.[0]?.message ?? response.statusText;
    throw new Error(detail);
  }

  return json;
}

async function findUserByEmail(identifier) {
  const users = await fetchJson(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(identifier)}`,
    { headers }
  );

  return users[0] ?? null;
}

async function createUser(identifier) {
  const password = `ProofPass-${crypto.randomUUID()}-Aa1`;

  return fetchJson("https://api.clerk.com/v1/users", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email_address: [identifier],
      password
    })
  });
}

async function createSignInToken(userId) {
  return fetchJson("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: expiresInSeconds
    })
  });
}

const existingUser = await findUserByEmail(email);
const user = existingUser ?? (await createUser(email));
const token = await createSignInToken(user.id);
const ticketUrl = new URL("/auth/ticket", appUrl);

ticketUrl.searchParams.set("token", token.token);
ticketUrl.searchParams.set("redirect", redirectPath);

console.log(ticketUrl.toString());
