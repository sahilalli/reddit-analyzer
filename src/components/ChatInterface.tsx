import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
  isLoading: boolean;
  subreddit: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onClearConversation,
  isLoading,
  subreddit
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const EXAMPLE_QUESTIONS = [
    "What are the main pain points discussed in this subreddit?",
    "What business opportunities can you identify from recent posts?",
    "Who are the potential customers based on the discussions?", 
    "What SaaS ideas emerge from the problems mentioned?",
    "What are people willing to pay for based on the conversations?"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Your Business Intelligence Analysis
              </h3>
              <p className="text-gray-600 mb-6">
                Ask questions about r/{subreddit} to discover business opportunities, pain points, and potential customers.
              </p>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Try asking:</p>
                {EXAMPLE_QUESTIONS.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </>
        )}
        
        {isLoading && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-gray-600">Analyzing Reddit data and generating insights...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about business opportunities in r/${subreddit}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={onClearConversation}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {inputValue.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.slice(-2).map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInputValue(question)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};