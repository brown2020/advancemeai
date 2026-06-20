export type FirebaseAdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type EnvLike = Record<string, string | undefined>;

const JSON_CREDENTIAL_ENV_NAMES = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "FIREBASE_ADMIN_SERVICE_ACCOUNT",
  "FIREBASE_SERVICE_ACCOUNT",
  "FIREBASE_ADMIN_CREDENTIALS",
  "GOOGLE_APPLICATION_CREDENTIALS_JSON",
] as const;

const BASE64_JSON_CREDENTIAL_ENV_NAMES = [
  "FIREBASE_SERVICE_ACCOUNT_KEY_BASE64",
  "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64",
  "FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64",
  "FIREBASE_SERVICE_ACCOUNT_BASE64",
  "FIREBASE_ADMIN_CREDENTIALS_BASE64",
  "GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64",
] as const;

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePrivateKey(privateKey: string): string {
  const unquoted = privateKey
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");

  return unquoted.replace(/\\n/g, "\n");
}

function credentialsFromJson(raw: string): FirebaseAdminCredentials | null {
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: unknown;
      projectId?: unknown;
      client_email?: unknown;
      clientEmail?: unknown;
      private_key?: unknown;
      privateKey?: unknown;
    };

    const projectId =
      typeof parsed.project_id === "string"
        ? parsed.project_id
        : typeof parsed.projectId === "string"
          ? parsed.projectId
          : null;
    const clientEmail =
      typeof parsed.client_email === "string"
        ? parsed.client_email
        : typeof parsed.clientEmail === "string"
          ? parsed.clientEmail
          : null;
    const privateKey =
      typeof parsed.private_key === "string"
        ? parsed.private_key
        : typeof parsed.privateKey === "string"
          ? parsed.privateKey
          : null;

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
  } catch {
    return null;
  }
}

function credentialsFromBase64Json(
  encoded: string
): FirebaseAdminCredentials | null {
  try {
    return credentialsFromJson(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function credentialsFromSplitEnv(env: EnvLike): FirebaseAdminCredentials | null {
  const projectId =
    nonEmpty(env.FIREBASE_PROJECT_ID) ??
    nonEmpty(env.FIREBASE_ADMIN_PROJECT_ID) ??
    nonEmpty(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail =
    nonEmpty(env.FIREBASE_CLIENT_EMAIL) ??
    nonEmpty(env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const privateKey =
    nonEmpty(env.FIREBASE_PRIVATE_KEY) ??
    nonEmpty(env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

export function resolveAdminCredentials(
  env: EnvLike = process.env
): FirebaseAdminCredentials | null {
  for (const envName of JSON_CREDENTIAL_ENV_NAMES) {
    const raw = nonEmpty(env[envName]);
    if (!raw) continue;

    const credentials =
      credentialsFromJson(raw) ?? credentialsFromBase64Json(raw);
    if (credentials) return credentials;
  }

  for (const envName of BASE64_JSON_CREDENTIAL_ENV_NAMES) {
    const raw = nonEmpty(env[envName]);
    if (!raw) continue;

    const credentials = credentialsFromBase64Json(raw);
    if (credentials) return credentials;
  }

  return credentialsFromSplitEnv(env);
}
