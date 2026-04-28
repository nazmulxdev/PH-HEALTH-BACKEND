/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { EmbeddingService } from "./embedding.service";
import { IndexingService } from "./indexing.service";
import { LLMService } from "./llm.service";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

export class RagService {
  private embeddingService: EmbeddingService;
  private llmService: LLMService;
  private indexingService: IndexingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.indexingService = new IndexingService();
    this.llmService = new LLMService();
  }
  async ingestDoctors() {
    return this.indexingService.indexDoctorsData();
  }

  async retrieveReleventDocuments(
    query: string,
    limit: number = 5,
    sourceType?: string,
  ) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);

      const vectorLiteral = toVectorLiteral(embedding);

      const result = await prisma.$queryRaw(Prisma.sql`
        SELECT 
        "id",
        "chunkKey",
        "metadata",
        "sourceLabel",
        "updatedAt",
        "sourceType",
        "sourceId",
        "isDeleted",
        "deletedAt",
        "createdAt",
        "content" ,
        "embedding",
        1-(embedding <=> ${vectorLiteral} AS vector) AS similarity
        
        FROM "document_embeddings"
        WHERE "isDeleted" = false 
        ${sourceType ? Prisma.sql` AND "sourceType" = ${sourceType}` : Prisma.empty} 
        ORDER BY embedding <=> CAST(${vectorLiteral} AS vector) ASC
        LIMIT ${limit}       
        `);

      console.log("Retrieved documents", result);

      return result;
    } catch (error: any) {
      console.error(`Error retrieving relevant documents: ${error.message}`);
      throw new AppError(500, error.message);
    }
  }

  async generateAnswer(
    query: string,
    limit: number = 5,
    sourceType?: string,
    asJson: boolean = false,
  ) {
    try {
      const relaventDocs = await this.retrieveReleventDocuments(
        query,
        limit,
        sourceType,
      );

      //  EXTRACT THE CONTENT AND METADAT FROM THE RETRIEVED DOCUMENTS
      const context = (relaventDocs as any)
        .filter((doc: any) => doc.content)
        .map((doc: any) => doc.content);

      let answer = await this.llmService.generateResponse(
        query,
        context,
        asJson,
      );

      let parsedResult: any = answer;

      if (asJson) {
        try {
          // If the model wrapped the JSON in markdown blocks, clean it up
          if (answer.startsWith("```json")) {
            answer = answer
              .replace(/```json\n?/, "")
              .replace(/```$/, "")
              .trim();
          } else if (answer.startsWith("```")) {
            answer = answer
              .replace(/```\n?/, "")
              .replace(/```$/, "")
              .trim();
          }
          parsedResult = JSON.parse(answer);
          return {
            answer: parsedResult,
            sources: (relaventDocs as any).map((doc: any) => ({
              id: doc.id,
              chunkKey: doc.chunkKey,
              sourceType: doc.sourceType,
              sourceId: doc.sourceId,
              sourceLabel: doc.sourceLabel,
              content: doc.content,
              similarity: doc.similarity,
            })),
            contextUsed: context.length > 0,
          };
        } catch (e: any) {
          console.error("Failed to parse LLM JSON response:", e);
          throw new AppError(500, e.message);
        }
      }
    } catch (error: any) {
      console.error(`Error generating answer: ${error.message}`);
      throw new AppError(500, error.message);
    }
  }

  async getStats() {
    try {
      const totalDocuments = await prisma.$queryRaw(Prisma.sql`
        SELECT COUNT(*) as count FROM "document_embeddings" WHERE "isDeleted" = false;
        `);

      const sourceTypeCounts = await prisma.$queryRaw(Prisma.sql`
        SELECT "sourceType", COUNT(*) as count FROM "document_embeddings" WHERE "isDeleted" = false GROUP BY "sourceType"
        `);

      return {
        totalActiveDocuments: Number((totalDocuments as any)[0]?.count ?? 0),
        sourceTypeBreakdown: (sourceTypeCounts as any).reduce(
          (acc: any, curr: any) => {
            acc[curr.sourceType] = Number(curr.count);
            return acc;
          },
          {},
        ),
        timestamp: new Date(),
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
