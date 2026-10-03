
// server/controllers/aiController.js

// Generate an AI description for the selected QC mistake type

exports.generateDescription = async (req, res) => {
  try {
    // 1. Validate frontend input
    const { mistakeType } = req.body || {};

    if (
      typeof mistakeType !== "string" ||
      !mistakeType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid mistake type.",
      });
    }

    const cleanMistakeType = mistakeType.trim();

    if (cleanMistakeType.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Mistake type cannot exceed 120 characters.",
      });
    }

    // 2. Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // 3. Import Gemini SDK
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // 4. Configure primary and fallback models
    const primaryModel =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const fallbackModels = (
      process.env.GEMINI_FALLBACK_MODELS ||
      "gemini-3.7-flash,gemini-3.6-flash"
    )
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);

    const models = [
      ...new Set([primaryModel, ...fallbackModels]),
    ];

    // 5. Prepare QC instructions
    const instructions = `
      You are an experienced Quality Control (QC) assistant
      working in a healthcare claims processing department.

      Generate a professional description based on the
      selected QC mistake category.

      Follow these rules:

      1. Write in simple, professional English.
      2. Generate one or two clear sentences.
      3. Explain the mistake type in a QC context.
      4. Do not invent claim details.
      5. Do not invent patient information.
      6. Do not invent ICD codes or medical information.
      7. Do not assume a particular claim was actually
         processed incorrectly.
      8. Do not include headings or bullet points.
      9. Return only the description.
      10. Keep it suitable for a QC mistake report.
    `;

    // 6. Try models one by one
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[Gemini] Trying model: ${model}`);

        const response = await ai.models.generateContent({
          model,

          contents: `
            ${instructions}

            Selected QC Mistake Type: ${cleanMistakeType}

            Generate a professional QC description.
          `,

          config: {
            maxOutputTokens: 120,
          },
        });

        const description = response.text?.trim();

        if (!description) {
          throw new Error(
            `Model ${model} returned an empty response.`
          );
        }

        console.log(
          `[Gemini] Description generated successfully using ${model}`
        );

        return res.status(200).json({
          success: true,
          description,
          modelUsed: model,
        });

      } catch (error) {
        lastError = error;

        // Extract status from SDK error
        let status = Number(
          error.status || error.statusCode || 0
        );

        // Some SDK errors contain JSON inside error.message
        if (!status && typeof error.message === "string") {
          try {
            const parsed = JSON.parse(error.message);

            status = Number(
              parsed.error?.code ||
              parsed.code ||
              0
            );
          } catch {
            // Keep original error if message is not JSON
          }
        }

        console.error(
          `[Gemini] Model ${model} failed:`,
          {
            status,
            message: error.message,
          }
        );

        // Retry using another model only for
        // temporary availability or rate-limit errors.
        if (status === 503 || status === 429) {
          console.log(
            `[Gemini] Switching from ${model} to the next fallback model.`
          );

          continue;
        }

        // Authentication, permission, model and
        // other configuration errors should not be hidden.
        if (status === 401 || status === 403) {
          return res.status(503).json({
            success: false,
            message:
              "Gemini authentication failed. Check API key and permissions.",
          });
        }

        if (status === 404) {
          return res.status(503).json({
            success: false,
            message:
              `Gemini model ${model} is unavailable. Check model configuration.`,
          });
        }

        // Unexpected error
        break;
      }
    }

    // 7. All available models failed
    console.error("[Gemini] All model attempts failed:", {
      message: lastError?.message,
      status: lastError?.status,
    });

    return res.status(503).json({
      success: false,
      message:
        "Gemini AI is temporarily unavailable. Please try again later.",
    });

  } catch (error) {
    // 8. General error handling
    console.error("[Gemini Controller Error]:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI description.",
    });
  }
};