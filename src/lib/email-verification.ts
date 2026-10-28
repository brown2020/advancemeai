export const UNAUTHORIZED_CONTINUE_URI = "auth/unauthorized-continue-uri";

/**
 * Firebase rejects sendEmailVerification when actionCodeSettings.url is a host
 * that is not on the project's authorized domains (Vercel preview URLs).
 * Retry once without those settings so the message still goes out.
 */
export async function sendEmailVerificationAllowingPreviewHost(
  sendWithContinueUrl: () => Promise<void>,
  sendPlain: () => Promise<void>,
  readCode: (error: unknown) => string | null
): Promise<"sent" | "sent-without-continue-url"> {
  try {
    await sendWithContinueUrl();
    return "sent";
  } catch (error) {
    if (readCode(error) !== UNAUTHORIZED_CONTINUE_URI) {
      throw error;
    }
  }

  await sendPlain();
  return "sent-without-continue-url";
}
