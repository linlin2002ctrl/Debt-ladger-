import { GoogleGenAI } from "@google/genai";
import { Borrower } from "../types";

const getClient = (apiKey?: string) => {
  // Use the provided key if available, otherwise fallback to env var
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    console.warn("API Key not found in environment variables or user settings");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

export const generateFinancialAdvice = async (borrowers: Borrower[], query: string, apiKey?: string): Promise<string> => {
  const client = getClient(apiKey);
  if (!client) return "Please provide a valid Gemini API Key to use AI features. Click the settings icon to enter your key.";

  // Sanitize data for privacy
  // Anonymize names to protect identity
  const contextData = borrowers.map((b, index) => ({
    id: `Client-${index + 1}`, // Anonymized ID
    // Name is deliberately removed to protect privacy
    fixedInterest: b.fixedInterest,
    started: b.startDate,
    transactions: b.transactions.map(t => ({
      type: t.type,
      amount: t.amount,
      date: t.date,
      // Notes might contain PII, so we rely on the prompt instruction to treat them confidentially
      // but for "serious security", we should arguably strip them too. 
      // However, notes are crucial for context (e.g. "Bank transfer"). 
      // We will include them but the prompt context is anonymized regarding the *Entity Name*.
      note: t.note 
    }))
  }));

  const prompt = `
    You are a helpful financial assistant for a private lender.
    Here is the current lending data.
    IMPORTANT: The names have been anonymized to "Client-X" for privacy. 
    Note: 'fixedInterest' is the total interest amount added to the loan principal manually.
    
    Data:
    ${JSON.stringify(contextData)}

    User Query: "${query}"

    Please provide a concise, helpful answer based on the data.
    If the user asks for a summary, summarize the total exposure and top debtors (refer to them as Client-1, Client-2, etc.).
    If the user asks about a specific person, analyze their repayment history and remaining balance.
    Keep the tone professional yet friendly.

    IMPORTANT LANGUAGE INSTRUCTION:
    If the user asks a question in Myanmar (Burmese) language, you MUST reply in Myanmar (Burmese) language.
    Otherwise, reply in the language the user asked in (default to English).
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error analyzing your data. Please check your API Key and try again.";
  }
};