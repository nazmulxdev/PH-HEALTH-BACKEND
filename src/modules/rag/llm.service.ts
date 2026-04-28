/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "../../config/env";
import AppError from "../../shared/AppError";

export class LLMService {
  private apikey: string;
  private apiurl: string = "https://openrouter.ai/api/v1";
  private model: string;

  constructor() {
    this.apikey = config.OPENROUTER_API_KEY || "";
    this.model =
      config.OENROUTER_LLM_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

    if (!this.apikey) {
      throw new AppError(500, "Openrouter api key is required");
    }

    if (!this.model) {
      throw new AppError(500, "Openrouter model is required");
    }
  }

  async generateResponse(
    prompt: string,
    context: string[],
    asJson: boolean = false,
  ) {
    try {
      let fullPrompt =
        context.length > 0
          ? ` Context information :\n${context.join("\n")}\n\nQuestion: ${prompt}\n\nAnswer based on the context above.`
          : prompt;

      if (asJson) {
        fullPrompt +=
          '\n\nReturn the answer in JSON format with the following structure: {\n  "name": "",\n  "specialty": "",\n  "rating": "",\n  "experience": "",\n  "workingPlace": "",\n  "consultationFee": "",\n  "qualification": "",\n  "designation": "",\n  "reviews": [\n    {\n      "rating": "",\n      "comment": ""\n    }\n  ]\n}';
      }

      const systemMessage = asJson
        ? "You are a helpful assistant that answers questions about doctors and provides responses in JSON format."
        : "You are a helpful assistant that answers questions about doctors.";

      const bodyPayload: any = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      };

      if (
        asJson &&
        (this.model.includes("gpt") || this.model.includes("openai"))
      ) {
        bodyPayload.response_format = { type: "json_object" };
      }

      const response = await fetch(`${this.apiurl}/chat/completions`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${this.apikey}`,
          "Content-Type": "application/json",
          "X-Title": "Healthcare Managemant System",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new AppError(
          response.status,
          `OpenRouter API error: ${errorText}`,
        );
      }

      const data = await response.json();

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error("Error generating response from LLM:", error);
      throw new AppError(500, "Failed to generate response");
    }
  }
}
