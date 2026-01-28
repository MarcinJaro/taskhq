import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tasks").collect();
    if (existing.length > 0) {
      return "Already seeded";
    }

    const now = Date.now();

    const tasks = [
      {
        title: "Zaprojektować landing page",
        description: "Nowy design landing page dla projektu NS z uwzględnieniem mobilnej wersji",
        status: "in_progress" as const,
        priority: "high" as const,
        project: "NS" as const,
        deadline: "2026-02-15",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Naprawa buga w logowaniu",
        description: "Użytkownicy raportują problem z logowaniem przez Google OAuth",
        status: "todo" as const,
        priority: "high" as const,
        project: "CR" as const,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Setup CI/CD pipeline",
        description: "Konfiguracja GitHub Actions dla automatycznego deploymentu",
        status: "backlog" as const,
        priority: "medium" as const,
        project: "BuzzGen" as const,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Analiza SEO konkurencji",
        description: "Zebrać dane SEO top 10 konkurentów i przygotować raport",
        status: "review" as const,
        priority: "medium" as const,
        project: "BuzzRank" as const,
        deadline: "2026-02-01",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Dodać eksport do PDF",
        description: "Funkcja eksportu notatek do formatu PDF",
        status: "done" as const,
        priority: "low" as const,
        project: "Cherrypad" as const,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const task of tasks) {
      await ctx.db.insert("tasks", task);
    }

    return "Seeded 5 tasks";
  },
});
