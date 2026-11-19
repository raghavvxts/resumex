export const suggestionWarnings = (
  original: string,
  suggestion: string,
): string[] => {
  const warnings: string[] = [];
  const numbers = (text: string) =>
    text
      .match(
        /(?:[$€£₹]\s*)?\b\d[\d,.]*(?:\s*(?:%|percent|million|billion|thousand|[kKmM]\b))?/g,
      )
      ?.map((value) =>
        value
          .toLowerCase()
          .replace(/\s|,/g, "")
          .replace(/percent/g, "%"),
      ) || [];
  const originalNumbers = new Set(numbers(original));
  const added = [
    ...new Set(
      numbers(suggestion).filter((number) => !originalNumbers.has(number)),
    ),
  ];
  if (added.length)
    warnings.push(
      `Numbers not found in the original: ${added.join(", ")}. Verify them before applying.`,
    );
  const claims = [
    /\b(?:led|managed|supervised|mentored)\b/i,
    /\b(?:certified|certification|award|patent|published)\b/i,
    /\b(?:increased|reduced|improved|saved|generated|grew|boosted)\b/i,
  ];
  if (claims.some((claim) => claim.test(suggestion) && !claim.test(original)))
    warnings.push(
      "This revision adds a responsibility, credential, or outcome not stated in the original. Check the evidence.",
    );
  const technologies =
    /\b(?:AWS|Azure|Kubernetes|Docker|React|Python|Java|TypeScript|SQL|TensorFlow|PyTorch|Google Cloud|Salesforce|SAP)\b/gi;
  const addedSkills = [...new Set(suggestion.match(technologies) || [])].filter(
    (skill) => !original.toLowerCase().includes(skill.toLowerCase()),
  );
  if (addedSkills.length)
    warnings.push(
      `Skills not found in the original: ${addedSkills.join(", ")}. Verify them before applying.`,
    );
  return warnings;
};
