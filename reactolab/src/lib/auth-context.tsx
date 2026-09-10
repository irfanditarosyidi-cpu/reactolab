"use client";

// Global auth + profile context.
// Protected pages must not render before auth state resolves (PR-AUTH-001).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, db } from "./firebase/client";
import { P } from "./paths";
import type { Role, UserProfile } from "./types";
import { createUserProfile } from "./db";

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function dashboardPathFor(role: Role | undefined | null): string {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setProfile(null);
        setProfileReady(true);
      } else {
        setProfileReady(false);
      }
    });
    return unsub;
  }, []);

  // Live profile subscription (role/status changes take effect immediately)
  useEffect(() => {
    if (!user) return;
    const r = ref(db, P.user(user.uid));
    const unsub = onValue(
      r,
      (snap) => {
        if (snap.exists()) {
          const p = { ...(snap.val() as UserProfile), uid: user.uid };
          if (p.status === "inactive") {
            // Deactivated accounts are signed out on the spot.
            signOut(auth);
            setProfile(null);
          } else {
            setProfile(p);
          }
        } else {
          setProfile(null);
        }
        setProfileReady(true);
      },
      () => setProfileReady(true)
    );
    return () => unsub();
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    // Read profile once for immediate role routing
    const snap = await new Promise<UserProfile | null>((resolve) => {
      const r = ref(db, P.user(cred.user.uid));
      const unsub = onValue(
        r,
        (s) => {
          unsub();
          resolve(s.exists() ? ({ ...(s.val() as UserProfile), uid: cred.user.uid }) : null);
        },
        () => {
          unsub();
          resolve(null);
        }
      );
    });
    if (!snap) throw new Error("Profil pengguna tidak ditemukan. Hubungi admin.");
    if (snap.status === "inactive") {
      await signOut(auth);
      const err = new Error("Akun dinonaktifkan.") as Error & { code?: string };
      err.code = "auth/user-disabled";
      throw err;
    }
    return snap;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateAuthProfile(cred.user, { displayName: name });
      // Default role: student (PR-AUTH-002)
      await createUserProfile({
        uid: cred.user.uid,
        name,
        email: email.trim().toLowerCase(),
        role: "student",
        status: "active",
        activeClassId: null,
        createdAt: Date.now(),
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      profile,
      loading: !authReady || !profileReady,
      login,
      register,
      logout,
    }),
    [user, profile, authReady, profileReady, login, register, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
