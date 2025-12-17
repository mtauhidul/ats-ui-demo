/**
 * Email Reply Parser Utility
 * Extracts the actual reply content from email threads by removing quoted text
 */

/**
 * Parse email body to extract only the new reply content
 * Removes quoted previous messages and email signatures
 */
export function extractReplyContent(emailBody: string): {
  replyText: string;
  hasQuotedText: boolean;
  quotedText?: string;
} {
  if (!emailBody) {
    return { replyText: '', hasQuotedText: false };
  }

  // Common patterns that indicate quoted text
  const quotedPatterns = [
    // Gmail-style: "On [date], [person] wrote:"
    /^On .+?wrote:$/im,
    // Outlook-style: "From: [person]"
    /^From:.+?$/im,
    // Reply indicators with > prefix
    /^>/m,
    // Proton Mail signature
    /Sent with \[Proton Mail\]/i,
    // Generic "wrote:" pattern
    /\w+\s+wrote:$/im,
  ];

  let replyText = emailBody;
  let quotedText = '';
  let splitIndex = -1;

  // Try to find where quoted text starts
  for (const pattern of quotedPatterns) {
    const match = emailBody.match(pattern);
    if (match && match.index !== undefined) {
      // Find the earliest match
      if (splitIndex === -1 || match.index < splitIndex) {
        splitIndex = match.index;
      }
    }
  }

  // If we found quoted text, split the email
  if (splitIndex > 0) {
    replyText = emailBody.substring(0, splitIndex).trim();
    quotedText = emailBody.substring(splitIndex).trim();
  }

  // Additional cleanup for common email signatures
  const signaturePatterns = [
    /Sent with \[Proton Mail\].*$/is,
    /--\s*$/m, // Common signature separator
    /\n\n---\s*$/m,
  ];

  for (const pattern of signaturePatterns) {
    replyText = replyText.replace(pattern, '').trim();
  }

  // Remove excessive newlines
  replyText = replyText.replace(/\n{3,}/g, '\n\n').trim();

  return {
    replyText,
    hasQuotedText: splitIndex > 0,
    quotedText: quotedText || undefined,
  };
}

/**
 * Remove email signatures from text
 */
export function removeSignature(text: string): string {
  const signaturePatterns = [
    /Sent with \[Proton Mail\].*$/is,
    /Sent from my (iPhone|iPad|Android)/i,
    /Get Outlook for (iOS|Android)/i,
    /--\s*\n.*$/ms,
  ];

  let cleaned = text;
  for (const pattern of signaturePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * Format quoted text for display (collapse by default)
 */
export function formatQuotedText(quotedText: string): string {
  // Remove > prefix from each line for cleaner display
  return quotedText
    .split('\n')
    .map(line => line.replace(/^>\s*/, ''))
    .join('\n')
    .trim();
}

/**
 * Detect if email is a reply based on content
 */
export function isReplyEmail(subject: string, body: string): boolean {
  const replyIndicators = [
    /^Re:/i,
    /^Fwd:/i,
    /wrote:$/im,
    /^From:/im,
    /^>/m,
  ];

  return replyIndicators.some(pattern => 
    pattern.test(subject) || pattern.test(body)
  );
}
