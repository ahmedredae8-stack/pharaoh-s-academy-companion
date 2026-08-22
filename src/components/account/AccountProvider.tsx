import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";
import type { Entitlement, PathId } from "@/lib/products";
import { hasPro, isPathUnlocked } from "@/lib/products";

type AccountData = Awaited<ReturnType<typeof getMyAccount>> | null;

type AccountContextValue = {
  session: Session | null;
  loading: boolean;
  account: AccountData;
  entitlements: Entitlement[];
  isPro: boolean;
  pathUnlocked: (pathId: PathId) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<AccountData>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setAccount(null);
      return;
    }
    try {
      setAccount(await getMyAccount());
    } catch (error) {
      console.error("Failed to load account:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "SIGNED_OUT") {
        setAccount(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        void refresh();
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session) await refresh();
      setLoading(false);
    })();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [refresh]);

  const entitlements = useMemo<Entitlement[]>(
    () => (account?.entitlements ?? []) as Entitlement[],
    [account],
  );

  const value = useMemo<AccountContextValue>(
    () => ({
      session,
      loading,
      account,
      entitlements,
      isPro: hasPro(entitlements),
      pathUnlocked: (pathId: PathId) => isPathUnlocked(entitlements, pathId),
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, account, entitlements, refresh],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used inside AccountProvider");
  return context;
}