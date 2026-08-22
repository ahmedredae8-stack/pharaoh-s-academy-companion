// Thin typed bridge over the legacy lesson engine so the Duolingo shell can drive it.
export type LegacyLesson = {
  index: number;
  title: string;
  storyTitle: string;
  lab: string;
  quiz: number;
};

export type LegacyPath = {
  title: string;
  description: string;
  lessons: LegacyLesson[];
};

export type LegacyProgress = Record<string, number | Record<string, unknown>>;

declare global {
  interface Window {
    __pharaohDuo?: boolean;
    __pharaohApi?: {
      getPaths: () => Record<string, LegacyPath>;
      getProgress: () => LegacyProgress;
      open: (pathId: string, index: number) => void;
      reload: () => Promise<void> | undefined;
    };
  }
}

export function unlockedIndex(progress: LegacyProgress, pathId: string): number {
  const value = progress[`${pathId}UnlockedLesson`];
  return typeof value === "number" ? value : pathId === "beginner" ? 0 : -1;
}
