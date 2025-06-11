export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  subreddit: string;
  is_self: boolean;
  domain: string;
  upvote_ratio: number;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  score: number;
  parent_id: string;
  permalink: string;
}

export interface SubredditInfo {
  name: string;
  display_name: string;
  subscribers: number;
  active_user_count: number;
  description: string;
  created_utc: number;
  public_description: string;
}

export interface RedditData {
  subreddit: SubredditInfo;
  posts: RedditPost[];
  comments: RedditComment[];
  fetchedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: string[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  subreddit: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppConfig {
  redditClientId: string;
  redditClientSecret: string;
  geminiApiKey: string;
}