/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { EmbeddingService } from "./embedding.service";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

export class IndexingService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async indexDocument(
    chunkKey: string,
    sourceType: string,
    sourceId: string,
    content: string,
    sourceLabel?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);

      const vectorLiteral = toVectorLiteral(embedding);

      await prisma.$executeRaw(Prisma.sql`
        
        INSERT INTO "document_embeddings"
        (

          "id"
          "chunkKey"
          "sourceType"
          "sourceId"
          "sourceLabel"
          "content"
          "metadata"
          "embedding"
          "updatedAt"

        )

        VALUES
        (
          ${Prisma.raw("gen_random_uuid()")},
          ${chunkKey},
          ${sourceType},
          ${sourceId},
          ${sourceLabel || null},
          ${content},
          ${JSON.stringify(metadata || {})} :: jsonb,
          CAST(${vectorLiteral} AS vector),
          NOW()
          
        )

        ON CONFLICT ("chunkKey") DO UPDATE SET
        "content" = EXCLUDED."content",
        "metadata" = EXCLUDED."metadata",
        "embedding" = EXCLUDED."embedding",
        "updatedAt" = NOW();
        
        `);
    } catch (error: any) {
      console.error(`Error indexing doctor: ${error.message}`);
      throw new AppError(500, error.message);
    }
  }

  async indexDoctorsData() {
    try {
      console.log("Fetching doctor data for indexing");

      const doctors = await prisma.doctor.findMany({
        where: {
          isDeleted: false,
        },
        include: {
          user: true,
          specialties: {
            include: {
              specialty: true,
            },
          },
          reviews: true,
        },
      });

      let indexedCount = 0;

      for (const doctor of doctors) {
        // formate specialities list
        const specialtiesList = doctor.specialties
          .map((specialty) => specialty.specialty.title)
          .join("\n");
        // formate reviews
        const reviewaTest = doctor.reviews
          .map(
            (review) =>
              `Rating: ${review.rating / 5}. \nComment: ${review.comment}`,
          )
          .join("\n");
        const reviewsList = reviewaTest || "No Comments";

        const content = `Name: ${doctor.user.name}\n
        Experience: ${doctor.experience} years\n
        Qualification: ${doctor.qualification}\n
        Designation: ${doctor.designation}\n
        Current Working Place: ${doctor.currentWorkingPlace}\n
        Consultation Fee: ${doctor.appointmentFee}\n
        Specialties: ${specialtiesList}\n
        Average Rating: ${doctor.averageRating}\n
        Reviews: ${reviewsList}\n
        `;

        const metadata = {
          doctorId: doctor.id,
          userId: doctor.user.id,
          name: doctor.user.name,
          qualification: doctor.qualification,
          designation: doctor.designation,
          specialties: specialtiesList,
          averageRating: doctor.averageRating,
          currentWorkingPlace: doctor.currentWorkingPlace,
          appointmentFee: doctor.appointmentFee,
          reviews: reviewsList,
          experience: doctor.experience,
        };

        const chunkKey = `doctor-${doctor.id}`;

        await this.indexDocument(
          chunkKey,
          content,
          "DOCTOR",
          doctor.id,
          doctor.user.name,
          metadata,
        );
        indexedCount++;
      }

      console.log(`Doctors data indexed successfully ${indexedCount}`);

      return {
        success: true,
        message: `Doctors data indexed successfully ${indexedCount}`,
        indexedCount,
      };
    } catch (error: any) {
      console.error(`Error indexing doctor data: ${error.message}`);
      throw new AppError(500, error.message);
    }
  }
}
