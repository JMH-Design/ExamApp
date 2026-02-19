const STORAGE_KEY = "exam-app-onboarding";

export type CourseSelection = {
  id: string;
  name: string;
  textbook?: {
    title: string;
    authors: string;
    year?: string;
    coverUrl?: string;
  } | null;
  topics?: string[];
  skipped?: boolean;
};

export type OnboardingData = {
  schoolId: string;
  schoolName: string;
  programId: string;
  programName: string;
  semester: string;
  /** @deprecated Use selectedCourses instead */
  textbook?: {
    title: string;
    authors: string;
    year?: string;
    coverUrl?: string;
  };
  /** @deprecated Use selectedCourses[].topics instead */
  topics?: string[];
  selectedCourses?: CourseSelection[];
  /** Set when user completes courses step with 0 courses available */
  completedWithoutCourses?: boolean;
};

export function getOnboardingData(): OnboardingData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingData) : null;
  } catch {
    return null;
  }
}

export function setOnboardingData(data: Partial<OnboardingData>) {
  if (typeof window === "undefined") return;
  try {
    const existing = getOnboardingData() ?? ({} as OnboardingData);
    const merged = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function updateCourseSelection(
  index: number,
  update: Partial<CourseSelection>
) {
  if (typeof window === "undefined") return;
  try {
    const data = getOnboardingData();
    const courses = data?.selectedCourses ?? [];
    if (index < 0 || index >= courses.length) return;
    const updated = [...courses];
    updated[index] = { ...updated[index], ...update };
    setOnboardingData({ selectedCourses: updated });
  } catch {
    // ignore
  }
}

export function hasCompletedOnboarding(): boolean {
  const data = getOnboardingData();
  if (!data?.schoolId || !data?.programId || !data?.semester) return false;
  // Legacy: single textbook
  if (data.textbook) return true;
  // Completed courses step with no courses available
  if (data.completedWithoutCourses) return true;
  // New: selectedCourses with all processed
  const courses = data.selectedCourses ?? [];
  if (courses.length === 0) return false;
  return courses.every(
    (c) => c.textbook != null || c.skipped === true
  );
}
