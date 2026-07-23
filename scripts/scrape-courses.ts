/**
 * Pilot course scraper — Korea University Philosophy department (철학과), 2026학년도 2학기.
 *
 * Data flow:
 *   1. sugang.korea.ac.kr (public, no login) — plain HTTP for the course list.
 *      Requires visiting the page-init endpoint before the search endpoint will
 *      accept requests (server ties search access to that view having been "opened").
 *   2. ams.korea.ac.kr (public, no login) — the syllabus URL is stateless per-course,
 *      but the page is client-rendered, so Playwright is used to read it.
 *   3. Voyage AI (voyage-4, 1024-dim) embeds the combined course text.
 *   4. Supabase (service role) upserts into `courses`.
 *
 * Run with: npm run scrape:courses
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SUGANG_BASE = "https://sugang.korea.ac.kr";
const ATTACHMENT_EXTENSIONS = [
  "hwp", "hwpx", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
];

// Pilot scope: 문과대학(0143) / 철학과(0147), 전공(0136), 학사(00), 서울(1)
const PILOT_QUERY = {
  year: "2026",
  term: "2R",
  campus: "1",
  gradCd: "0136",
  courDiv: "00",
  col: "0143",
  dept: "0147",
};

interface CourseRow {
  YEAR: string;
  TERM: string;
  GRAD_CD: string;
  DEPT_CD: string;
  COL_CD: string;
  COUR_CD: string;
  COUR_NM: string;
  DEPARTMENT: string;
  ISU_NM: string;
  CREDIT: string;
  PROF_NM: string;
  TIME_ROOM: string;
  PARAMS: string; // "COUR_CD@section"
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// --- Step 1: course list via plain HTTP -----------------------------------

class CookieJar {
  private cookies = new Map<string, string>();

  absorb(res: Response) {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const pair = raw.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq > -1) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function fetchCourseList(query: typeof PILOT_QUERY): Promise<CourseRow[]> {
  const jar = new CookieJar();

  const homeRes = await fetch(`${SUGANG_BASE}/`);
  jar.absorb(homeRes);

  // Establishes server-side "view opened" state; required before the search
  // endpoint below will accept requests.
  const initRes = await fetch(`${SUGANG_BASE}/p/v/lectHakbu`, {
    method: "POST",
    headers: {
      Cookie: jar.header(),
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${SUGANG_BASE}/`,
    },
  });
  jar.absorb(initRes);

  const body = new URLSearchParams({
    pYear: query.year,
    pTerm: query.term,
    pCampus: query.campus,
    pGradCd: query.gradCd,
    pCourDiv: query.courDiv,
    pCol: query.col,
    pDept: query.dept,
    pCredit: "",
    pDay: "",
    pStartTime: "",
    pEndTime: "",
    pProf: "",
    pCourCd: "",
    pCourNm: "",
    strYear: query.year,
    strTerm: query.term,
  });

  const searchRes = await fetch(`${SUGANG_BASE}/d/v/lectHakbu`, {
    method: "POST",
    headers: {
      Cookie: jar.header(),
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${SUGANG_BASE}/`,
    },
    body: body.toString(),
  });

  const data = await searchRes.json();
  if (String(data.code) !== "200") {
    throw new Error(`lectHakbu search failed: ${data.code} ${data.message}`);
  }
  return data.rows as CourseRow[];
}

// --- Step 2: syllabus detail via Playwright --------------------------------

function buildSyllabusUrl(row: CourseRow): string {
  const section = row.PARAMS.split("@")[1] ?? "00";
  const params = {
    syy: row.YEAR,
    smtDivcd: row.TERM,
    faclyGschDeptCd: row.GRAD_CD,
    estblDeprtCd: row.DEPT_CD,
    sbjtnb: row.COUR_CD,
    dvcno: section,
  };
  const encoded = Buffer.from(JSON.stringify(params)).toString("base64");
  return `https://ams.korea.ac.kr/com/lgin/SsoCtr/initExtPageWork.do?link=lctreSylla&locale=ko&params=${encodeURIComponent(encoded)}&swit_call_browser=Y`;
}

interface SyllabusResult {
  syllabusText: string;
  attachments: { name: string; href: string }[];
}

async function scrapeSyllabus(browser: import("playwright").Browser, url: string): Promise<SyllabusResult> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1500);

  const syllabusText = await page
    .locator('textarea[aria-label="강의요목"]')
    .first()
    .inputValue()
    .catch(() => "");

  const attachments: { name: string; href: string }[] = [];
  const links = await page.locator("a[href]").all();
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (!href) continue;
    const name = (await link.innerText().catch(() => "")).trim();
    const extMatch = /\.([a-z0-9]+)(?:\?|$)/i.exec(href) ?? /\.([a-z0-9]+)$/i.exec(name);
    const ext = extMatch?.[1]?.toLowerCase();
    if (ext && ATTACHMENT_EXTENSIONS.includes(ext)) {
      attachments.push({ name: name || href, href });
    }
  }

  await context.close();
  return { syllabusText, attachments };
}

async function extractAttachmentText(
  browser: import("playwright").Browser,
  baseUrl: string,
  href: string
): Promise<string | null> {
  const absoluteUrl = new URL(href, baseUrl).toString();
  const ext = absoluteUrl.split(".").pop()?.toLowerCase().split("?")[0] ?? "";

  const context = await browser.newContext();
  try {
    const response = await context.request.get(absoluteUrl);
    if (!response.ok()) return null;
    const buffer = await response.body();

    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text;
    }
    if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }
    // hwp/hwpx: no reliable pure-JS parser available yet — record that the
    // attachment exists without extracting its text.
    return null;
  } catch (err) {
    console.warn(`  첨부파일 텍스트 추출 실패 (${absoluteUrl}):`, (err as Error).message);
    return null;
  } finally {
    await context.close();
  }
}

// --- Step 3: embeddings -----------------------------------------------------

async function embed(text: string, inputType: "document" | "query"): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("VOYAGE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-4",
      input_type: inputType,
      output_dimension: 1024,
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage embedding failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

// --- Main --------------------------------------------------------------

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  console.log("과목 목록 조회 중 (철학과)...");
  const rows = await fetchCourseList(PILOT_QUERY);
  console.log(`${rows.length}개 과목 발견`);

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [i, row] of rows.entries()) {
      const section = row.PARAMS.split("@")[1] ?? "00";
      console.log(`[${i + 1}/${rows.length}] ${row.COUR_CD}-${section} ${row.COUR_NM}`);

      const syllabusUrl = buildSyllabusUrl(row);
      const { syllabusText, attachments } = await scrapeSyllabus(browser, syllabusUrl);

      let attachmentText: string | null = null;
      if (attachments.length > 0) {
        console.log(`  첨부파일 ${attachments.length}개 발견`);
        const texts: string[] = [];
        for (const att of attachments) {
          const text = await extractAttachmentText(browser, syllabusUrl, att.href);
          if (text) texts.push(text);
          await sleep(300);
        }
        attachmentText = texts.length > 0 ? texts.join("\n\n") : null;
      }

      const embeddingInput = [
        row.COUR_NM,
        row.DEPARTMENT,
        row.ISU_NM,
        syllabusText,
        attachmentText,
      ]
        .filter(Boolean)
        .join("\n\n");

      const embedding = await embed(embeddingInput, "document");

      const { error } = await supabase.from("courses").upsert(
        {
          year: row.YEAR,
          term: row.TERM,
          course_code: row.COUR_CD,
          section,
          course_name: row.COUR_NM,
          department: row.DEPARTMENT,
          college_code: row.COL_CD,
          completion_type: row.ISU_NM,
          credit: row.CREDIT,
          instructor: row.PROF_NM,
          schedule: row.TIME_ROOM,
          syllabus_text: syllabusText,
          attachment_text: attachmentText,
          has_attachment: attachments.length > 0,
          source_url: syllabusUrl,
          embedding,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "year,term,course_code,section" }
      );

      if (error) {
        console.error(`  저장 실패:`, error.message);
      } else {
        console.log(`  저장 완료`);
      }

      await sleep(400);
    }
  } finally {
    await browser.close();
  }

  console.log("완료.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
