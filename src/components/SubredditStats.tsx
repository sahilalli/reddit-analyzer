import React from 'react';
import { Users, Activity, Calendar, TrendingUp } from 'lucide-react';
import { RedditData } from '../types';

interface SubredditStatsProps {
  data: RedditData;
}

export const SubredditStats: React.FC<SubredditStatsProps> = ({ data }) => {
  const { subreddit, posts } = data;
  
  const avgScore = posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + post.score, 0) / posts.length) : 0;
  const totalComments = posts.reduce((sum, post) => sum + post.num_comments, 0);
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">r/{subreddit.display_name}</h3>
          <p className="text-sm text-gray-600">Subreddit Analytics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Members</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatNumber(subreddit.subscribers)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatNumber(subreddit.active_user_count)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Avg Score</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {avgScore}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Created</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatDate(subreddit.created_utc)}
          </div>
        </div>
      </div>
      
      {subreddit.public_description && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">
            {subreddit.public_description}
          </p>
        </div>
      )}
    </div>
  );
};