"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { safeReturnTo } from "@/lib/safe-return-to";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
  AuthDivider,
  AuthSpinner,
} from "@/components/auth/AuthLayout";
import { RolePicker } from "@/components/auth/RolePicker";
import { SignedInPanel } from "@/components/auth/SignedInPanel";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";
import type { UserRole } from "@/types/user-profile";
import {
  applyConfirmPasswordChange,
  backToSignIn,
  changeSignUpEmail,
  confirmPasswordError,
  createAccountLabel,
  needsPasswordVerification,
  refreshSignUpVerification,
  resendSignUpVerification,
  signOutFromSignUp,
  signUpVerificationStatus,
  signUpWithGoogle,
  submitDisabled,
  submitSignUpForm,
  type VerificationAction,
} from "./sign-up-actions";

type SignedInUser = {
  email: string | null;
  isPasswordUser: boolean;
  emailVerified: boolean;
};

const SIGN_IN_LINK = {
  text: "Already have an account?",
  linkText: "Sign in",
  href: "/auth/signin",
};

const DIFFERENT_ACCOUNT_LINK = { ...SIGN_IN_LINK, text: "Need a different account?" };

function CheckingSession() {
  return (
    <AuthLayout title="Checking your session" alternateLink={SIGN_IN_LINK}>
      <AuthSpinner />
    </AuthLayout>
  );
}

function SignUpFormAlert({
  error,
  confirmError,
}: {
  error: string | null;
  confirmError: string | undefined;
}) {
  if (!error) return null;
  if (error === confirmError) return null;
  return <AuthAlert type="error" message={error} />;
}

function SignUpVerifyScreen({
  user,
  error,
  verificationStatus,
  verificationEmailSent,
  verificationAction,
  returnTo,
  setError,
  setVerificationStatus,
  setVerificationEmailSent,
  setVerificationAction,
  setIsLoading,
  sendVerificationEmail,
  changeUnverifiedEmail,
  refreshAuthState,
  signOut,
  push,
  replace,
  refresh,
}: {
  user: SignedInUser;
  error: string | null;
  verificationStatus: string | null;
  verificationEmailSent: boolean;
  verificationAction: VerificationAction;
  returnTo: string;
  setError: (value: string | null) => void;
  setVerificationStatus: (value: string | null) => void;
  setVerificationEmailSent: (value: boolean) => void;
  setVerificationAction: (action: VerificationAction) => void;
  setIsLoading: (value: boolean) => void;
  sendVerificationEmail: () => Promise<void>;
  changeUnverifiedEmail: (email: string) => Promise<void>;
  refreshAuthState: () => Promise<{ emailVerified: boolean }>;
  signOut: () => Promise<void>;
  push: (path: string) => void;
  replace: (path: string) => void;
  refresh: () => void;
}) {
  return (
    <AuthLayout title="Verify your email" alternateLink={DIFFERENT_ACCOUNT_LINK}>
      <VerifyEmailPanel
        email={user.email}
        error={error}
        status={signUpVerificationStatus(verificationStatus, verificationEmailSent)}
        pending={verificationAction}
        cooldownOnMount={verificationEmailSent}
        onResend={() =>
          resendSignUpVerification({
            setVerificationAction,
            setError,
            setVerificationStatus,
            setVerificationEmailSent,
            sendVerificationEmail,
          })
        }
        onRefresh={() =>
          refreshSignUpVerification({
            setVerificationAction,
            setError,
            setVerificationStatus,
            refreshAuthState,
            push,
            returnTo,
          })
        }
        onChangeEmail={(nextEmail) =>
          changeSignUpEmail({
            nextEmail,
            setVerificationAction,
            setError,
            setVerificationStatus,
            setVerificationEmailSent,
            changeUnverifiedEmail,
          })
        }
        onBackToSignIn={() =>
          backToSignIn({
            setVerificationAction,
            setError,
            signOut,
            replace,
          })
        }
        onSignOut={() =>
          signOutFromSignUp({
            setVerificationAction,
            setIsLoading,
            setError,
            signOut,
            push,
            refresh,
          })
        }
      />
    </AuthLayout>
  );
}

function SignUpSignedInScreen({
  user,
  error,
  isBusy,
  returnTo,
  setError,
  setVerificationAction,
  setIsLoading,
  signOut,
  push,
  refresh,
}: {
  user: SignedInUser;
  error: string | null;
  isBusy: boolean;
  returnTo: string;
  setError: (value: string | null) => void;
  setVerificationAction: (action: VerificationAction) => void;
  setIsLoading: (value: boolean) => void;
  signOut: () => Promise<void>;
  push: (path: string) => void;
  refresh: () => void;
}) {
  return (
    <AuthLayout title="You're signed in" alternateLink={DIFFERENT_ACCOUNT_LINK}>
      <SignedInPanel
        email={user.email}
        error={error}
        isBusy={isBusy}
        isSigningOut={isBusy}
        onContinue={() => push(returnTo)}
        onSignOut={() =>
          signOutFromSignUp({
            setVerificationAction,
            setIsLoading,
            setError,
            signOut,
            push,
            refresh,
          })
        }
      />
    </AuthLayout>
  );
}

function SignUpTerms() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      By signing up, you agree to our{" "}
      <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

function SignUpForm({
  email,
  password,
  confirmPassword,
  role,
  error,
  isLoading,
  confirmTouched,
  returnTo,
  setEmail,
  setPassword,
  setConfirmPassword,
  setRole,
  setError,
  setIsLoading,
  setVerificationStatus,
  setVerificationEmailSent,
  setConfirmTouched,
  signUp,
  signIn,
  push,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  error: string | null;
  isLoading: boolean;
  confirmTouched: boolean;
  returnTo: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setRole: (role: UserRole) => void;
  setError: (value: string | null) => void;
  setIsLoading: (value: boolean) => void;
  setVerificationStatus: (value: string | null) => void;
  setVerificationEmailSent: (value: boolean) => void;
  setConfirmTouched: (value: boolean) => void;
  signUp: (email: string, password: string, options: { role: UserRole }) => Promise<void>;
  signIn: (method: "google") => Promise<{ needsEmailVerification: boolean }>;
  push: (path: string) => void;
}) {
  const confirmError = confirmPasswordError(password, confirmPassword, confirmTouched);
  return (
    <AuthLayout title="Create your account" alternateLink={SIGN_IN_LINK} footer={<SignUpTerms />}>
      <SignUpFormAlert error={error} confirmError={confirmError} />

      <GoogleSignInButton
        onClick={() =>
          void signUpWithGoogle({
            setIsLoading,
            setError,
            signIn,
            push,
            returnTo,
          })
        }
        isLoading={isLoading}
        disabled={isLoading}
        label="Sign up with Google"
      />

      <AuthDivider />

      <form
        className="space-y-5"
        onSubmit={(event) =>
          submitSignUpForm(event, {
            email,
            password,
            confirmPassword,
            role,
            setIsLoading,
            setError,
            setVerificationStatus,
            setVerificationEmailSent,
            setConfirmTouched,
            signUp,
          })
        }
        noValidate
      >
        <RolePicker value={role} onChange={setRole} disabled={isLoading} />

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          placeholder="you@example.com"
        />

        <AuthInput
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          placeholder="Create a password"
        />

        <AuthInput
          id="confirm-password"
          name="confirm-password"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) =>
            applyConfirmPasswordChange(event.target.value, error, setConfirmPassword, setError)
          }
          onBlur={() => setConfirmTouched(true)}
          disabled={isLoading}
          placeholder="Type it again"
          error={confirmError}
        />

        <Button
          type="submit"
          disabled={submitDisabled(isLoading, email, password, confirmPassword)}
          isLoading={isLoading}
          className="w-full"
          size="lg"
        >
          {createAccountLabel(isLoading)}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function SignUpClient({
  returnToParam,
}: {
  returnToParam?: string;
}) {
  const returnTo = safeReturnTo(returnToParam, "/");
  const {
    user,
    isLoading: isAuthLoading,
    signUp,
    signIn,
    signOut,
    sendVerificationEmail,
    changeUnverifiedEmail,
    refreshAuthState,
  } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [verificationAction, setVerificationAction] = useState<VerificationAction>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [confirmTouched, setConfirmTouched] = useState(false);

  if (isAuthLoading) return <CheckingSession />;

  if (user && needsPasswordVerification(user)) {
    return (
      <SignUpVerifyScreen
        user={user}
        error={error}
        verificationStatus={verificationStatus}
        verificationEmailSent={verificationEmailSent}
        verificationAction={verificationAction}
        returnTo={returnTo}
        setError={setError}
        setVerificationStatus={setVerificationStatus}
        setVerificationEmailSent={setVerificationEmailSent}
        setVerificationAction={setVerificationAction}
        setIsLoading={setIsLoading}
        sendVerificationEmail={sendVerificationEmail}
        changeUnverifiedEmail={changeUnverifiedEmail}
        refreshAuthState={refreshAuthState}
        signOut={signOut}
        push={router.push}
        replace={router.replace}
        refresh={router.refresh}
      />
    );
  }

  if (user) {
    return (
      <SignUpSignedInScreen
        user={user}
        error={error}
        isBusy={isLoading}
        returnTo={returnTo}
        setError={setError}
        setVerificationAction={setVerificationAction}
        setIsLoading={setIsLoading}
        signOut={signOut}
        push={router.push}
        refresh={router.refresh}
      />
    );
  }

  return (
    <SignUpForm
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      role={role}
      error={error}
      isLoading={isLoading}
      confirmTouched={confirmTouched}
      returnTo={returnTo}
      setEmail={setEmail}
      setPassword={setPassword}
      setConfirmPassword={setConfirmPassword}
      setRole={setRole}
      setError={setError}
      setIsLoading={setIsLoading}
      setVerificationStatus={setVerificationStatus}
      setVerificationEmailSent={setVerificationEmailSent}
      setConfirmTouched={setConfirmTouched}
      signUp={signUp}
      signIn={signIn}
      push={router.push}
    />
  );
}
