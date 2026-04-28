/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "../../config/env";
import AppError from "../../shared/AppError";

export class EmbeddingService {
  private apikey: string;
  private apiurl: string = "https://openrouter.ai/api/v1";
  private embeddingModel: string;

  constructor() {
    this.apikey = config.OPENROUTER_API_KEY || "";
    this.embeddingModel =
      config.OPENROUTER_API_KEY || "nvidia/llama-nemotron-embed-vl-1b-v2:free";

    if (!this.apikey) {
      throw new AppError(500, "Openrouter api key is required");
    }

    if (!this.embeddingModel) {
      throw new AppError(500, "Openrouter emdedding model is required");
    }

    if (!this.apiurl) {
      throw new AppError(500, "Openrouter api url is required");
    }
  }

  async generateEmbedding(content: string) {
    try {
      const response = await fetch(`${this.apiurl}/embeddings`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${this.apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: content,
          model: this.embeddingModel,
        }),
      });

      if (!response.ok) {
        throw new AppError(422, "Failed to generate embedding");
      }

      const data = await response.json();

      console.log(data);

      return data.data[0].embedding;
    } catch (err: any) {
      console.log(err);
      throw new AppError(500, "Internal server error");
    }
  }
}
