-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Automation_createdById_idx" ON "Automation"("createdById");

-- CreateIndex
CREATE INDEX "DriveFile_taskId_idx" ON "DriveFile"("taskId");

-- CreateIndex
CREATE INDEX "DriveFile_requisitionId_idx" ON "DriveFile"("requisitionId");

-- CreateIndex
CREATE INDEX "DriveFile_uploadedById_idx" ON "DriveFile"("uploadedById");

-- CreateIndex
CREATE INDEX "Goal_month_userId_idx" ON "Goal"("month", "userId");

-- CreateIndex
CREATE INDEX "GoalChecklistItem_goalId_idx" ON "GoalChecklistItem"("goalId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Post_taskId_idx" ON "Post"("taskId");

-- CreateIndex
CREATE INDEX "Post_projectId_idx" ON "Post"("projectId");

-- CreateIndex
CREATE INDEX "Post_productId_idx" ON "Post"("productId");

-- CreateIndex
CREATE INDEX "Post_assigneeId_idx" ON "Post"("assigneeId");

-- CreateIndex
CREATE INDEX "Post_scheduledDate_idx" ON "Post"("scheduledDate");

-- CreateIndex
CREATE INDEX "Product_projectId_idx" ON "Product"("projectId");

-- CreateIndex
CREATE INDEX "Project_leadId_idx" ON "Project"("leadId");

-- CreateIndex
CREATE INDEX "Requisition_fromUserId_idx" ON "Requisition"("fromUserId");

-- CreateIndex
CREATE INDEX "Requisition_toUserId_idx" ON "Requisition"("toUserId");

-- CreateIndex
CREATE INDEX "Requisition_taskId_idx" ON "Requisition"("taskId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_productId_idx" ON "Task"("productId");

-- CreateIndex
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnId_idx" ON "TaskDependency"("dependsOnId");

-- CreateIndex
CREATE INDEX "TaskHistoryEntry_taskId_idx" ON "TaskHistoryEntry"("taskId");
