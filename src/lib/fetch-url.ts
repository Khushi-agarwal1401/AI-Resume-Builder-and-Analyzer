import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  const [a, b] = parts;
  if (a === 0) return true; // "this" network
  if (a === 10) return true; // RFC 1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC 1918
  if (a === 192 && b === 168) return true; // RFC 1918
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 unique local
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10 link-local
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — reuse the IPv4 checks so the whole
  // RFC1918 range (incl. 172.17–172.31) is covered, not just a few prefixes.
  if (lower.startsWith("::ffff:")) {
    return isPrivateIPv4(lower.slice(7));
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  return isIP(ip) === 4 ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

async function hostnameIsSafe(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase().replace(/\.$/, "");
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".lan")
  ) {
    return false;
  }
  const ipVersion = isIP(lower);
  if (ipVersion) return !isPrivateIp(lower);
  try {
    const addresses = await lookup(lower, { all: true });
    return addresses.every((addr) => !isPrivateIp(addr.address));
  } catch {
    return false;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches a job-description URL server-side with SSRF guards.
 * Returns plain-text content extracted from the page.
 */
export async function fetchUrlText(
  rawUrl: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL. Please enter a valid job post URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http(s) URLs are supported." };
  }
  if (!(await hostnameIsSafe(url.hostname))) {
    return { ok: false, error: "This URL could not be accessed securely." };
  }

  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!(await hostnameIsSafe(currentUrl.hostname))) {
      return { ok: false, error: "This URL could not be accessed securely." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ResumeAI/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return { ok: false, error: "The URL redirected without a destination." };
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      if (!res.ok) {
        return { ok: false, error: `The page returned an error (HTTP ${res.status}).` };
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_BYTES) {
        return { ok: false, error: "The page is too large to analyze." };
      }
      const html = new TextDecoder("utf-8").decode(buffer);
      const text = htmlToText(html);
      if (text.length < 10) {
        return { ok: false, error: "No readable content found at that URL." };
      }
      return { ok: true, text: text.slice(0, 20000) };
    } catch {
      return {
        ok: false,
        error: "Could not fetch the job description from that URL. It may be unreachable or blocked.",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  return { ok: false, error: "Too many redirects." };
}
