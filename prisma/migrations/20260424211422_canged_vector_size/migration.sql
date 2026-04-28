/*
  Warnings:

  - You are about to drop the column `sourceLable` on the `document_embeddings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document_embeddings" DROP COLUMN "sourceLable",
ADD COLUMN     "sourceLabel" TEXT;
