
/**
 * File: server/controllers/aiController.js
 *
 * Purpose:
 * Generate professional medical billing QC mistake descriptions
 * using Google Gemini AI.
 */

const { GoogleGenAI } = require("@google/genai");

// ======================================================
// 1. MEDICAL BILLING QC MISTAKE CATEGORY REFERENCE
// ======================================================

const mistakeDescriptions = {

  "incorrect icd-10 code": {
    meaning:
      "The ICD-10-CM diagnosis code entered during claim processing is incorrect or does not match the documented diagnosis.",
    reference:
      "The ICD-10-CM diagnosis code should be reviewed against the documented diagnosis to ensure accurate medical coding."
  },

  "primary icd-10 code incorrect": {
    meaning:
      "The primary ICD-10-CM diagnosis code is incorrect or does not represent the main diagnosis documented for the claim.",
    reference:
      "The primary ICD-10-CM code should be verified against the medical documentation to ensure the correct primary diagnosis is reported."
  },

  "secondary icd-10 code incorrect": {
    meaning:
      "The secondary ICD-10-CM diagnosis code is incorrect or does not match the additional diagnosis documented for the claim.",
    reference:
      "The secondary ICD-10-CM code should be reviewed against the medical documentation to ensure accurate reporting of the additional diagnosis."
  },

  "icd incorrect": {
    meaning:
      "The ICD diagnosis code entered during medical billing is incorrect or does not match the documented diagnosis.",
    reference:
      "The ICD diagnosis code should be checked against the medical documentation to ensure accurate diagnosis coding."
  },

  "incorrect cpt code": {
    meaning:
      "The CPT procedure or service code does not correctly represent the service documented or billed.",
    reference:
      "The CPT code should be verified against the documented medical service to ensure the correct procedure code is billed."
  },

  "incorrect modifier": {
    meaning:
      "The modifier assigned to the CPT or HCPCS code is incorrect, missing, or inappropriate for the documented service.",
    reference:
      "The modifier should be reviewed against the billed procedure and supporting documentation to ensure accurate claim submission."
  },

  "incorrect units": {
    meaning:
      "The units billed do not match the documented quantity or applicable billing requirements.",
    reference:
      "The billed units should be verified against the documented service quantity to ensure accurate claim billing."
  },

  "eligibility error": {
    meaning:
      "The patient's insurance eligibility or coverage details are incorrect or have not been properly verified for the date of service.",
    reference:
      "The patient's insurance eligibility and coverage should be verified for the applicable date of service before claim processing."
  },

  "authorization error": {
    meaning:
      "The authorization information is missing, incorrect, invalid, or does not correspond to the service being processed.",
    reference:
      "The authorization details should be verified against the approved service information to ensure correct authorization is applied."
  },

  "optical details not added": {
    meaning:
      "Required optical service or product details have not been entered into the claim or billing record.",
    reference:
      "The required optical details should be entered and verified to ensure the claim contains the necessary optical service information."
  },

  "medical scheme provider not added": {
    meaning:
      "The applicable medical scheme provider information has not been added or correctly associated with the claim.",
    reference:
      "The medical scheme provider details should be added and verified to ensure the claim is associated with the correct provider."
  },

  "invalid deductions": {
    meaning:
      "A deduction applied to the claim is invalid or does not comply with the applicable medical scheme benefit or billing rules.",
    reference:
      "The applied deductions should be reviewed against the applicable benefit and billing rules to ensure they are valid."
  },

  "gender not mentioned or incorrect": {
    meaning:
      "The patient's gender information is missing or does not match the available patient documentation.",
    reference:
      "The gender information should be verified against the patient records to ensure accurate demographic details."
  },

  "particular name incorrect": {
    meaning:
      "The name of the billed item, service, or particular is incorrect or does not match the supporting billing documentation.",
    reference:
      "The particular name should be checked against the supporting billing details to ensure the correct item or service is recorded."
  },

  "classification mistake": {
    meaning:
      "The claim, service, item, or billing entry has been assigned to an incorrect classification.",
    reference:
      "The classification should be reviewed against the applicable billing category to ensure accurate assignment."
  },

  "validation incorrect": {
    meaning:
      "The claim or billing information has not been validated correctly against the required processing rules or supporting documentation.",
    reference:
      "The claim validation should be reviewed to ensure the required billing information and validation rules are correctly applied."
  },

  "invoice no incorrect": {
    meaning:
      "The invoice number is missing, incorrectly entered, or does not match the supporting invoice documentation.",
    reference:
      "The invoice number should be verified against the original invoice to ensure the correct reference is recorded."
  },

  "patient name incorrect": {
    meaning:
      "The patient's name is missing, incorrectly entered, or does not match the available patient documentation.",
    reference:
      "The patient name should be checked against the available patient records to ensure accurate identification in the claim."
  },

  "bypassed claim with incorrect reason": {
    meaning:
      "The claim was bypassed in the normal processing workflow using an incorrect or inappropriate reason.",
    reference:
      "The bypass reason should be reviewed to ensure it accurately reflects the claim status and applicable processing requirements."
  },

  "selected incorrect pre auth": {
    meaning:
      "An incorrect pre-authorization record or reference has been selected for the claim or service.",
    reference:
      "The selected pre-authorization details should be verified against the approved authorization information before claim processing."
  },

  "claim date incorrect": {
    meaning:
      "The claim date entered in the billing record is incorrect or does not match the supporting documentation.",
    reference:
      "The claim date should be checked against the supporting claim documentation to ensure the correct date is recorded."
  },

  "incorrect hospital name": {
    meaning:
      "The hospital name is missing, incorrectly entered, or does not match the supporting provider or facility documentation.",
    reference:
      "The hospital name should be verified against the provider documentation to ensure the correct facility is recorded."
  },

  "dob not mentioned or incorrect": {
    meaning:
      "The patient's date of birth is missing or does not match the available patient documentation.",
    reference:
      "The patient's date of birth should be verified against the available patient records to ensure accurate demographic information."
  },

  "dental details not mentioned": {
    meaning:
      "Required dental treatment, procedure, or tooth-related details have not been recorded in the claim or billing information.",
    reference:
      "The required dental details should be entered and verified against the supporting dental documentation."
  },

  "benefit details incorrect": {
    meaning:
      "The benefit information applied to the claim is incorrect or does not match the applicable medical scheme coverage.",
    reference:
      "The benefit details should be checked against the applicable scheme rules to ensure the correct benefits are applied."
  },

  "revenue description incorrect": {
    meaning:
      "The revenue description does not correctly represent the billed service, item, or applicable revenue category.",
    reference:
      "The revenue description should be reviewed against the billed service details to ensure the correct description is recorded."
  },

  "deduction incorrectly done or not deducted": {
    meaning:
      "A required deduction has either been incorrectly applied or has not been applied where required under the applicable billing or benefit rules.",
    reference:
      "The deduction should be reviewed against the applicable billing and benefit rules to ensure it is correctly applied."
  },

  "deduction done with incorrect reason": {
    meaning:
      "A deduction has been applied using a reason that does not correspond to the applicable deduction rule or supporting information.",
    reference:
      "The deduction reason should be checked against the applicable billing rules to ensure the correct reason is recorded."
  }

};

// ======================================================
// 2. NORMALIZE MISTAKE CATEGORY
// ======================================================

const normalizeMistakeType = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
};

// ======================================================
// 3. DELAY FUNCTION FOR RETRIES
// ======================================================

const sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

// ======================================================
// 4. EXTRACT ERROR STATUS
// ======================================================

const getErrorStatus = (error) => {
  let status = Number(
    error.status || error.statusCode || 0
  );

  if (!status && typeof error.message === "string") {
    try {
      const parsed = JSON.parse(error.message);

      status = Number(
        parsed.error?.code ||
        parsed.code ||
        0
      );
    } catch {
      // Ignore JSON parsing errors
    }
  }

  return status;
};

// ======================================================
// 5. GENERATE MEDICAL BILLING QC DESCRIPTION
// ======================================================

exports.generateDescription = async (req, res) => {

  try {

    // --------------------------------------------------
    // A. VALIDATE INPUT
    // --------------------------------------------------

    const { mistakeType } = req.body || {};

    if (
      typeof mistakeType !== "string" ||
      !mistakeType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid QC mistake type."
      });
    }

    const cleanMistakeType = mistakeType.trim();

    if (cleanMistakeType.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Mistake type cannot exceed 120 characters."
      });
    }

    // --------------------------------------------------
    // B. CHECK GEMINI API KEY
    // --------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {

      console.error(
        "[Gemini] API key is not configured."
      );

      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured."
      });

    }

    // --------------------------------------------------
    // C. FIND CATEGORY INFORMATION
    // --------------------------------------------------

    const normalizedType =
      normalizeMistakeType(cleanMistakeType);

    const categoryInfo =
      mistakeDescriptions[normalizedType];

    let categoryMeaning;
    let categoryReference;

    if (categoryInfo) {

      categoryMeaning = categoryInfo.meaning;
      categoryReference = categoryInfo.reference;

    } else {

      // Unknown category fallback
      categoryMeaning =
        `The selected category "${cleanMistakeType}" relates to a possible issue in medical billing, healthcare claims processing, claim documentation, or medical scheme processing.`;

      categoryReference =
        `Review ${cleanMistakeType} against the relevant medical billing documentation and applicable processing requirements. Do not assume additional details.`;

    }

    // --------------------------------------------------
    // D. INITIALIZE GEMINI
    // --------------------------------------------------

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const model =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // --------------------------------------------------
    // E. MEDICAL BILLING SYSTEM INSTRUCTIONS
    // --------------------------------------------------

    const instructions = `
You are a specialized Quality Control assistant
working in a healthcare medical billing and insurance
claims processing department.

BUSINESS CONTEXT:

The application is used for reviewing medical billing
mistakes, insurance claims, medical scheme information,
claim validation, coding, and billing accuracy.

YOUR DOMAIN INCLUDES:

- ICD-10-CM diagnosis coding
- CPT and HCPCS procedure coding
- Medical billing
- Healthcare insurance claims
- Patient demographic details
- Hospital and provider information
- Medical scheme provider details
- Insurance eligibility
- Pre-authorization
- Benefit verification
- Optical claims
- Dental claims
- Invoice details
- Revenue descriptions
- Claim deductions
- Claim validation
- Claim processing and submission

STRICT INSTRUCTIONS:

1. Generate a description only for the selected QC mistake.

2. Always relate the description to medical billing
   or healthcare claims processing.

3. Use the supplied category meaning and reference
   description as the primary guidance.

4. Generate one or two clear sentences.

5. Use simple, professional English.

6. Use correct medical billing terminology.

7. Do not combine different mistake categories.

8. Do not introduce unrelated billing errors.

9. Do not invent patient details, claim numbers,
   diagnosis codes, procedure codes, dates, or amounts.

10. Do not assume a particular claim was denied,
    rejected, underpaid, or incorrectly processed.

11. Do not provide medical treatment advice.

12. Do not provide unrelated administrative,
    HR, software, or customer service descriptions.

13. Do not change the meaning of the selected
    mistake category.

14. The description must explain what needs to be
    checked or corrected in the billing workflow.

15. Return only the final description.

OUTPUT FORMAT:

One or two sentences.
Simple professional English.
Medical billing QC terminology.
No heading.
No bullet points.
No additional explanation.
`;

    // --------------------------------------------------
    // F. PREPARE GEMINI REQUEST
    // --------------------------------------------------

    const contents = `
SELECTED QC MISTAKE TYPE:

${cleanMistakeType}

CATEGORY MEANING:

${categoryMeaning}

REFERENCE DESCRIPTION:

${categoryReference}

TASK:

Generate a professional medical billing QC description
strictly related to the selected mistake type.

Do not introduce other mistake categories.
`;

    // --------------------------------------------------
    // G. GENERATE DESCRIPTION WITH RETRY
    // --------------------------------------------------

    let description = "";
    let lastError = null;

    const maxAttempts = 3;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {

      try {

        console.log(
          `[Gemini] Attempt ${attempt}/${maxAttempts}`
        );

        console.log(
          `[Gemini] Selected category: ${cleanMistakeType}`
        );

        console.log(
          `[Gemini] Model: ${model}`
        );

        const response = await ai.models.generateContent({

          model,

          contents,

          config: {

            systemInstruction: instructions,

            temperature: 0.2,

            maxOutputTokens: 150

          }

        });

        description = response.text?.trim();

        // Check empty response
        if (!description) {

          const emptyError = new Error(
            "Gemini returned an empty response."
          );

          emptyError.status = 503;

          throw emptyError;

        }

        // Successful response
        console.log(
          `[Gemini] Description generated successfully using ${model}`
        );

        return res.status(200).json({

          success: true,

          mistakeType: cleanMistakeType,

          description,

          modelUsed: model

        });

      } catch (error) {

        lastError = error;

        const status = getErrorStatus(error);

        console.error(
          "[Gemini] Generation attempt failed:",
          {
            attempt,
            status,
            message: error.message
          }
        );

        // Retry temporary service errors only
        if (status === 503 && attempt < maxAttempts) {

          const delay = attempt * 1500;

          console.log(
            `[Gemini] Retrying after ${delay}ms...`
          );

          await sleep(delay);

          continue;

        }

        // Do not retry authentication, quota,
        // invalid model, or unexpected errors.
        break;

      }

    }

    // --------------------------------------------------
    // H. HANDLE FAILED GENERATION
    // --------------------------------------------------

    const finalStatus = getErrorStatus(lastError);

    console.error(
      "[Gemini] All generation attempts failed:",
      lastError?.message
    );

    if (
      finalStatus === 401 ||
      finalStatus === 403
    ) {

      return res.status(503).json({
        success: false,
        message:
          "Gemini authentication failed. Please check the API key and permissions."
      });

    }

    if (finalStatus === 429) {

      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota or rate limit reached. Please try again later."
      });

    }

    if (finalStatus === 404) {

      return res.status(503).json({
        success: false,
        message:
          "Gemini model is unavailable. Please check GEMINI_MODEL configuration."
      });

    }

    if (finalStatus === 503) {

      return res.status(503).json({
        success: false,
        message:
          "Gemini is temporarily unavailable. Please try again shortly."
      });

    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate the medical billing QC description."
    });

  } catch (error) {

    // --------------------------------------------------
    // I. GLOBAL CONTROLLER ERROR
    // --------------------------------------------------

    console.error(
      "[Gemini Controller Error]:",
      {
        message: error.message,
        status: error.status,
        code: error.code
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while generating the QC description."
    });

  }

};