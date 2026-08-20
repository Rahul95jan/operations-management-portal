export const RESOURCE_TYPES = [
  { value: "github", label: "GitHub Repository Link", kind: "url", icon: "🐙" },
  { value: "github_file", label: "GitHub File/Folder Link", kind: "url", icon: "🐙" },
  { value: "notion", label: "Notion Link", kind: "url", icon: "📓" },
  { value: "google_drive", label: "Google Drive Link", kind: "url", icon: "📁" },
  { value: "google_docs", label: "Google Docs Link", kind: "url", icon: "📄" },
  { value: "google_sheets", label: "Google Sheets Link", kind: "url", icon: "📊" },
  { value: "pdf", label: "PDF", kind: "file", icon: "📕" },
  { value: "image", label: "Image (JPG / JPEG / PNG)", kind: "file", icon: "🖼️" },
  { value: "ppt", label: "PPT / PPTX", kind: "file", icon: "📽️" },
  { value: "doc", label: "DOC / DOCX", kind: "file", icon: "📝" },
  { value: "xls", label: "XLS / XLSX", kind: "file", icon: "📈" },
  { value: "zip", label: "ZIP", kind: "file", icon: "🗜️" },
  { value: "other", label: "Other", kind: "both", icon: "📎" },
];

export function typeConfig(value) {
  return RESOURCE_TYPES.find((t) => t.value === value) || null;
}
