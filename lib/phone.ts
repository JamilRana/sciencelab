/**
 * Bangladeshi Phone & WhatsApp Normalization Helpers
 * Client-safe (no Node/server dependencies).
 */

export function normalizeBdPhone(phone?: string | null): {
  isValid: boolean;
  e164: string;
  waNumber: string;
  formatted: string;
  error?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, e164: "", waNumber: "", formatted: "", error: "Phone number is empty" };
  }

  // Strip all non-digit characters
  const rawDigits = phone.replace(/\D/g, "");

  let clean13 = "";
  if (rawDigits.length === 11 && rawDigits.startsWith("01")) {
    clean13 = "88" + rawDigits;
  } else if (rawDigits.length === 13 && rawDigits.startsWith("8801")) {
    clean13 = rawDigits;
  } else if (rawDigits.length === 10 && rawDigits.startsWith("1")) {
    clean13 = "880" + rawDigits;
  } else {
    return {
      isValid: false,
      e164: phone,
      waNumber: rawDigits,
      formatted: phone,
      error: "Invalid Bangladeshi mobile format. Must start with 01 and have 11 digits.",
    };
  }

  // Validate mobile operator prefix: 013, 014, 015, 016, 017, 018, 019
  const operator = clean13.slice(2, 5);
  const validOperators = ["013", "014", "015", "016", "017", "018", "019"];
  if (!validOperators.includes(operator)) {
    return {
      isValid: false,
      e164: "+" + clean13,
      waNumber: clean13,
      formatted: phone,
      error: `Invalid operator code (${operator}). Must be 013–019.`,
    };
  }

  const e164 = "+" + clean13;
  const waNumber = clean13; // wa.me requires digits only, no +
  const formatted = `+880 ${clean13.slice(4, 8)}-${clean13.slice(8)}`;

  return { isValid: true, e164, waNumber, formatted };
}

/**
 * Builds a direct wa.me click-to-send WhatsApp link with pre-filled message text.
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const { waNumber } = normalizeBdPhone(phone);
  const targetNumber = waNumber || phone.replace(/\D/g, "");
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}
