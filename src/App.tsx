import React, { useState, useEffect } from 'react';
import { Settings, Brain, AlertTriangle, Loader2, Github } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { SubredditSelector } from './components/SubredditSelector';
import { ChatInterface } from './components/ChatInterface';
import { SubredditStats } from './components/SubredditStats';
import { AppConfig, Conversation, ChatMessage, RedditData } from './types';
import { LocalStorageService } from './services/localStorage';
import { RedditService } from './services/reddit';
import { GeminiService } from './services/gemini';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [redditData, setRedditData] = useState<RedditData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isValidatingSubreddit, setIsValidatingSubreddit] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Services
  const [redditService, setRedditService] = useState<RedditService | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  useEffect(() => {
    // Load saved configuration (will return default config with credentials if none exists)
    const savedConfig = LocalStorageService.loadConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      initializeServices(savedConfig);
    }

    // Load saved conversations
    const savedConversations = LocalStorageService.loadConversations();
    setConversations(savedConversations);
  }, []);

  const initializeServices = (appConfig: AppConfig) => {
    setRedditService(new RedditService(appConfig.redditClientId, appConfig.redditClientSecret));
    setGeminiService(new GeminiService(appConfig.geminiApiKey));
  };

  const handleConfigSave = (newConfig: AppConfig) => {
    setConfig(newConfig);
    LocalStorageService.saveConfig(newConfig);
    initializeServices(newConfig);
    setError(null);
  };

  const validateSubreddit = async (subreddit: string): Promise<boolean> => {
    if (!redditService) return false;
    
    setIsValidatingSubreddit(true);
    try {
      const isValid = await redditService.validateSubreddit(subreddit);
      if (isValid) {
        setError(null);
      }
      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    } finally {
      setIsValidatingSubreddit(false);
    }
  };

  const handleSubredditChange = async (subreddit: string) => {
    setSelectedSubreddit(subreddit);
    setError(null);
    
    if (!redditService) return;

    // Check for cached data
    const cachedData = LocalStorageService.loadRedditData(subreddit);
    if (cachedData) {
      setRedditData(cachedData);
      loadOrCreateConversation(subreddit);
      return;
    }

    // Fetch fresh data
    setIsLoadingData(true);
    try {
      const data = await redditService.fetchSubredditData(subreddit);
      setRedditData(data);
      LocalStorageService.saveRedditData(subreddit, data);
      loadOrCreateConversation(subreddit);
    } catch (error) {
      console.error('Failed to fetch subreddit data:', error);
      setError(`Failed to fetch data for r/${subreddit}. Please try again.`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadOrCreateConversation = (subreddit: string) => {
    const existingConversation = conversations.find(conv => conv.subreddit === subreddit);
    if (existingConversation) {
      setCurrentConversation(existingConversation);
    } else {
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        subreddit,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setCurrentConversation(newConversation);
      const updatedConversations = [...conversations, newConversation];
      setConversations(updatedConversations);
      LocalStorageService.saveConversations(updatedConversations);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation || !redditData || !geminiService) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Add user message
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: Date.now(),
    };
    setCurrentConversation(updatedConversation);

    // Generate AI response
    setIsGeneratingResponse(true);
    try {
      const response = await geminiService.generateResponse(
        content,
        redditData,
        updatedConversation.messages.filter(msg => msg.role === 'user' || msg.role === 'assistant')
      );

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        sources: extractSources(response),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: Date.now(),
      };

      setCurrentConversation(finalConversation);
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === finalConversation.id ? finalConversation : conv
      );
      setConversations(updatedConversations);
      LocalStorageService.saveConversations(updatedConversations);

    } catch (error) {
      console.error('Failed to generate response:', error);
      setError('Failed to generate AI response. Please try again.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const extractSources = (content: string): string[] => {
    // Extract potential sources from AI response
    const sources: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('r/') && line.includes('post') || line.includes('comment')) {
        sources.push(line.trim());
      }
    });
    
    return sources.slice(0, 3); // Limit to 3 sources
  };

  const handleClearConversation = () => {
    if (!currentConversation) return;

    const clearedConversation = {
      ...currentConversation,
      messages: [],
      updatedAt: Date.now(),
    };

    setCurrentConversation(clearedConversation);
    
    const updatedConversations = conversations.map(conv => 
      conv.id === clearedConversation.id ? clearedConversation : conv
    );
    setConversations(updatedConversations);
    LocalStorageService.saveConversations(updatedConversations);
  };

  // Show loading state while initializing
  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reddit Insights Assistant</h1>
          <p className="text-gray-600">Initializing with your credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reddit Insights Assistant</h1>
              <p className="text-sm text-gray-600">Discover business opportunities through Reddit data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              API Connected
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Subreddit Selection & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Subreddit</h2>
              <SubredditSelector
                selectedSubreddit={selectedSubreddit}
                onSubredditChange={handleSubredditChange}
                onValidate={validateSubreddit}
                isValidating={isValidatingSubreddit}
              />
            </div>

            {isLoadingData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-gray-600">Fetching Reddit data...</span>
                </div>
              </div>
            )}

            {redditData && (
              <SubredditStats data={redditData} />
            )}
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)]">
              {selectedSubreddit && currentConversation ? (
                <ChatInterface
                  messages={currentConversation.messages}
                  onSendMessage={handleSendMessage}
                  onClearConversation={handleClearConversation}
                  isLoading={isGeneratingResponse}
                  subreddit={selectedSubreddit}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Ready to Analyze Reddit Data</p>
                    <p className="text-sm">Select a subreddit to start discovering business opportunities</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleConfigSave}
        currentConfig={config}
      />
    </div>
  );
}

export default App;