export function parseCookies(cookieHeader) {
  const result = {};
  const header = cookieHeader || "";
  header.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) result[key] = decodeURIComponent(rest.join("="));
  });
  return result;
}

export function setSessionCookie(res, token) {
  const secure = process.env.ADMIN_COOKIE_SECURE === "1" ? "; Secure" : "";
  const maxAge = 60 * 60 * 12;
  res.setHeader(
    "Set-Cookie",
    `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}
