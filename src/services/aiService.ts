import { GoogleGenAI, Type } from "@google/genai";
import { Player, Match } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAITeams(match: Match, players: Player[], type: string) {
  const prompt = `
    As a Cricket Fantasy Expert, generate an optimal ${type} fantasy team for the following match:
    Match: ${match.title}
    Venue: ${match.venue}
    Toss: ${match.toss}
    
    Players Data:
    ${JSON.stringify(players.map(p => ({
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      form: p.recent_form,
      credits: p.credits,
      selection: p.selection_percentage
    })))}
    
    Rules:
    1. Exactly 11 players.
    2. Total credits must be <= 100.
    3. Max 7 players from one team.
    4. At least 1 Wicketkeeper, 3 Batsmen, 1 All-rounder, 3 Bowlers.
    5. Choose a Captain (2x points) and Vice-Captain (1.5x points).
    
    Strategy for ${type}:
    ${type === 'Safe' ? 'Focus on high selection percentage and consistent performers.' : ''}
    ${type === 'GL' ? 'Include 2-3 differential picks with low selection % and high potential.' : ''}
    ${type === 'Extreme GL' ? 'Take high risks, choose an unconventional captain and several low-selection players.' : ''}
    
    Return ONLY a JSON object:
    {
      "playerIds": ["id1", "id2", ...],
      "captainId": "id",
      "viceCaptainId": "id",
      "reasoning": "Brief explanation",
      "winProbability": 0.85
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}

export async function chatWithPandit(message: string, context: { match?: Match, players?: Player[] }) {
  const systemInstruction = `
    You are "Fantasy Pandit v2", a context-aware cricket expert assistant.
    Use the provided match and player data to answer queries accurately.
    Be professional, insightful, and slightly informal (like a cricket commentator).
    Provide specific player names and tactical advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${JSON.stringify(context)}\nUser: ${message}`,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Pandit Chat Error:", error);
    return "The Pandit is currently meditating on the pitch report. Please try again in a bit!";
  }
}
