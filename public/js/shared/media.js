export function auditImageUrl(path) {
  return `/api/audit-image?path=${encodeURIComponent(path)}`;
}

export function createObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

export function downloadUrl(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
