
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

  /**
   * Analyze sentiment of a single text using AI
   * @param text - The text to analyze (post or comment)
   * @returns Sentiment - "Positive", "Negative", or "Neutral"
   */
  public async analyzeSentiment(text: string): Promise<'Positive' | 'Negative' | 'Neutral'> {
    if (!this.isInitialized || !process.env.GEMINI_API_KEY) {
      // Fallback to simple keyword-based analysis in demo mode
      return this.fallbackSentimentAnalysis(text);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const sentimentPrompt = `
      Analyze the sentiment of the following text from a gaming community post or comment.
      Respond with ONLY ONE WORD: "Positive", "Negative", or "Neutral".

      Rules:
      - "Positive" = Excitement, satisfaction, praise, constructive feedback
      - "Negative" = Complaints, frustration, bugs, anger, disappointment
      - "Neutral" = Questions, neutral observations, informational content

      Text to analyze: "${text}"

      Your response (one word only):
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: sentimentPrompt,
      });

      const sentiment = response.text.trim();

      // Validate response
      if (sentiment === 'Positive' || sentiment === 'Negative' || sentiment === 'Neutral') {
        return sentiment;
      }

      // If invalid response, fallback
      console.warn(`Invalid sentiment response: ${sentiment}, using fallback`);
      return this.fallbackSentimentAnalysis(text);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Analyze sentiment for multiple texts in batch (more efficient)
   * @param texts - Array of texts to analyze
   * @returns Array of sentiments
   */
  public async analyzeSentimentBatch(texts: string[]): Promise<('Positive' | 'Negative' | 'Neutral')[]> {
    if (!this.isInitialized || !process.env.GEMINI_API_KEY) {
      return texts.map(text => this.fallbackSentimentAnalysis(text));
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const sentimentPrompt = `
      Analyze the sentiment of the following gaming community posts/comments.
      For each text, respond with ONLY: "Positive", "Negative", or "Neutral".

      Rules:
      - "Positive" = Excitement, satisfaction, praise, constructive feedback
      - "Negative" = Complaints, frustration, bugs, anger, disappointment
      - "Neutral" = Questions, neutral observations, informational content

      Texts to analyze:
      ${texts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

      Respond with ONLY the sentiments, one per line, in the same order:
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: sentimentPrompt,
      });

      const lines = response.text.trim().split('\n').map(line => line.trim());
      const sentiments = lines.map(line => {
        if (line === 'Positive' || line === 'Negative' || line === 'Neutral') {
          return line;
        }
        return 'Neutral'; // Default fallback
      });

      // Ensure we have same number of results
      if (sentiments.length !== texts.length) {
        console.warn('Batch sentiment count mismatch, using fallback');
        return texts.map(text => this.fallbackSentimentAnalysis(text));
      }

      return sentiments as ('Positive' | 'Negative' | 'Neutral')[];
    } catch (error) {
      console.error("Error in batch sentiment analysis:", error);
      return texts.map(text => this.fallbackSentimentAnalysis(text));
    }
  }

  /**
   * Simple keyword-based sentiment analysis fallback
   */
  private fallbackSentimentAnalysis(text: string): 'Positive' | 'Negative' | 'Neutral' {
    const lowerText = text.toLowerCase();

    const positiveKeywords = [
      'love', 'great', 'awesome', 'amazing', 'excellent', 'fantastic', 'good', 'nice',
      'best', 'perfect', 'thanks', 'thank', 'appreciate', 'impressed', 'beautiful',
      'wonderful', 'fun', 'enjoy', 'excited', 'happy', 'cool', 'brilliant'
    ];

    const negativeKeywords = [
      'bug', 'broken', 'crash', 'lag', 'worst', 'terrible', 'awful', 'bad', 'hate',
      'suck', 'garbage', 'trash', 'useless', 'disappointed', 'frustrat', 'angry',
      'annoying', 'nerf', 'unplayable', 'refund', 'quit', 'boring', 'waste'
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) positiveScore++;
    });

    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'Positive';
    if (negativeScore > positiveScore) return 'Negative';
    return 'Neutral';
  }
}

export const aiService = new AiService();