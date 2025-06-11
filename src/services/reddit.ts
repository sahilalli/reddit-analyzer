import { RedditData, RedditPost, RedditComment, SubredditInfo } from '../types';

export class RedditService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RedditInsights/1.0',
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error);
      throw new Error('Reddit authentication failed');
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://oauth.reddit.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'RedditInsights/1.0',
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    return response.json();
  }

  async validateSubreddit(subreddit: string): Promise<boolean> {
    try {
      await this.makeRequest(`/r/${subreddit}/about`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async fetchSubredditData(subreddit: string): Promise<RedditData> {
    try {
      // Fetch subreddit info
      const aboutResponse = await this.makeRequest(`/r/${subreddit}/about`);
      const subredditInfo: SubredditInfo = {
        name: aboutResponse.data.name,
        display_name: aboutResponse.data.display_name,
        subscribers: aboutResponse.data.subscribers,
        active_user_count: aboutResponse.data.active_user_count || 0,
        description: aboutResponse.data.description || '',
        created_utc: aboutResponse.data.created_utc,
        public_description: aboutResponse.data.public_description || '',
      };

      // Fetch hot posts
      const postsResponse = await this.makeRequest(`/r/${subreddit}/hot?limit=25`);
      const posts: RedditPost[] = postsResponse.data.children.map((child: any) => ({
        id: child.data.id,
        title: child.data.title,
        selftext: child.data.selftext || '',
        author: child.data.author,
        created_utc: child.data.created_utc,
        score: child.data.score,
        num_comments: child.data.num_comments,
        url: child.data.url,
        permalink: child.data.permalink,
        subreddit: child.data.subreddit,
        is_self: child.data.is_self,
        domain: child.data.domain,
        upvote_ratio: child.data.upvote_ratio,
      }));

      // Fetch top comments from popular posts
      const topPosts = posts.slice(0, 10);
      const comments: RedditComment[] = [];

      for (const post of topPosts) {
        try {
          const commentsResponse = await this.makeRequest(`${post.permalink}?limit=5&sort=top`);
          const postComments = commentsResponse[1]?.data?.children || [];
          
          postComments.forEach((child: any) => {
            if (child.data && child.data.body && child.data.body !== '[deleted]') {
              comments.push({
                id: child.data.id,
                body: child.data.body,
                author: child.data.author,
                created_utc: child.data.created_utc,
                score: child.data.score,
                parent_id: child.data.parent_id,
                permalink: child.data.permalink,
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to fetch comments for post ${post.id}:`, error);
        }
      }

      return {
        subreddit: subredditInfo,
        posts,
        comments,
        fetchedAt: Date.now(),
      };
    } catch (error) {
      console.error('Failed to fetch subreddit data:', error);
      throw new Error(`Failed to fetch data for r/${subreddit}`);
    }
  }
}