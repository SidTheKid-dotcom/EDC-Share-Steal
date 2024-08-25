/*
  Warnings:

  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Game` table. All the data in the column will be lost.
  - The primary key for the `Move` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Move` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Move" DROP CONSTRAINT "Move_gameId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activeGameId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "id",
ADD COLUMN     "gameId" SERIAL NOT NULL,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("gameId");

-- AlterTable
ALTER TABLE "Move" DROP CONSTRAINT "Move_pkey",
DROP COLUMN "id",
ADD COLUMN     "moveId" SERIAL NOT NULL,
ADD CONSTRAINT "Move_pkey" PRIMARY KEY ("moveId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeGameId_fkey" FOREIGN KEY ("activeGameId") REFERENCES "Game"("gameId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("gameId") ON DELETE RESTRICT ON UPDATE CASCADE;
