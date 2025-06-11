import React, { useState, useEffect } from 'react';
import { X, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  currentConfig: AppConfig | null;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<AppConfig>({
    redditClientId: '',
    redditClientSecret: '',
    geminiApiKey: ''
  });
  const [errors, setErrors] = useState<Partial<AppConfig>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const validateConfig = (): boolean => {
    const newErrors: Partial<AppConfig> = {};
    
    if (!config.redditClientId.trim()) {
      newErrors.redditClientId = 'Reddit Client ID is required';
    }
    if (!config.redditClientSecret.trim()) {
      newErrors.redditClientSecret = 'Reddit Client Secret is required';
    }
    if (!config.geminiApiKey.trim()) {
      newErrors.geminiApiKey = 'Gemini API Key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API validation
      onSave(config);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">API Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Setup Required</p>
                  <p>You'll need Reddit API credentials and a Gemini API key to use this assistant.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reddit Client ID
              </label>
              <input
                type="text"
                value={config.redditClientId}
                onChange={(e) => setConfig(prev => ({ ...prev, redditClientId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.redditClientId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your Reddit Client ID"
              />
              {errors.redditClientId && (
                <p className="mt-1 text-sm text-red-600">{errors.redditClientId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reddit Client Secret
              </label>
              <input
                type="password"
                value={config.redditClientSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, redditClientSecret: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.redditClientSecret ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your Reddit Client Secret"
              />
              {errors.redditClientSecret && (
                <p className="mt-1 text-sm text-red-600">{errors.redditClientSecret}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={config.geminiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.geminiApiKey ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your Gemini API Key"
              />
              {errors.geminiApiKey && (
                <p className="mt-1 text-sm text-red-600">{errors.geminiApiKey}</p>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Your API keys are stored locally in your browser and never sent to external servers except for authorized API calls.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};