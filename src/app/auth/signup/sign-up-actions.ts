import type { FormEvent } from "react";
import type { UserRole } from "@/types/user-profile";

export type VerificationAction = "resend" | "refresh" | "changeEmail" | "back" | "signOut" | null;

type SetText = (value: string | null) => void;
type SetFlag = (value: boolean) => void;
type Go = (path: string) => void;

const PASSWORD_MISMATCH = "Passwords don't match";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function needsPasswordVerification(user: {
  isPasswordUser: boolean;
  emailVerified: boolean;
}): boolean {
  if (!user.isPasswordUser) return false;
  return !user.emailVerified;
}

export function signUpVerificationStatus(status: string | null, sent: boolean): string | null {
  if (status !== null) return status;
  if (sent) return "Verification email sent. Check your inbox.";
  return null;
}

export function confirmPasswordError(
  password: string,
  confirmPassword: string,
  confirmTouched: boolean,
): string | undefined {
  if (confirmPassword.length === 0) return undefined;
  if (password === confirmPassword) return undefined;
  if (!confirmTouched) return undefined;
  return PASSWORD_MISMATCH;
}

export function applyConfirmPasswordChange(
  value: string,
  error: string | null,
  setConfirmPassword: (value: string) => void,
  setError: SetText,
): void {
  setConfirmPassword(value);
  if (error === PASSWORD_MISMATCH) setError(null);
}

export function submitDisabled(
  isLoading: boolean,
  email: string,
  password: string,
  confirmPassword: string,
): boolean {
  if (isLoading) return true;
  if (!email) return true;
  if (!password) return true;
  if (!confirmPassword) return true;
  return false;
}

export function createAccountLabel(isLoading: boolean): string {
  if (isLoading) return "Creating account...";
  return "Create account";
}

type CreateAccountInput = {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  setIsLoading: SetFlag;
  setError: SetText;
  setVerificationStatus: SetText;
  setVerificationEmailSent: SetFlag;
  setConfirmTouched: SetFlag;
  signUp: (email: string, password: string, options: { role: UserRole }) => Promise<void>;
};

export function submitSignUpForm(event: FormEvent<HTMLFormElement>, input: CreateAccountInput): void {
  event.preventDefault();
  if (input.email.length === 0) return;
  if (input.password.length === 0) return;
  if (input.confirmPassword.length === 0) return;
  void createAccount(input);
}

async function createAccount(input: CreateAccountInput): Promise<void> {
  if (input.password !== input.confirmPassword) {
    input.setConfirmTouched(true);
    input.setError(PASSWORD_MISMATCH);
    return;
  }

  try {
    input.setIsLoading(true);
    input.setError(null);
    input.setVerificationStatus(null);
    await input.signUp(input.email, input.password, { role: input.role });
    input.setVerificationEmailSent(true);
    input.setVerificationStatus("Verification email sent. Check your inbox.");
  } catch (err) {
    input.setError(errorMessage(err, "Failed to create account. Please try again."));
  } finally {
    input.setIsLoading(false);
  }
}

export async function signUpWithGoogle(input: {
  setIsLoading: SetFlag;
  setError: SetText;
  signIn: (method: "google") => Promise<{ needsEmailVerification: boolean }>;
  push: Go;
  returnTo: string;
}): Promise<void> {
  try {
    input.setIsLoading(true);
    input.setError(null);
    const outcome = await input.signIn("google");
    if (!outcome.needsEmailVerification) input.push(input.returnTo);
  } catch (err) {
    input.setError(errorMessage(err, "Failed to sign in with Google. Please try again."));
  } finally {
    input.setIsLoading(false);
  }
}

export async function resendSignUpVerification(input: {
  setVerificationAction: (action: VerificationAction) => void;
  setError: SetText;
  setVerificationStatus: SetText;
  setVerificationEmailSent: SetFlag;
  sendVerificationEmail: () => Promise<void>;
}): Promise<void> {
  try {
    input.setVerificationAction("resend");
    input.setError(null);
    input.setVerificationStatus(null);
    await input.sendVerificationEmail();
    input.setVerificationEmailSent(true);
    input.setVerificationStatus("Verification email sent again.");
  } catch (err) {
    input.setError(errorMessage(err, "Failed to send verification email. Please try again."));
    throw err;
  } finally {
    input.setVerificationAction(null);
  }
}

export async function refreshSignUpVerification(input: {
  setVerificationAction: (action: VerificationAction) => void;
  setError: SetText;
  setVerificationStatus: SetText;
  refreshAuthState: () => Promise<{ emailVerified: boolean }>;
  push: Go;
  returnTo: string;
}): Promise<void> {
  try {
    input.setVerificationAction("refresh");
    input.setError(null);
    input.setVerificationStatus(null);
    const status = await input.refreshAuthState();
    if (status.emailVerified) {
      input.push(input.returnTo);
      return;
    }
    input.setVerificationStatus("That email isn't verified yet. Open the link, then try again.");
  } catch (err) {
    input.setError(errorMessage(err, "Could not refresh your email status. Please try again."));
  } finally {
    input.setVerificationAction(null);
  }
}

export async function changeSignUpEmail(input: {
  nextEmail: string;
  setVerificationAction: (action: VerificationAction) => void;
  setError: SetText;
  setVerificationStatus: SetText;
  setVerificationEmailSent: SetFlag;
  changeUnverifiedEmail: (email: string) => Promise<void>;
}): Promise<void> {
  try {
    input.setVerificationAction("changeEmail");
    input.setError(null);
    input.setVerificationStatus(null);
    await input.changeUnverifiedEmail(input.nextEmail);
    input.setVerificationEmailSent(true);
    input.setVerificationStatus(
      `Verification link sent to ${input.nextEmail}. Open it to confirm that address, then choose I've verified my email.`,
    );
  } catch (err) {
    input.setError(errorMessage(err, "Failed to send a verification email to that address."));
    throw err;
  } finally {
    input.setVerificationAction(null);
  }
}

export async function backToSignIn(input: {
  setVerificationAction: (action: VerificationAction) => void;
  setError: SetText;
  signOut: () => Promise<void>;
  replace: Go;
}): Promise<void> {
  try {
    input.setVerificationAction("back");
    input.setError(null);
    await input.signOut();
    input.replace("/auth/signin");
  } catch (err) {
    input.setError(errorMessage(err, "Failed to return to sign-in. Please try again."));
  } finally {
    input.setVerificationAction(null);
  }
}

export async function signOutFromSignUp(input: {
  setVerificationAction: (action: VerificationAction) => void;
  setIsLoading: SetFlag;
  setError: SetText;
  signOut: () => Promise<void>;
  push: Go;
  refresh: () => void;
}): Promise<void> {
  try {
    input.setVerificationAction("signOut");
    input.setIsLoading(true);
    input.setError(null);
    await input.signOut();
    input.push("/");
    input.refresh();
  } catch (err) {
    input.setError(errorMessage(err, "Failed to sign out. Please try again."));
  } finally {
    input.setVerificationAction(null);
    input.setIsLoading(false);
  }
}
