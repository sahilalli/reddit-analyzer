import { Conversation, AppConfig, RedditData } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'reddit_insights_conversations',
  CONFIG: 'reddit_insights_config',
  REDDIT_DATA: 'reddit_insights_data',
} as const;

// Default configuration with provided credentials
const DEFAULT_CONFIG: AppConfig = {
  redditClientId: 'Q5qF-LyHwHSHXrKJr0FV7w',
  redditClientSecret: 'AYScEzf9pWal5EwKi8k8gjyV-pjXfA',
  geminiApiKey: 'AIzaSyAK1zlmQFTtZ44pt7mTBpVGwJ_v2_dlzZk'
};

export class LocalStorageService {
  static saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  static loadConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  static saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  static loadConfig(): AppConfig | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        return JSON.parse(data);
      } else {
        // Return default config if none exists
        this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      // Return default config on error
      return DEFAULT_CONFIG;
    }
  }

  static saveRedditData(subreddit: string, data: RedditData): void {
    try {
      const key = `${STORAGE_KEYS.REDDIT_DATA}_${subreddit}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save Reddit data:', error);
    }
  }

  static loadRedditData(subreddit: string): RedditData | null {
    try {
      const key = `${STORAGE_KEYS.REDDIT_DATA}_${subreddit}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      // Check if data is less than 30 minutes old
      const isStale = Date.now() - parsed.fetchedAt > 30 * 60 * 1000;
      return isStale ? null : parsed;
    } catch (error) {
      console.error('Failed to load Reddit data:', error);
      return null;
    }
  }

  static clearData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      // Clear subreddit-specific data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEYS.REDDIT_DATA)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  static getDefaultConfig(): AppConfig {
    return DEFAULT_CONFIG;
  }
}
