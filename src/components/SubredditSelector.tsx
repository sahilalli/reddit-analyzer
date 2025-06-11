import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface SubredditSelectorProps {
  selectedSubreddit: string;
  onSubredditChange: (subreddit: string) => void;
  onValidate: (subreddit: string) => Promise<boolean>;
  isValidating: boolean;
}

const POPULAR_BUSINESS_SUBREDDITS = [
  'entrepreneur',
  'startups',
  'smallbusiness',
  'SaaS',
  'marketing',
  'webdev',
  'freelance',
  'business',
  'Entrepreneur',
  'digitalnomad'
];

export const SubredditSelector: React.FC<SubredditSelectorProps> = ({
  selectedSubreddit,
  onSubredditChange,
  onValidate,
  isValidating
}) => {
  const [inputValue, setInputValue] = useState(selectedSubreddit);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(selectedSubreddit);
    if (selectedSubreddit) {
      setValidationStatus('valid');
    }
  }, [selectedSubreddit]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidationStatus('idle');
    
    if (value.trim() && value !== selectedSubreddit) {
      const timeoutId = setTimeout(async () => {
        const isValid = await onValidate(value.trim());
        setValidationStatus(isValid ? 'valid' : 'invalid');
        if (isValid) {
          onSubredditChange(value.trim());
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  };

  const handleSuggestionClick = (subreddit: string) => {
    setInputValue(subreddit);
    onSubredditChange(subreddit);
    setValidationStatus('valid');
    setShowSuggestions(false);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
    if (validationStatus === 'valid') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (validationStatus === 'invalid') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Search className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Enter subreddit name (e.g., entrepreneur)"
            className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl transition-all duration-200 ${
              validationStatus === 'valid' 
                ? 'border-green-300 bg-green-50' 
                : validationStatus === 'invalid'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
            } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        
        {validationStatus === 'invalid' && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Subreddit not found or inaccessible
          </p>
        )}
        
        {validationStatus === 'valid' && selectedSubreddit && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ready to analyze r/{selectedSubreddit}
          </p>
        )}
      </div>

      {showSuggestions && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <TrendingUp className="w-4 h-4" />
              Popular Business Subreddits
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {POPULAR_BUSINESS_SUBREDDITS.map((subreddit) => (
              <button
                key={subreddit}
                onClick={() => handleSuggestionClick(subreddit)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium">r/{subreddit}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};