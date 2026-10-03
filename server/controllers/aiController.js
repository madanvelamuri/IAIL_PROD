
// server/controllers/aiController.js

const { GoogleGenAI } = require("@google/genai");

// Generate an AI description for the selected QC mistake type
exports.generateDescription = async (req, res) => {
  try {
    // 1. Get mistake type from frontend
    const { mistakeType } = req.body || {};

    // 2. Validate input
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

    // 3. Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[Gemini] API key is not configured.");

      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // 4. Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey,
    });

    // 5. Select Gemini model
    const model =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // 6. Generate AI description
    const response = await ai.models.generateContent({
      model,

      contents: `
        Selected QC Mistake Type: ${cleanMistakeType}

        Generate a professional QC description.
      `,

      config: {
        systemInstruction: `
          You are an experienced Quality Control (QC) assistant
          working in a healthcare claims processing department.

          Your task is to generate a professional description
          based on the selected QC mistake category.

          Follow these rules:

          1. Write in simple, professional English.
          2. Generate one or two clear sentences.
          3. Explain the type of mistake in a QC context.
          4. Do not invent claim details.
          5. Do not invent patient information.
          6. Do not invent ICD codes or medical information.
          7. Do not assume that a particular claim was actually
             processed incorrectly.
          8. Do not include headings or bullet points.
          9. Return only the description.
          10. Keep the description suitable for a QC mistake report.
        `,

        temperature: 0.3,
        maxOutputTokens: 120,
      },
    });

    // 7. Extract generated description
    const description = response.text?.trim();

    if (!description) {
      console.error(
        "[Gemini] Empty description returned by the model."
      );

      return res.status(502).json({
        success: false,
        message:
          "Gemini could not generate a description. Please retry.",
      });
    }

    // 8. Send response to frontend
    return res.status(200).json({
      success: true,
      description,
    });

  } catch (error) {
    // 9. Log error details without exposing API credentials
    console.error("[Gemini Description Error]:", {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      code: error.code,
    });

    const status = Number(
      error.status || error.statusCode
    );

    const errorCode = String(
      error.code || ""
    ).toUpperCase();

    const errorMessage = String(
      error.message || ""
    ).toLowerCase();

    // Invalid API key or permission issue
    if (
      status === 401 ||
      status === 403 ||
      errorCode.includes("PERMISSION_DENIED") ||
      errorMessage.includes("api key not valid")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini API authentication failed. Please check your API key and permissions.",
      });
    }

    // Usage limit or quota exceeded
    if (
      status === 429 ||
      errorCode.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("quota")
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API usage limit reached. Please check your API quota and billing.",
      });
    }

    // Invalid or unavailable model
    if (
      status === 404 ||
      errorCode.includes("NOT_FOUND")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini model is unavailable. Please check your GEMINI_MODEL configuration.",
      });
    }

    // General server error
    return res.status(500).json({
      success: false,
      message:
        "Failed to generate AI description. Please try again later.",
    });
  }
};