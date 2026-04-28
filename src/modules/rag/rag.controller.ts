import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";
import { RagService } from "./rag.service";
import AppError from "../../shared/AppError";
import { redisService } from "../../lib/redis";

const ragService = new RagService();

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await ragService.getStats();
  AppResponse(res, {
    message: "Stats retrieved successfully",
    statusCode: 200,
    success: true,
    data: result,
  });
});

const ingestDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await ragService.ingestDoctors();
  AppResponse(res, {
    message: "Doctors ingested successfully",
    statusCode: 200,
    success: true,
    data: result,
  });
});

const queryRag = catchAsync(async (req: Request, res: Response) => {
  const { query, limit, sourceType, asJson } = req.body;
  if (!query) {
    throw new AppError(400, "Query is required");
  }

  // cache hit

  const cacheKey = `rag:query:${query}:${limit ?? 5}:${sourceType || "all"}`;
  try {
    const cachedResult = await redisService?.get(cacheKey);
    if (cachedResult) {
      const parsedData = JSON.parse(cachedResult);
      AppResponse(res, {
        message: "Query successful from cache",
        statusCode: 200,
        success: true,
        data: parsedData,
      });
    }
  } catch (error) {
    console.warn("Cache fetch failed, proceeding to database.", error);
  }

  // cache miss
  const result = await ragService.generateAnswer(
    query,
    limit ?? 5,
    sourceType ?? "DOCTOR",
    asJson ?? false,
  );

  // cache the result

  try {
    const dataToCache = JSON.stringify(result);
    await redisService?.set(cacheKey, dataToCache, 60 * 60 * 24);
  } catch (error) {
    console.warn("Cache set failed, proceeding to database.", error);
  }

  AppResponse(res, {
    message: "Query successful",
    statusCode: 200,
    success: true,
    data: result,
  });
});

export const ragController = {
  getStats,
  ingestDoctors,
  queryRag,
};
