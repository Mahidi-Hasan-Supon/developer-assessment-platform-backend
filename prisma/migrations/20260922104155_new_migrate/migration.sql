-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('MCQ', 'WRITTEN', 'CODING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'USED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'AUTO_SUBMITTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITATION', 'ASSESSMENT', 'SUBMISSION', 'RESULT', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('BKASH', 'STRIPE', 'SSLCOMMERZ');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'EVALUATED');

-- DropIndex
DROP INDEX "idx_candidate_profile_userId";

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "answer" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_problems" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "marks" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,

    CONSTRAINT "assessment_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passMarks" INTEGER NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "provider" "PaymentProvider" NOT NULL,
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ProblemType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "marks" INTEGER NOT NULL,
    "options" JSONB,
    "answer" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "totalCandidates" INTEGER NOT NULL DEFAULT 0,
    "completedCandidates" INTEGER NOT NULL DEFAULT 0,
    "passedCandidates" INTEGER NOT NULL DEFAULT 0,
    "failedCandidates" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "obtainedMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "evaluatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submissionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalMarks" INTEGER NOT NULL,
    "obtainedMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_answer_problemId" ON "answers"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_submissionId_problemId_key" ON "answers"("submissionId", "problemId");

-- CreateIndex
CREATE INDEX "idx_assessment_problem_assessmentId" ON "assessment_problems"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_assessment_problem_problemId" ON "assessment_problems"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_problems_assessmentId_problemId_key" ON "assessment_problems"("assessmentId", "problemId");

-- CreateIndex
CREATE INDEX "idx_assessment_companyId" ON "assessments"("companyId");

-- CreateIndex
CREATE INDEX "idx_assessment_status" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "idx_assessment_deletedAt" ON "assessments"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_assessment_company_status" ON "assessments"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_invitationId_key" ON "attempts"("invitationId");

-- CreateIndex
CREATE INDEX "idx_attempt_candidateId" ON "attempts"("candidateId");

-- CreateIndex
CREATE INDEX "idx_attempt_assessmentId" ON "attempts"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_attempt_status" ON "attempts"("status");

-- CreateIndex
CREATE INDEX "idx_attempt_expiresAt" ON "attempts"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_audit_log_userId" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "idx_audit_log_entity" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_log_createdAt" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "idx_invitation_candidateId" ON "invitations"("candidateId");

-- CreateIndex
CREATE INDEX "idx_invitation_assessmentId" ON "invitations"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_invitation_status" ON "invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_assessmentId_candidateId_key" ON "invitations"("assessmentId", "candidateId");

-- CreateIndex
CREATE INDEX "idx_notification_userId" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "idx_notification_isRead" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "idx_notification_createdAt" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "idx_payment_userId" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "idx_payment_assessmentId" ON "payments"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_payment_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payment_provider" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "idx_problem_createdBy" ON "problems"("createdBy");

-- CreateIndex
CREATE INDEX "idx_problem_type" ON "problems"("type");

-- CreateIndex
CREATE INDEX "idx_problem_difficulty" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "idx_problem_deletedAt" ON "problems"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_report_assessmentId" ON "reports"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_report_generatedBy" ON "reports"("generatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "results_submissionId_key" ON "results"("submissionId");

-- CreateIndex
CREATE INDEX "idx_result_candidateId" ON "results"("candidateId");

-- CreateIndex
CREATE INDEX "idx_result_assessmentId" ON "results"("assessmentId");

-- CreateIndex
CREATE INDEX "idx_result_status" ON "results"("status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_attemptId_key" ON "submissions"("attemptId");

-- CreateIndex
CREATE INDEX "idx_submission_status" ON "submissions"("status");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_problems" ADD CONSTRAINT "assessment_problems_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_problems" ADD CONSTRAINT "assessment_problems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
