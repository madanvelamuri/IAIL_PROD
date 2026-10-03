
const mistakeDescriptions = {
  "Primary ICD-10 Code incorrect":
    "The primary ICD-10 code selected for the claim is incorrect or does not match the diagnosis documented in the medical records. Please review the supporting documents and update the appropriate primary ICD-10 code.",

  "Optical Details Not added":
    "The required optical details are missing from the claim. Please review the supporting documents and update the relevant optical information.",

  "Medical Scheme Provider not added":
    "The medical scheme provider details are missing or incorrectly recorded. Please verify the patient's insurance information and update the correct provider details.",

  "Invalid Deductions":
    "An invalid deduction has been applied to the claim. Please review the applicable benefit rules and supporting documents and correct the deduction.",

  "Gender Not Mentiond or Incorrect":
    "The patient's gender is missing or incorrectly recorded in the claim. Please verify the patient details against the supporting documents and update the correct information.",

  "Particular Name Incorrect":
    "The particular or service name entered in the claim does not match the details in the supporting documents. Please verify and update the correct particular name.",

  "Classification Mistake":
    "The claim item or document has been classified incorrectly. Please review the supporting documents and select the appropriate classification.",

  "Validation Incorrect":
    "The claim validation was performed using incorrect or incomplete information. Please review the patient, policy and claim details and correct the validation.",

  "Invoice No Incorrect":
    "The invoice number is missing or does not match the submitted invoice. Please verify the original invoice and update the correct invoice number.",

  "Patient Name Incorrect":
    "The patient name entered in the claim does not match the name mentioned in the supporting documents. Please verify and update the correct patient name.",

  "Bypassed claim with Incorrect Reason":
    "The claim was bypassed using an incorrect or unsupported reason. Please review the claim details and supporting documents and ensure the correct reason is selected.",

  "Selected Incorrect Pre Auth":
    "An incorrect pre-authorization record has been selected for the claim. Please verify the pre-authorization details and select the correct authorization record.",

  "Claim Date Incorrect":
    "The claim date entered does not match the date mentioned in the supporting documents. Please verify the relevant dates and update the correct claim date.",

  "Incorrect Hospital Name":
    "The hospital name entered in the claim does not match the hospital details in the submitted documents. Please verify and update the correct hospital name.",

  "DOB Not Mentiond or Incorrect":
    "The patient's date of birth is missing or incorrectly recorded. Please verify the date of birth against the supporting documents and update the correct details.",

  "Dental Details Not Mentioned":
    "The required dental details are missing from the claim. Please review the dental supporting documents and update the relevant treatment information.",

  "Benefit Details Incorrect":
    "The benefit or sub-benefit selected for the claim item is incorrect. Please review the applicable policy benefits and map the item to the correct benefit category.",

  "Revenue Description Incorrect":
    "The revenue description does not correctly match the service or item mentioned in the supporting documents. Please review and update the appropriate revenue description.",

  "Deduction Incorrectly Done or Not Deducted":
    "The deduction has been incorrectly calculated, applied or omitted. Please review the applicable deduction rules and claim details and make the necessary correction.",

  "Deduction Done with Incorrect Reason":
    "The deduction was applied using an incorrect reason. Please verify the applicable deduction rules and select the correct deduction reason.",

  "ICD Incorrect":
    "The ICD code selected for the claim does not match the diagnosis documented in the medical records. Please review the diagnosis and update the appropriate ICD code.",

  "Secondary ICD-10 Code incorrect":
    "The secondary ICD-10 code is missing or incorrectly selected. Please review the documented secondary diagnosis and update the appropriate ICD-10 code."
};

// Normalize mistake type to handle extra spaces,
// case differences and the existing "Mentiond" spelling.
export const normalizeMistakeType = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\bmentiond\b/g, "mentioned")
    .replace(/\s+/g, " ");

// Build a normalized lookup.
const normalizedDescriptions = Object.fromEntries(
  Object.entries(mistakeDescriptions).map(([type, description]) => [
    normalizeMistakeType(type),
    description
  ])
);

// Return the description for a selected mistake type.
export const generateMistakeDescription = (mistakeType) => {
  if (!mistakeType) return "";

  const normalizedType = normalizeMistakeType(mistakeType);

  return normalizedDescriptions[normalizedType] || "";
};

export default mistakeDescriptions;