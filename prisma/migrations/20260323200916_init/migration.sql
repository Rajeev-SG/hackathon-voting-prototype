-- CreateEnum
CREATE TYPE "VotingStatus" AS ENUM ('PREPARING', 'OPEN', 'FINALIZED');

-- CreateTable
CREATE TABLE "CompetitionState" (
    "id" INTEGER NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "votingStatus" "VotingStatus" NOT NULL DEFAULT 'PREPARING',
    "startedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "teamName" TEXT,
    "track" TEXT,
    "booth" TEXT,
    "summary" TEXT,
    "demoUrl" TEXT,
    "repositoryUrl" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryTeamEmail" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryTeamEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "judgeEmail" TEXT NOT NULL,
    "judgeUserId" TEXT,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_slug_key" ON "Entry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EntryTeamEmail_entryId_email_key" ON "EntryTeamEmail"("entryId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_entryId_judgeEmail_key" ON "Vote"("entryId", "judgeEmail");

-- AddForeignKey
ALTER TABLE "EntryTeamEmail" ADD CONSTRAINT "EntryTeamEmail_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
