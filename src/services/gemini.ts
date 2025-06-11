import { RedditData, ChatMessage } from '../types';

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private buildContext(redditData: RedditData): string {
    const { subreddit, posts, comments } = redditData;
    
    let context = `SUBREDDIT ANALYSIS CONTEXT:\n\n`;
    context += `Subreddit: r/${subreddit.display_name}\n`;
    context += `Subscribers: ${subreddit.subscribers.toLocaleString()}\n`;
    context += `Active Users: ${subreddit.active_user_count.toLocaleString()}\n`;
    context += `Description: ${subreddit.public_description}\n\n`;

    context += `TOP POSTS (${posts.length}):\n`;
    posts.forEach((post, index) => {
      context += `${index + 1}. "${post.title}" by u/${post.author}\n`;
      context += `   Score: ${post.score}, Comments: ${post.num_comments}\n`;
      if (post.selftext && post.selftext.length > 0) {
        context += `   Content: ${post.selftext.substring(0, 200)}${post.selftext.length > 200 ? '...' : ''}\n`;
      }
      context += `   URL: ${post.url}\n\n`;
    });

    context += `TOP COMMENTS (${comments.length}):\n`;
    comments.slice(0, 50).forEach((comment, index) => {
      context += `${index + 1}. u/${comment.author} (Score: ${comment.score}): ${comment.body.substring(0, 150)}${comment.body.length > 150 ? '...' : ''}\n\n`;
    });

    return context;
  }

  private buildSystemPrompt(): string {
    return `You are a Reddit Insights Assistant designed specifically for entrepreneurs, founders, and business enthusiasts. Your role is to analyze Reddit data and provide actionable insights for:

1. BUSINESS OPPORTUNITIES: Identify potential SaaS ideas, product opportunities, and market gaps
2. LEAD GENERATION: Spot potential customers, partners, or collaboration opportunities  
3. MARKET RESEARCH: Understand pain points, trends, and user behavior
4. COMPETITIVE ANALYSIS: Identify competitors and market positioning opportunities

ANALYSIS GUIDELINES:
- Focus on actionable business insights and opportunities
- Identify recurring pain points that could become product ideas
- Highlight potential customer segments and their needs
- Point out market trends and emerging opportunities
- Suggest specific business ideas with rationale
- Always cite specific posts/comments when making claims
- Be concise but thorough in your analysis

RESPONSE FORMAT:
- Use clear sections and bullet points
- Include specific examples from the data
- Provide actionable recommendations
- Cite sources using post titles or comment snippets
- Keep responses focused on business value

Remember: You're helping entrepreneurs make data-driven decisions about business opportunities.`;
  }

  async generateResponse(
    question: string, 
    redditData: RedditData, 
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const context = this.buildContext(redditData);
    const systemPrompt = this.buildSystemPrompt();
    
    // Build conversation history
    let historyText = '';
    if (conversationHistory.length > 0) {
      historyText = '\nPREVIOUS CONVERSATION:\n';
      conversationHistory.slice(-6).forEach(msg => {
        historyText += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
      historyText += '\n';
    }

    const prompt = `${systemPrompt}\n\n${context}${historyText}USER QUESTION: ${question}\n\nProvide a detailed analysis focusing on business opportunities and actionable insights:`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response generated');
      }

      return generatedText;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async *generateStreamingResponse(
    question: string, 
    redditData: RedditData, 
    conversationHistory: ChatMessage[]
  ): AsyncGenerator<string, void, unknown> {
    // For simplicity, we'll simulate streaming by yielding the full response
    // In a real implementation, you'd use the streaming API
    try {
      const response = await this.generateResponse(question, redditData, conversationHistory);
      const words = response.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        yield words.slice(0, i + 1).join(' ');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      throw error;
    }
  }
}