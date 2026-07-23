"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const KOREA_EMAIL_REGEX = /^[^\s@]+@korea\.ac\.kr$/i;
const KOREA_EMAIL_ERROR = "고려대학교 이메일(@korea.ac.kr)만 사용할 수 있습니다.";

export type AuthFormState = { error?: string; success?: boolean } | undefined;

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("signIn failed:", error.code ?? error.message);
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/workspace");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Server-side enforcement — the authoritative check. Client-side validation
  // in the form is only a UX shortcut and must not be trusted on its own.
  if (!KOREA_EMAIL_REGEX.test(email)) {
    return { error: KOREA_EMAIL_ERROR };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("signUp failed:", error.code ?? error.message);
    return { error: "가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  // If email confirmation is disabled in Supabase, signUp already returns an
  // active session — the account is confirmed immediately, so skip straight
  // to the app instead of telling the user to check an email that never sent.
  if (data.session) {
    redirect("/workspace");
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
