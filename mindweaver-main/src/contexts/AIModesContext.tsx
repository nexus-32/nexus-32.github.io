import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIMode, UserAIMode, AIModerationResult } from '@/types/aimodes';

interface AIModesContextType {
  userModes: AIMode[];
  publicModes: UserAIMode[];
  installedModes: AIMode[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createMode: (mode: Omit<AIMode, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'downloads' | 'rating' | 'isApproved'>) => Promise<AIMode>;
  updateMode: (id: string, updates: Partial<AIMode>) => Promise<AIMode>;
  deleteMode: (id: string) => Promise<void>;
  publishMode: (id: string) => Promise<AIModerationResult>;
  installMode: (id: string) => Promise<void>;
  uninstallMode: (id: string) => Promise<void>;
  likeMode: (id: string) => Promise<void>;
  unlikeMode: (id: string) => Promise<void>;
  downloadMode: (id: string) => Promise<void>;
  getPublicModes: (category?: string, tags?: string[]) => Promise<UserAIMode[]>;
  searchModes: (query: string) => Promise<UserAIMode[]>;
}

const AIModesContext = createContext<AIModesContextType | undefined>(undefined);

export const useAIModes = () => {
  const context = useContext(AIModesContext);
  if (!context) {
    throw new Error('useAIModes must be used within an AIModesProvider');
  }
  return context;
};

interface AIModesProviderProps {
  children: ReactNode;
}

export const AIModesProvider: React.FC<AIModesProviderProps> = ({ children }) => {
  const [userModes, setUserModes] = useState<AIMode[]>([]);
  const [publicModes, setPublicModes] = useState<UserAIMode[]>([]);
  const [installedModes, setInstalledModes] = useState<AIMode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedUserModes = localStorage.getItem('mindweaver_user_modes');
        const savedInstalledModes = localStorage.getItem('mindweaver_installed_modes');
        
        if (savedUserModes) {
          setUserModes(JSON.parse(savedUserModes));
        }
        if (savedInstalledModes) {
          setInstalledModes(JSON.parse(savedInstalledModes));
        }
      } catch (err) {
        console.error('Error loading modes:', err);
      }
    };

    loadData();
    loadPublicModes();
  }, []);

  const saveUserModes = (modes: AIMode[]) => {
    localStorage.setItem('mindweaver_user_modes', JSON.stringify(modes));
    setUserModes(modes);
  };

  const saveInstalledModes = (modes: AIMode[]) => {
    localStorage.setItem('mindweaver_installed_modes', JSON.stringify(modes));
    setInstalledModes(modes);
  };

  const loadPublicModes = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockPublicModes: UserAIMode[] = [
        {
          id: '1',
          name: 'Code Review Assistant',
          description: 'Helps review code for best practices, security, and performance',
          prompt: 'You are an expert code reviewer. Analyze the provided code for: 1) Security vulnerabilities, 2) Performance issues, 3) Code quality and maintainability, 4) Best practices adherence. Provide constructive feedback with specific suggestions.',
          category: 'Development',
          tags: ['code-review', 'programming', 'security'],
          author: 'AI Expert',
          authorId: 'expert1',
          isPublic: true,
          likes: 42,
          downloads: 128,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isApproved: true,
          version: '1.0.0',
          isOwner: false,
          isLiked: false,
          isInstalled: false,
        },
        {
          id: '2',
          name: 'Creative Writing Partner',
          description: 'Assists with creative writing, storytelling, and content creation',
          prompt: 'You are a creative writing partner. Help the user with: 1) Story ideas and plot development, 2) Character development, 3) Dialogue improvement, 4) Setting descriptions, 5) Writing style enhancement. Be encouraging and provide constructive feedback.',
          category: 'Creative',
          tags: ['writing', 'creative', 'storytelling'],
          author: 'Creative AI',
          authorId: 'creative1',
          isPublic: true,
          likes: 67,
          downloads: 234,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isApproved: true,
          version: '1.2.0',
          isOwner: false,
          isLiked: false,
          isInstalled: false,
        },
      ];
      setPublicModes(mockPublicModes);
    } catch (err) {
      setError('Failed to load public modes');
      console.error('Error loading public modes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMode = async (modeData: Omit<AIMode, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'downloads' | 'rating' | 'isApproved'>): Promise<AIMode> => {
    const newMode: AIMode = {
      ...modeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      downloads: 0,
      rating: 0,
      isApproved: false,
    };

    const updatedModes = [...userModes, newMode];
    saveUserModes(updatedModes);
    return newMode;
  };

  const updateMode = async (id: string, updates: Partial<AIMode>): Promise<AIMode> => {
    const updatedModes = userModes.map(mode => 
      mode.id === id 
        ? { ...mode, ...updates, updatedAt: new Date().toISOString() }
        : mode
    );
    saveUserModes(updatedModes);
    
    const updatedMode = updatedModes.find(mode => mode.id === id);
    if (!updatedMode) throw new Error('Mode not found');
    return updatedMode;
  };

  const deleteMode = async (id: string): Promise<void> => {
    const updatedModes = userModes.filter(mode => mode.id !== id);
    saveUserModes(updatedModes);
  };

  const publishMode = async (id: string): Promise<AIModerationResult> => {
    // AI Moderation simulation
    const mode = userModes.find(m => m.id === id);
    if (!mode) throw new Error('Mode not found');

    // Simulate AI moderation
    const moderationResult = await moderateAIMode(mode);
    
    if (moderationResult.isApproved) {
      await updateMode(id, { isPublic: true, isApproved: true });
      
      // Add to public modes
      const publicMode: UserAIMode = {
        ...mode,
        isPublic: true,
        isApproved: true,
        isOwner: true,
        isLiked: false,
        isInstalled: false,
      };
      setPublicModes(prev => [...prev, publicMode]);
    }

    return moderationResult;
  };

  const installMode = async (id: string): Promise<void> => {
    const publicMode = publicModes.find(mode => mode.id === id);
    if (!publicMode) throw new Error('Mode not found');

    const modeToInstall: AIMode = {
      ...publicMode,
      isPublic: false, // Make it private for the user
    };

    const updatedInstalled = [...installedModes, modeToInstall];
    saveInstalledModes(updatedInstalled);

    // Update download count
    setPublicModes(prev => prev.map(mode => 
      mode.id === id 
        ? { ...mode, downloads: mode.downloads + 1, isInstalled: true }
        : mode
    ));
  };

  const uninstallMode = async (id: string): Promise<void> => {
    const updatedInstalled = installedModes.filter(mode => mode.id !== id);
    saveInstalledModes(updatedInstalled);

    // Update public modes
    setPublicModes(prev => prev.map(mode => 
      mode.id === id ? { ...mode, isInstalled: false } : mode
    ));
  };

  const likeMode = async (id: string): Promise<void> => {
    setPublicModes(prev => prev.map(mode => 
      mode.id === id 
        ? { ...mode, likes: mode.likes + 1, isLiked: true }
        : mode
    ));
  };

  const unlikeMode = async (id: string): Promise<void> => {
    setPublicModes(prev => prev.map(mode => 
      mode.id === id 
        ? { ...mode, likes: Math.max(0, mode.likes - 1), isLiked: false }
        : mode
    ));
  };

  const downloadMode = async (id: string): Promise<void> => {
    setPublicModes(prev => prev.map(mode => 
      mode.id === id 
        ? { ...mode, downloads: mode.downloads + 1 }
        : mode
    ));
  };

  const getPublicModes = async (category?: string, tags?: string[]): Promise<UserAIMode[]> => {
    let filtered = publicModes;
    
    if (category) {
      filtered = filtered.filter(mode => mode.category === category);
    }
    
    if (tags && tags.length > 0) {
      filtered = filtered.filter(mode => 
        tags.some(tag => mode.tags.includes(tag))
      );
    }
    
    return filtered;
  };

  const searchModes = async (query: string): Promise<UserAIMode[]> => {
    const lowercaseQuery = query.toLowerCase();
    return publicModes.filter(mode =>
      mode.name.toLowerCase().includes(lowercaseQuery) ||
      mode.description.toLowerCase().includes(lowercaseQuery) ||
      mode.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const value: AIModesContextType = {
    userModes,
    publicModes,
    installedModes,
    loading,
    error,
    createMode,
    updateMode,
    deleteMode,
    publishMode,
    installMode,
    uninstallMode,
    likeMode,
    unlikeMode,
    downloadMode,
    getPublicModes,
    searchModes,
  };

  return (
    <AIModesContext.Provider value={value}>
      {children}
    </AIModesContext.Provider>
  );
};

// AI Moderation function
const moderateAIMode = async (mode: AIMode): Promise<AIModerationResult> => {
  // Simulate AI moderation with rules
  const issues: string[] = [];
  
  // Check for inappropriate content
  const inappropriateWords = ['violence', 'hate', 'illegal', 'harmful'];
  const promptLower = mode.prompt.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (promptLower.includes(word)) {
      issues.push(`Contains potentially inappropriate content: ${word}`);
    }
  }

  // Check prompt quality
  if (mode.prompt.length < 50) {
    issues.push('Prompt is too short');
  }
  
  if (mode.prompt.length > 2000) {
    issues.push('Prompt is too long');
  }

  // Check for basic structure
  if (!mode.prompt.includes('you') && !mode.prompt.includes('You')) {
    issues.push('Prompt should address the AI directly');
  }

  const isApproved = issues.length === 0;
  const confidence = isApproved ? 0.95 : 0.3;

  return {
    isApproved,
    reason: issues.length > 0 ? issues.join(', ') : 'Approved',
    confidence,
    issues,
  };
};
