-- CreateTable
CREATE TABLE "TodoAudit" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "todoId" UUID NOT NULL,
    "operatorId" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "traceId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoAudit_todoId_createdAt_idx" ON "TodoAudit"("todoId", "createdAt");

-- CreateIndex
CREATE INDEX "TodoAudit_operatorId_createdAt_idx" ON "TodoAudit"("operatorId", "createdAt");

-- CreateIndex
CREATE INDEX "TodoAudit_action_createdAt_idx" ON "TodoAudit"("action", "createdAt");
