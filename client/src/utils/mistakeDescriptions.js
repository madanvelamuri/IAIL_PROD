export const mistakeDescriptions = {
  "Primary ICD-10 Code incorrect":
    "The primary ICD-10 code displayed in the UI does not match the diagnosis or code mentioned in the claim form. Review the claim form and UI side by side, verify the documented diagnosis, and update the UI with the matching primary ICD-10 code as per the claim form.",

  "Optical Details Not added":
    "The optical details mentioned in the claim form or supporting documents have not been entered in the UI. Review the optical prescription, lens details, frame details, and other applicable information sourced from the claim form. Update all relevant missing optical details in the UI as per the submitted documents.",

  "Medical Scheme Provider not added or Incorrect":
    "The medical scheme provider information requires verification. Select the appropriate condition (Not Added or Incorrect) to generate the relevant description.",

  "Invalid Deductions":
    "An invalid deduction has been applied to the claim. Review the invoice, benefit details, and applicable policy rules. Verify whether the deduction is applicable and correct the deduction amount or remove the invalid deduction based on the supporting documents and policy rules.",

  "Gender Not Mentiond or Incorrect":
    "The patient's gender information requires verification against the claim form. Select the appropriate condition (Missing or Incorrect) to generate the relevant description.",

  "Particular Name Incorrect":
    "The particular or service name entered in the UI does not match the description mentioned in the invoice or claim form. Compare the particular name with the supporting documents and update the UI with the correct name and description.",

  "Classification Mistake":
    "The claim item or document has been assigned to an incorrect classification. Review the document type, service details, and applicable classification options. Select and update the correct classification in the UI based on the supporting documents.",

  "Validation Incorrect":
    "The claim validation has been completed using incorrect or incomplete information. Review the patient details, policy information, claim form, and supporting documents. Identify the incorrect validation field and update the claim based on the available documentation and applicable validation rules.",

  "Invoice No Incorrect":
    "The invoice number displayed in the UI does not match the invoice submitted with the claim. Review the original invoice and compare its invoice number with the UI. Update the UI with the exact invoice number mentioned in the submitted invoice.",

  "Patient Name Incorrect":
    "The patient name displayed in the UI does not match the name mentioned in the claim form or supporting documents. Review the patient's name in the original claim form documents, compare it with the UI, and update the UI with the correct patient name.",

  "Bypassed claim with Incorrect Reason":
    "The claim has been bypassed using an incorrect or unsupported reason. Review the claim details, supporting documents, and applicable processing guidelines. Verify the actual reason for bypassing and select the appropriate reason in the UI.",

  "Pre Auth Selected Incorrect or Not selected":
    "The pre-authorization selection requires verification. Select the appropriate condition (Not Selected or Incorrect) to generate the relevant description.",

  "Claim Date Incorrect":
    "The claim date entered in the UI does not match the date mentioned in the claim form or supporting documents. Review the relevant dates sourced from the claim form, identify the incorrect date field, and update the UI with the correct claim date.",

  "Incorrect Hospital Name":
    "The hospital name displayed in the UI does not match the hospital name mentioned in the claim form or invoice. Review the submitted documents, compare the hospital details, and update the UI with the correct hospital name.",

  "DOB Not Mentiond or Incorrect":
    "The patient's date of birth requires verification against the claim form. Select the appropriate condition (Missing or Incorrect) to generate the relevant description.",

  "Dental Details Not Mentioned":
    "The dental treatment details mentioned in the claim form or supporting documents have not been completely entered in the UI. Review the dental invoice, treatment details, and supporting documents. Update the missing dental information in the appropriate fields.",

  "Benefit Details Incorrect":
    "The benefit or sub-benefit selected in the UI does not match the actual service or item mentioned in the invoice. Review the invoice description and applicable policy benefit structure. For example, verify whether an item recorded under nursing charges or diagnostic fees has been mapped to the appropriate benefit category. Update the correct benefit and sub-benefit in the UI.",

  "Revenue Description Incorrect":
    "The revenue description selected in the UI does not correctly match the service or item mentioned in the invoice. Review the original invoice description, compare it with the revenue description selected in the UI, and update it with the appropriate description.",

  "Deduction Incorrectly Done or Not Deducted":
    "The claim deduction requires verification. Select the appropriate condition (Not Deducted or Incorrectly Done) to generate the relevant description.",

  "Deduction Done with Incorrect Reason":
    "The deduction has been applied using an incorrect reason. Review the invoice details, deduction amount, and applicable policy rules. Verify the actual reason for the deduction and update the UI with the appropriate deduction reason.",

  "ICD Incorrect":
    "The ICD code displayed in the UI does not match the diagnosis or ICD code mentioned in the claim form. Review the claim form and UI side by side, verify the documented diagnosis, and update the UI with the matching ICD code as per the claim form.",

  "Secondary ICD-10 Code incorrect or Not Added":
    "The secondary ICD-10 code information requires verification. Select the appropriate condition (Not Added or Incorrect) to generate the relevant description.",

  "Tertiary ICD-10 Code incorrect or Not Added":
    "The tertiary ICD-10 code information requires verification. Select the appropriate condition (Not Added or Incorrect) to generate the relevant description.",

  "Quaternary ICD-10 Code incorrect or Not Added":
    "The quaternary ICD-10 code information requires verification. Select the appropriate condition (Not Added or Incorrect) to generate the relevant description.",

  "Provisional/Final Diagnosis Mentioned Incorrect":
    "The provisional or final diagnosis displayed in the UI does not match what is documented in the supporting medical documents or claim form. Review the diagnosis specified in the claim form and medical reports side by side with the UI, and update the UI to ensure the exact provisional/final diagnosis text matches what is stated in the documentation.",

  "Tariff – Missing or Incorrect":
    "The tariff has not been correctly identified or selected for the claim. First, review the bill particulars and correct the particular names in the OC Mapping column based on the invoice and supporting documents. After correcting the particular names, click the 'Compare Tariff' button and review the tariff results presented for the relevant hospital or provider. Do not manually select 'Not Found' when a tariff is available in the comparison results. If the tariff is presented for a different provider or hospital, verify the provider/hospital mapping and select the tariff applicable to the claim. Before completing the claim, confirm that the particular name, provider/hospital, and tariff selection match the supporting documents and the available tariff results."
};

export const mistakeConditions = {
  "Medical Scheme Provider not added or Incorrect": {
    "Not Added":
      "The medical scheme provider details mentioned in the claim form were omitted and have not been added to the UI. Review the patient's insurance information in the claim form and update the missing provider details in the UI.",
    Incorrect:
      "The medical scheme provider details recorded in the UI do not match the provider mentioned in the claim form or supporting documents. Review the insurance information and update the UI with the correct provider details."
  },

  "Gender Not Mentiond or Incorrect": {
    Missing:
      "The patient's gender is not mentioned in the claim form or supporting documents, or the gender information has not been entered in the UI. Review the available claim form documents and verify the correct gender. Update the missing gender information in the UI wherever it is supported by the documentation.",
    Incorrect:
      "The patient's gender displayed in the UI does not match the gender mentioned in the claim form or supporting documents. Review both the claim form and UI, identify the mismatch, and update the UI with the correct gender as per the claim form."
  },

  "DOB Not Mentiond or Incorrect": {
    Missing:
      "The patient's date of birth (DOB) is missing from the claim form or has not been entered in the UI. Review the available claim form documents and supporting records. Update the missing DOB in the UI based on the verified documentation.",
    Incorrect:
      "The patient's date of birth displayed in the UI does not match the DOB mentioned in the claim form or supporting documents. Compare the date, month, and year in both places and update the UI with the correct DOB as per the claim form."
  },

  "Pre Auth Selected Incorrect or Not selected": {
    "Not Selected":
      "The pre-authorization details mentioned in the claim form or supporting records were omitted and not selected in the UI. Review the available pre-authorization records and select the correct authorization number and related details in the UI.",
    Incorrect:
      "The pre-authorization selected in the UI does not match the pre-authorization details associated with the claim. Review the claim form and available records, verify the correct authorization number, and update the selection in the UI."
  },

  "Secondary ICD-10 Code incorrect or Not Added": {
    "Not Added":
      "The secondary ICD-10 code documented in the claim form or medical records was omitted and has not been added to the UI. Review the medical records and claim form side by side, and add the missing secondary ICD-10 code(s).",
    Incorrect:
      "The secondary ICD-10 code displayed in the UI does not match the secondary diagnosis documented in the claim form or medical records. Review the records side by side and update the UI with the exact matching secondary code supported by the documentation."
  },

  "Tertiary ICD-10 Code incorrect or Not Added": {
    "Not Added":
      "The tertiary ICD-10 code documented in the claim form or medical records was omitted and has not been added to the UI. Review the medical records and claim form side by side, and add the missing tertiary ICD-10 code(s).",
    Incorrect:
      "The tertiary ICD-10 code displayed in the UI does not match the tertiary diagnosis documented in the claim form or medical records. Review the records side by side and update the UI with the exact matching tertiary code supported by the documentation."
  },

  "Quaternary ICD-10 Code incorrect or Not Added": {
    "Not Added":
      "The quaternary ICD-10 code documented in the claim form or medical records was omitted and has not been added to the UI. Review the medical records and claim form side by side, and add the missing quaternary ICD-10 code(s).",
    Incorrect:
      "The quaternary ICD-10 code displayed in the UI does not match the quaternary diagnosis documented in the claim form or medical records. Review the records side by side and update the UI with the exact matching quaternary code supported by the documentation."
  },

  "Deduction Incorrectly Done or Not Deducted": {
    "Not Deducted":
      "The applicable deduction required by policy rules or supporting invoice details was not applied to the claim. Review the invoice amount, payable amount, and deduction rules, and apply the required deduction in the UI.",
    "Incorrectly Done":
      "The deduction applied to the claim has been calculated or executed incorrectly. Review the invoice amount, co-payment, and policy rules, and update the UI with the correct deduction amount."
  }
};

export const normalizeMistakeType = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\bmentiond\b/g, "mentioned")
    .replace(/\s+/g, " ");

const normalizedDescriptions = Object.fromEntries(
  Object.entries(mistakeDescriptions).map(([type, description]) => [
    normalizeMistakeType(type),
    description
  ])
);

const normalizedConditions = Object.fromEntries(
  Object.entries(mistakeConditions).map(([type, conditions]) => [
    normalizeMistakeType(type),
    conditions
  ])
);

export const getMistakeConditions = (mistakeType) => {
  if (!mistakeType) return [];

  const conditions = normalizedConditions[normalizeMistakeType(mistakeType)];

  return conditions ? Object.keys(conditions) : [];
};

export const generateMistakeDescription = (mistakeType, condition = "") => {
  if (!mistakeType) return "";

  const normalizedType = normalizeMistakeType(mistakeType);
  const conditions = normalizedConditions[normalizedType];

  if (conditions) {
    return condition && conditions[condition] ? conditions[condition] : "";
  }

  return normalizedDescriptions[normalizedType] || "";
};

export default mistakeDescriptions;