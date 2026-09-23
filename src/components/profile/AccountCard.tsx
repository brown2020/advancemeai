"use client";

import { KeyRound, LogOut, MailCheck, MailWarning, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type VerificationAction = "send" | "refresh" | null;

interface AccountCardProps {
  email: string | null;
  isPasswordUser: boolean;
  emailVerified: boolean;
  verificationAction: VerificationAction;
  isSigningOut: boolean;
  onSendVerification: () => void;
  onRefreshVerification: () => void;
  onSendPasswordReset: () => void;
  onSignOut: () => void;
}

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-muted-foreground [&_svg]:size-5">{icon}</span>
        <div>
          <div className="flex flex-wrap items-center gap-2 font-medium">{title}</div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2 sm:shrink-0">{children}</div>}
    </div>
  );
}

/** Email verification, password reset and sign out. */
export function AccountCard({
  email,
  isPasswordUser,
  emailVerified,
  verificationAction,
  isSigningOut,
  onSendVerification,
  onRefreshVerification,
  onSendPasswordReset,
  onSignOut,
}: AccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
          Account & security
        </CardTitle>
        <CardDescription>Keep your sign-in details up to date.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPasswordUser && (
          <Row
            icon={emailVerified ? <MailCheck aria-hidden /> : <MailWarning aria-hidden />}
            title={
              <>
                Email verification
                {emailVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Not verified</Badge>
                )}
              </>
            }
            description={
              emailVerified
                ? "Your email address is verified."
                : "Use the verification link we send to your inbox."
            }
          >
            {!emailVerified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSendVerification}
                disabled={verificationAction !== null}
                isLoading={verificationAction === "send"}
              >
                Send email
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefreshVerification}
              disabled={verificationAction !== null}
              isLoading={verificationAction === "refresh"}
            >
              Refresh status
            </Button>
          </Row>
        )}

        <Row
          icon={<KeyRound aria-hidden />}
          title="Reset password"
          description="We'll email you a password reset link."
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSendPasswordReset}
            disabled={!email}
          >
            Send reset email
          </Button>
        </Row>

        <Row
          icon={<LogOut aria-hidden />}
          title="Sign out"
          description="Sign out of Advance.me on this device."
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSignOut}
            disabled={isSigningOut}
            isLoading={isSigningOut}
            className="text-destructive hover:border-destructive/40 hover:bg-destructive/10"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </Row>
      </CardContent>
    </Card>
  );
}
