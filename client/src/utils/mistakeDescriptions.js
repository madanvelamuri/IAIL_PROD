
const mistakeDescriptions = {
  "Primary ICD-10 Code incorrect":
    "The primary ICD-10 code displayed in the UI does not match the diagnosis or code mentioned in the claim form. Review the claim form and UI side by side, verify the documented diagnosis, and update the UI with the matching primary ICD-10 code as per the claim form.",

  "Optical Details Not added":
    "The optical details mentioned in the claim form or supporting documents have not been entered in the UI. Review the optical prescription, lens details, frame details and other applicable information. Update all relevant missing optical details in the UI as per the submitted documents.",

  "Medical Scheme Provider not added":
    "The medical scheme provider details mentioned in the claim form are missing or incorrectly recorded in the UI. Review the patient's insurance or medical scheme information in the claim form and supporting documents. Update the correct provider details in the UI.",

  "Invalid Deductions":
    "An invalid deduction has been applied to the claim. Review the invoice, benefit details and applicable policy rules. Verify whether the deduction is applicable and correct the deduction amount or remove the invalid deduction based on the supporting documents and policy rules.",

  "Gender Not Mentiond or Incorrect":
    "The patient's gender information requires verification. Select the appropriate condition (Missing or Incorrect) to generate the relevant description.",

  "Particular Name Incorrect":
    "The particular or service name entered in the UI does not match the description mentioned in the invoice or claim form. Compare the particular name with the supporting documents and update the UI with the correct name and description.",

  "Classification Mistake":
    "The claim item or document has been assigned to an incorrect classification. Review the document type, service details and applicable classification options. Select and update the correct classification in the UI based on the supporting documents.",

  "Validation Incorrect":
    "The claim validation has been completed using incorrect or incomplete information. Review the patient details, policy information, claim form and supporting documents. Identify the incorrect validation field and update the claim based on the available documentation and applicable validation rules.",

  "Invoice No Incorrect":
    "The invoice number displayed in the UI does not match the invoice submitted with the claim. Review the original invoice and compare its invoice number with the UI. Update the UI with the exact invoice number mentioned in the submitted invoice.",

  "Patient Name Incorrect":
    "The patient name displayed in the UI does not match the name mentioned in the claim form or supporting documents. Review the patient's name in the original documents, compare it with the UI and update the UI with the correct patient name.",

  "Bypassed claim with Incorrect Reason":
    "The claim has been bypassed using an incorrect or unsupported reason. Review the claim details, supporting documents and applicable processing guidelines. Verify the actual reason for bypassing and select the appropriate reason in the UI.",

  "Selected Incorrect Pre Auth":
    "The pre-authorization selected in the UI does not match the pre-authorization details associated with the claim. Review the claim form and available pre-authorization records. Verify the authorization number and related details, then select the correct pre-authorization record.",

  "Claim Date Incorrect":
    "The claim date entered in the UI does not match the date mentioned in the claim form or supporting documents. Review the relevant dates, identify the incorrect date field and update the UI with the correct claim date as per the submitted documents.",

  "Incorrect Hospital Name":
    "The hospital name displayed in the UI does not match the hospital name mentioned in the claim form or invoice. Review the submitted documents, compare the hospital details and update the UI with the correct hospital name.",

  "DOB Not Mentiond or Incorrect":
    "The patient's date of birth requires verification. Select the appropriate condition (Missing or Incorrect) to generate the relevant description.",

  "Dental Details Not Mentioned":
    "The dental treatment details mentioned in the supporting documents have not been completely entered in the UI. Review the dental invoice, treatment details and supporting documents. Update the missing dental information in the appropriate fields.",

  "Benefit Details Incorrect":
    "The benefit or sub-benefit selected in the UI does not match the actual service or item mentioned in the invoice. Review the invoice description and applicable policy benefit structure. For example, verify whether an item recorded under nursing charges or diagnostic fees has been mapped to the appropriate benefit category. Update the correct benefit and sub-benefit in the UI.",

  "Revenue Description Incorrect":
    "The revenue description selected in the UI does not correctly match the service or item mentioned in the invoice. Review the original invoice description, compare it with the revenue description selected in the UI and update it with the appropriate description.",

  "Deduction Incorrectly Done or Not Deducted":
    "The applicable deduction has either been calculated incorrectly, applied incorrectly or not applied to the claim. Review the invoice amount, payable amount, co-payment and applicable deduction rules. Verify whether the deduction is required and update the correct deduction amount in the UI.",

  "Deduction Done with Incorrect Reason":
    "The deduction has been applied using an incorrect reason. Review the invoice details, deduction amount and applicable policy rules. Verify the actual reason for the deduction and update the UI with the appropriate deduction reason.",

  "ICD Incorrect":
    "The ICD code displayed in the UI does not match the diagnosis or ICD code mentioned in the claim form. Review the claim form and UI side by side, verify the documented diagnosis and update the UI with the matching ICD code as per the claim form.",

  "Secondary ICD-10 Code incorrect":
    "The secondary ICD-10 code displayed in the UI does not match the secondary diagnosis documented in the claim form or medical records. Review the secondary diagnosis and compare the code in the claim form with the UI. Update the UI with the correct matching secondary ICD-10 code."
};

// Conditions for mistake types that can have different explanations.
export const mistakeConditions = {
  "Gender Not Mentiond or Incorrect": {
    Missing:
      "The patient's gender is not mentioned in the claim form or supporting documents, or the gender information has not been entered in the UI. Review the available patient documents and verify the correct gender. Update the missing gender information in the UI wherever it is supported by the documentation.",

    Incorrect:
      "The patient's gender displayed in the UI does not match the gender mentioned in the claim form or supporting documents. Review both the claim form and UI, identify the mismatch and update the UI with the correct gender as per the claim form."
  },

  "DOB Not Mentiond or Incorrect": {
    Missing:
      "The patient's date of birth (DOB) is missing from the claim form or has not been entered in the UI. Review the available patient identification documents and supporting records. Update the missing DOB in the UI based on the verified documentation.",

    Incorrect:
      "The patient's date of birth displayed in the UI does not match the DOB mentioned in the claim form or supporting documents. Compare the date, month and year in both places and update the UI with the correct DOB as per the claim form."
  }
};

// Normalize mistake types to handle extra spaces, case differences
// and the existing "Mentiond" spelling.
export const normalizeMistakeType = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\bmentiond\b/g, "mentioned")
    .replace(/\s+/g, " ");

// Normalize all description keys.
const normalizedDescriptions = Object.fromEntries(
  Object.entries(mistakeDescriptions).map(([type, description]) => [
    normalizeMistakeType(type),
    description
  ])
);

// Normalize condition-based descriptions.
const normalizedConditions = Object.fromEntries(
  Object.entries(mistakeConditions).map(([type, conditions]) => [
    normalizeMistakeType(type),
    conditions
  ])
);

// Get the available conditions for a mistake type.
export const getMistakeConditions = (mistakeType) => {
  if (!mistakeType) return [];

  const conditions = normalizedConditions[normalizeMistakeType(mistakeType)];

  return conditions ? Object.keys(conditions) : [];
};

// Generate the appropriate description.
export const generateMistakeDescription = (
  mistakeType,
  condition = ""
) => {
  if (!mistakeType) return "";

  const normalizedType = normalizeMistakeType(mistakeType);

  const conditions = normalizedConditions[normalizedType];

  // Return the selected condition description.
  if (conditions) {
    if (!condition || !conditions[condition]) return "";
    return conditions[condition];
  }

  // Return the standard description.
  return normalizedDescriptions[normalizedType] || "";
};

export default mistakeDescriptions;