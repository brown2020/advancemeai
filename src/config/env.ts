import { z } from "zod";
const isServer = typeof window === "undefined";

const serverSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(10),
  OPENAI_API_KEY: z.string().min(10).optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_DEBUG: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_ALLOW_TEST_MODE: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

/**
 * Safely parses environment variables with a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Environment variables to validate
 * @returns Validated environment variables or empty object
 */
function safeParseEnv<T extends z.ZodTypeAny>(
  schema: T,
  data: Record<string, string | undefined>
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    if (isServer) {
      // Critical startup error - use console directly for immediate feedback
      console.error("Environment validation failed:", errors);
    }
    if (isServer && process.env.NODE_ENV !== "production") {
      throw new Error("Invalid environment variables");
    }
    // In production, warn loudly but don't crash to allow graceful degradation
    if (isServer && process.env.NODE_ENV === "production") {
      console.warn(
        "[CRITICAL] Running with missing environment variables. Some features will not work:",
        Object.keys(errors)
      );
    }
  }
  return (result.success ? result.data : ({} as z.infer<T>)) as z.infer<T>;
}

const publicEnv = safeParseEnv(publicSchema, {
  NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
  NEXT_PUBLIC_ALLOW_TEST_MODE: process.env.NEXT_PUBLIC_ALLOW_TEST_MODE,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const serverEnv = isServer
  ? safeParseEnv(serverSchema, {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    })
  : ({} as z.infer<typeof serverSchema>);

export const env = {
  debug: publicEnv.NEXT_PUBLIC_DEBUG === "true",
  allowTestMode: publicEnv.NEXT_PUBLIC_ALLOW_TEST_MODE === "true",
  public: publicEnv,
  server: serverEnv,
};
