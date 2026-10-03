
const OpenAI = require("openai");

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

    // 3. Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "OpenAI API key is not configured.",
      });
    }

    // 4. Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 5. Generate AI description
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",

      instructions: `
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

      input: `
        Selected QC Mistake Type: ${cleanMistakeType}

        Generate a professional QC description.
      `,

      max_output_tokens: 120,
    });

    // 6. Extract generated description
    const description = response.output_text?.trim();

    if (!description) {
      return res.status(502).json({
        success: false,
        message: "AI could not generate a description. Please retry.",
      });
    }

    // 7. Send response to frontend
    return res.status(200).json({
      success: true,
      description: description,
    });

  } catch (error) {

    // 8. Error handling
    console.error("AI Description Error:", {
      message: error.message,
      status: error.status,
      request_id: error.request_id,
    });

    if (error.status === 401) {
      return res.status(503).json({
        success: false,
        message: "Invalid OpenAI API key. Please check server configuration.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "OpenAI usage limit reached. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI description.",
    });
  }
};