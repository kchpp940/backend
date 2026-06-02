-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Todo" ADD COLUMN "dueDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Todo_userId_priority_createdAt_idx" ON "Todo"("userId", "priority", "createdAt");
CREATE INDEX "Todo_userId_dueDate_createdAt_idx" ON "Todo"("userId", "dueDate", "createdAt");
