// Small shared utilities

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateClassCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export function initials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateTime(ts?: number | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(ts?: number | null): string {
  if (!ts) return "-";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} mnt lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return formatDateTime(ts);
}

export function formatNumberID(n: number, digits = 3): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: digits });
}

/** Map Firebase auth error codes to friendly Indonesian messages. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/user-disabled":
      return "Akun ini dinonaktifkan. Hubungi admin.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau password salah.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar.";
    case "auth/weak-password":
      return "Password terlalu lemah (minimal 6 karakter).";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
    case "auth/network-request-failed":
      return "Gagal terhubung ke server. Periksa koneksi internet.";
    case "auth/requires-recent-login":
      return "Demi keamanan, silakan login ulang lalu coba lagi.";
    default:
      return "Terjadi kesalahan. Silakan coba lagi.";
  }
}
