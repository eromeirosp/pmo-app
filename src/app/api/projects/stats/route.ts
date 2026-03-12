import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        classification: true,
        budget: true,
        manager: true,
        createdAt: true,
      },
    });

    // Status distribution
    const statusCounts = {
      GREEN: projects.filter((p) => p.status === "GREEN").length,
      YELLOW: projects.filter((p) => p.status === "YELLOW").length,
      RED: projects.filter((p) => p.status === "RED").length,
    };

    // Classification distribution
    const classificationCounts = {
      TRADITIONAL: projects.filter((p) => p.classification === "TRADITIONAL")
        .length,
      AGILE: projects.filter((p) => p.classification === "AGILE").length,
      HYBRID: projects.filter((p) => p.classification === "HYBRID").length,
    };

    // Budget metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const avgBudget = projects.length > 0 ? totalBudget / projects.length : 0;

    // Top 5 projects by budget
    const topByBudget = [...projects]
      .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
      .slice(0, 5)
      .map((p) => ({
        name:
          p.name.length > 22 ? p.name.substring(0, 22) + "…" : p.name,
        budget: p.budget ?? 0,
        status: p.status,
      }));

    // Projects per month — last 6 months
    const now = new Date();
    const months: { label: string; year: number; month: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      });
    }

    projects.forEach((p) => {
      const d = new Date(p.createdAt);
      const m = months.find(
        (mo) => mo.year === d.getFullYear() && mo.month === d.getMonth()
      );
      if (m) m.count++;
    });

    const projectsPerMonth = months.map(({ label, count }) => ({
      month: label,
      projetos: count,
    }));

    return NextResponse.json({
      total: projects.length,
      statusCounts,
      classificationCounts,
      totalBudget,
      avgBudget,
      topByBudget,
      projectsPerMonth,
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
