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

  // Prepare context data including real names as requested
  const contextData = borrowers.map((b) => ({
    name: b.name,
    fixedInterest: b.fixedInterest,
    started: b.startDate,
    transactions: b.transactions.map(t => ({
      type: t.type,
      amount: t.amount,
      date: t.date,
      note: t.note 
    }))
  }));

  const prompt = `
    You are a helpful financial assistant for a private personal ledger.
    Here is the current lending data containing borrower names and transaction history.
    Note: 'fixedInterest' is the total interest amount added to the loan principal manually.
    
    Data:
    ${JSON.stringify(contextData)}

    User Query: "${query}"

    CRITICAL INSTRUCTIONS FOR NAMES:
    1. Do NOT anonymize names.
    2. Do NOT use placeholders like "Client-1", "Client-2", "Borrower", or "Person".
    3. You MUST use the exact "name" string provided in the Data JSON (e.g., "U Kyaw", "Daw Mya", "John Doe").
    4. If the name is in Burmese, output it in Burmese.

    GENERAL INSTRUCTIONS:
    Please provide a concise, helpful answer based on the data.
    If the user asks for a summary, summarize the total exposure and top debtors using their Real Names.
    If the user asks about a specific person, analyze their repayment history and remaining balance.
    Keep the tone professional yet friendly.

    LANGUAGE INSTRUCTION:
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