"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/services/userProfileService";

export type SetAuthor = {
  name: string;
  username?: string;
};

/**
 * Author display info. Uses the server-provided value when present,
 * otherwise reads the (publicly readable) user profile on the client.
 */
export function useSetAuthor(
  ownerId: string | null | undefined,
  initialAuthor?: SetAuthor | null
): SetAuthor | null {
  const [fetched, setFetched] = useState<{ ownerId: string; author: SetAuthor | null } | null>(
    null
  );
  const shouldFetch = Boolean(ownerId) && initialAuthor === undefined;

  useEffect(() => {
    if (!shouldFetch || !ownerId) return;
    let cancelled = false;
    getUserProfile(ownerId)
      .then((profile) => {
        if (cancelled) return;
        const name = profile?.displayName || profile?.username;
        setFetched({
          ownerId,
          author: name ? { name, username: profile?.username } : null,
        });
      })
      .catch(() => {
        // Author is decorative; ignore failures.
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, shouldFetch]);

  if (initialAuthor !== undefined) return initialAuthor;
  return fetched && fetched.ownerId === ownerId ? fetched.author : null;
}
