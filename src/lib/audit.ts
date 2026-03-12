import prisma from "./prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function recordAuditLog({
  projectId,
  action,
  entity,
  entityId,
  field,
  oldValue,
  newValue,
  userName = "Usuário Sistema",
}: {
  projectId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        projectId,
        action,
        entity,
        entityId,
        field,
        oldValue,
        newValue,
        userName,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Don't throw error to avoid breaking the main request
  }
}
