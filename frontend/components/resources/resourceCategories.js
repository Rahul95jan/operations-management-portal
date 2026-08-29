export const RESOURCE_CATEGORIES = [
  { value: "session_notes", label: "Session Notes", icon: "📝" },
  { value: "code_notebook", label: "Code / Notebook", icon: "💻" },
  { value: "assignment", label: "Assignment", icon: "📋" },
  { value: "presentation", label: "Presentation", icon: "🖥️" },
  { value: "reference_material", label: "Reference Material", icon: "📚" },
  { value: "recording", label: "Recording", icon: "🎥" },
  { value: "project_files", label: "Project Files", icon: "🗂️" },
  { value: "other", label: "Other", icon: "📎" },
];

export function categoryConfig(value) {
  return RESOURCE_CATEGORIES.find((c) => c.value === value) || null;
}
