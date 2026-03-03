import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Example: A webhook payload comes from Jira/DevOps indicating a task/risk change
        // payload: { event: "issue_updated", type: "RISK", externalId: "RSK-123", newStatus: "OCCURRED", projectId: "uuid" }

        if (payload.type === "RISK" && payload.newStatus && payload.projectId) {

            // Let's pretend the externalId is passed or mapped to our internal id for demo purposes.
            // Usually, we would map an externalId field. For this demo, let's assume `payload.internalRiskId`
            const { internalRiskId, newStatus } = payload;

            if (internalRiskId) {
                const updatedRisk = await prisma.risk.update({
                    where: { id: internalRiskId },
                    data: { status: newStatus }
                });

                // Notification Logic: Alert if a risk occurred
                if (newStatus === "OCCURRED") {
                    console.log(`[ALERT] RISK OCCURRED! The risk "${updatedRisk.description}" has materialized in project ${payload.projectId}.`);

                    // Update the project status to RED automatically
                    await prisma.project.update({
                        where: { id: payload.projectId },
                        data: { status: "RED" }
                    });
                }
                return NextResponse.json({ success: true, risk: updatedRisk }, { status: 200 });
            }
        }

        return NextResponse.json({ success: true, message: "Webhook processed, no action taken" }, { status: 200 });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
    }
}
