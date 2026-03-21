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
        expectedReturn: true,
        manager: true,
        department: true,
        createdAt: true,
      },
    });

    // Status & classification distribution (single pass)
    const statusCounts: Record<string, number> = { GREEN: 0, YELLOW: 0, RED: 0 };
    const classificationCounts: Record<string, number> = { TRADITIONAL: 0, AGILE: 0, HYBRID: 0 };
    const departmentCounts: Record<string, number> = {};
    for (const p of projects) {
      if (p.status in statusCounts) statusCounts[p.status]++;
      if (p.classification && p.classification in classificationCounts) classificationCounts[p.classification]++;
      const dept = p.department || "Sem Departamento";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    }

    // Health score: weighted average (GREEN=100, YELLOW=50, RED=0)
    const healthScore = projects.length > 0
      ? Math.round(
          (statusCounts.GREEN * 100 + statusCounts.YELLOW * 50 + statusCounts.RED * 0) / projects.length
        )
      : 0;

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

    const monthMap = new Map(months.map((m) => [`${m.year}-${m.month}`, m]));
    for (const p of projects) {
      const d = new Date(p.createdAt);
      const m = monthMap.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.count++;
    }

    const projectsPerMonth = months.map(({ label, count }) => ({
      month: label,
      projetos: count,
    }));

    // ROI metrics
    const projectsWithROI = projects.filter(
      (p) => p.expectedReturn && p.budget > 0
    );
    const avgROI =
      projectsWithROI.length > 0
        ? projectsWithROI.reduce((sum, p) => {
            const roi = ((p.expectedReturn! - p.budget) / p.budget) * 100;
            return sum + roi;
          }, 0) / projectsWithROI.length
        : null;

    const topByROI = [...projectsWithROI]
      .map((p) => ({
        name:
          p.name.length > 22 ? p.name.substring(0, 22) + "…" : p.name,
        roi: Math.round(((p.expectedReturn! - p.budget) / p.budget) * 100),
        budget: p.budget,
        status: p.status,
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    return NextResponse.json({
      total: projects.length,
      statusCounts,
      classificationCounts,
      departmentCounts,
      healthScore,
      totalBudget,
      avgBudget,
      topByBudget,
      projectsPerMonth,
      avgROI: avgROI !== null ? Math.round(avgROI) : null,
      topByROI,
      projectsWithROICount: projectsWithROI.length,
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
