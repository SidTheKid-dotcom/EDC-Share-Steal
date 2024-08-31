/*
  Warnings:

  - You are about to drop the column `gameNo` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "gameNo",
ADD COLUMN     "gameNoForSheets" INTEGER DEFAULT 1;
