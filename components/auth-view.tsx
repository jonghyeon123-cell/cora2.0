"use client";

import Image from "next/image";
import Link from "next/link";
import { Exo_2 } from "next/font/google";
import { Lock, Mail, PawPrint } from "lucide-react";
import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";
import tigerImage from "../cora_tiger.png";
import faceImage from "../face.svg";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: "700",
});

export function AuthView() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <section
      className="flex min-h-screen flex-col text-neutral-900"
      style={{ backgroundColor: "#FFF7EC" }}
    >
      <header
        className="flex items-center justify-between border-b px-6 py-6 md:px-12"
        style={{ borderColor: "#ededec" }}
      >
        <Link href="/" className="flex items-center gap-1">
          <Image
            src={faceImage}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <span
            className={`${exo2.className} text-2xl font-semibold tracking-tight`}
            style={{ color: "#A3040C" }}
          >
            CoRA
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xs font-medium tracking-widest transition-opacity hover:opacity-60"
            style={{ color: "#A3040C" }}
          >
            HOME
          </Link>

          <Link
            href="/auth/signup"
            className="flex items-center gap-[7px] text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-700 md:text-sm"
          >
            계정이 없으신가요?
            <span className="font-semibold" style={{ color: "#A3040C" }}>
              회원가입
            </span>
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-12 md:px-16">
          <div className="w-full max-w-sm">
            <div
              className="mb-4 flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "#A3040C" }}
            >
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              만나서 반가워요
            </div>

            <h1
              className={`${exo2.className} text-4xl font-semibold tracking-tight md:text-5xl`}
            >
              로그인
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-base">
              학교 이메일로 로그인하고 수강신청을 준비하세요.
            </p>

            <form action={formAction} className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-neutral-500"
                >
                  이메일
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@korea.ac.kr"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-[#A3040C]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-neutral-500"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-[#A3040C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-neutral-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 accent-[#A3040C]"
                  />
                  로그인 상태 유지
                </label>
                <Link
                  href="#"
                  className="font-medium transition-opacity hover:opacity-70"
                  style={{ color: "#A3040C" }}
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {state?.error && (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#A3040C" }}
              >
                {pending ? "로그인 중..." : "로그인"}
              </button>
            </form>
          </div>
        </div>

        <div className="relative hidden px-6 py-12 md:block md:px-12">
          <div className="relative h-full w-full overflow-hidden rounded-2xl">
            <Image
              src={tigerImage}
              alt="CoRA tiger illustration"
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
