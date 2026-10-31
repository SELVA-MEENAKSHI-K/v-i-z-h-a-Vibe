"use client";

// Client-side Firebase initialization + Google sign-in helper.
//
// Only NEXT_PUBLIC_* values are used here — these are safe to expose to the
// browser (a Firebase "web config" is not a secret; security is enforced by
// Firebase Auth rules + our server-side ID-token verification). The server
// never trusts anything from the client beyond a Firebase ID token that it
// cryptographically verifies (see src/lib/firebaseVerify.ts).

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True only when the minimum config needed for Google sign-in is present.
export function firebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function app(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

function auth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(app());
  return _auth;
}

// Opens the Google sign-in popup and returns a verified-by-Google ID token
// (a JWT). We hand this token to our server, which verifies it independently.
export async function signInWithGoogleIdToken(): Promise<string> {
  if (!firebaseConfigured()) {
    throw new Error("Google sign-in is not configured.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth(), provider);
  const idToken = await result.user.getIdToken();
  return idToken;
}
