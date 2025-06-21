-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('ATTENDING', 'NOT_ATTENDING', 'TENTATIVE');

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitationId" TEXT NOT NULL,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_idx" ON "Rsvp"("invitationId");

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "UserInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
