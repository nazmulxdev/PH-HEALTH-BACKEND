import { Router } from "express";
import { ragController } from "./rag.controller";

const router = Router();

router.get("/stats", ragController.getStats);

router.post("/ingest-doctors", ragController.ingestDoctors);

//

router.post("/query", ragController.queryRag);

export const ragRoutes = router;
