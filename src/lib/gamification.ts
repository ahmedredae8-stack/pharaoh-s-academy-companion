// سلسلة الأيام والشارات — محسوبة من نشاط المستخدم الحقيقي.
export type ActivityDay = string; // YYYY-MM-DD

export type Badge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

export function toDayKey(iso: string): ActivityDay {
  return new Date(iso).toISOString().slice(0, 10);
}

function shiftDay(day: ActivityDay, delta: number): ActivityDay {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function computeStreak(days: ActivityDay[]): { current: number; longest: number } {
  const unique = Array.from(new Set(days)).sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    run = unique[i] === shiftDay(unique[i - 1]!, 1) ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const today = new Date().toISOString().slice(0, 10);
  const last = unique[unique.length - 1]!;
  let current = 0;
  if (last === today || last === shiftDay(today, -1)) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i--) {
      if (unique[i - 1] === shiftDay(unique[i]!, -1)) current++;
      else break;
    }
  }
  return { current, longest };
}

export type BadgeInput = {
  labCount: number;
  quizCount: number;
  perfectQuizzes: number;
  currentStreak: number;
  longestStreak: number;
  isPro: boolean;
};

export function computeBadges(input: BadgeInput): Badge[] {
  return [
    {
      id: "first_lab",
      title: "أول معمل",
      description: "أنهيت أول تجربة عملية",
      earned: input.labCount >= 1,
    },
    {
      id: "lab_10",
      title: "يد على لوحة المفاتيح",
      description: "10 معامل مكتملة",
      earned: input.labCount >= 10,
    },
    {
      id: "lab_30",
      title: "ممارس ميداني",
      description: "30 معملًا مكتملًا",
      earned: input.labCount >= 30,
    },
    {
      id: "quiz_5",
      title: "عقل يقظ",
      description: "5 اختبارات مكتملة",
      earned: input.quizCount >= 5,
    },
    {
      id: "perfect_3",
      title: "دقة القنّاص",
      description: "3 اختبارات بدرجة كاملة",
      earned: input.perfectQuizzes >= 3,
    },
    {
      id: "streak_7",
      title: "أسبوع متواصل",
      description: "7 أيام متتالية من التعلّم",
      earned: input.longestStreak >= 7,
    },
    {
      id: "streak_30",
      title: "انضباط الفرعون",
      description: "30 يومًا متتاليًا",
      earned: input.longestStreak >= 30,
    },
    {
      id: "pro",
      title: "عضو Pro",
      description: "وصول كامل لكل المسارات",
      earned: input.isPro,
    },
  ];
}