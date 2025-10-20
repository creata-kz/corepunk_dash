

import { GoogleGenAI, Chat } from "@google/genai";
import { DailyMetric, ProductionActivity, Comment } from '../types';

class AiService {
  private chat: Chat | null = null;
  private isInitialized = false;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        this.chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `You are "Context AI", an expert game project analyst integrated into the "Corepunk Command Center" dashboard. 
            Your purpose is to answer questions about the project's performance. 
            You will be given the latest data context with every user query, including daily metrics, production activities (like beta tests or class rebalances), and community comments. 
            Analyze this data to provide concise, data-driven answers. 
            When a user asks a question, find relevant correlations in the data and explain them clearly. 
            For example, if they ask "Why did DAU drop?", look for a recent 'Class Rebalance' activity around the same date and check the community comments for keywords like 'nerf' or 'lag'.
            Use markdown for formatting your answers. Be helpful and conversational.`,
          },
        });
        this.isInitialized = true;
      } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        this.isInitialized = false;
      }
    }
  }

  public async sendMessage(
    message: string, 
    context: { 
      metrics: DailyMetric[], 
      activities: ProductionActivity[], 
      comments: Comment[] 
    }
  ): Promise<string> {
    if (!this.isInitialized || !this.chat) {
      // DEMO MODE
      await new Promise(res => setTimeout(res, 1000));
      return `**DEMO MODE**: API key not configured. This is a sample analysis.

To answer your question about **"${message}"**:
I've analyzed the recent data. The 'Champion Class Rebalance (Nerf)' on ${context.activities.find(a => a.id === 1)?.date} correlates with a sharp increase in negative comments and a dip in DAU. This suggests the rebalance was unpopular with Champion players. The subsequent 'Server Stress Test Weekend' brought DAU back up as more players were invited to test server capacity.`;
    }

    const contextPrompt = `
      ---
      DATA CONTEXT FOR YOUR ANALYSIS (DO NOT REPEAT THIS DATA IN YOUR RESPONSE):
      - Key Metrics (last 5 days of selected range): ${JSON.stringify(context.metrics.slice(-5))}
      - All Production Activities in selected range: ${JSON.stringify(context.activities)}
      - Recent Community Comments (sample of 10): ${JSON.stringify(context.comments.slice(0, 10).map(c => ({ sentiment: c.sentiment, text: c.text, source: c.source })))}
      ---
      Now, please answer the user's question based on this data and our conversation history.
      User Question: "${message}"
    `;

    try {
      const response = await this.chat.sendMessage({ message: contextPrompt });
      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Error: Could not get a response from the AI. Please check the console for details.";
    }
  }

  public async getTrendAnalysis(context: {
      metrics: DailyMetric[],
      activities: ProductionActivity[],
      comments: Comment[]
    }): Promise<string> {
     if (!this.isInitialized || !process.env.GEMINI_API_KEY) {
        await new Promise(res => setTimeout(res, 1500));
        return `The recent Server Stress Test successfully boosted DAU, but triggered a +250% increase in negative comments related to server lag. While player engagement is high, addressing infrastructure stability is now the top priority before the next CBT wave.`;
     }

     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

     const trendPrompt = `
        You are a game project analyst for Corepunk. Your task is to analyze the provided data to identify the most significant trend or event from the last few days.
        Provide a concise, one-paragraph summary highlighting the event, its impact on key metrics, and the related community reaction.
        Start directly with the summary, do not use any titles or special formatting like markdown.

        DATA CONTEXT:
        - Key Metrics (last 10 days of selected range): ${JSON.stringify(context.metrics.slice(-10))}
        - All Production Activities in selected range: ${JSON.stringify(context.activities)}
        - Recent Community Comments (sample of 20): ${JSON.stringify(context.comments.slice(0, 20).map(c => ({ sentiment: c.sentiment, userType: c.userType, text: c.text, source: c.source })))}
     `;

     try {
       const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: trendPrompt,
       });
       return response.text;
     } catch (error) {
       console.error("Error calling Gemini API for trend analysis:", error);
       return "Error: Could not get a trend analysis from the AI.";
     }
  }
}

export const aiService = new AiService();