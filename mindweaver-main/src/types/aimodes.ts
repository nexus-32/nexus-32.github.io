export interface AIMode {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  isPublic: boolean;
  likes: number;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  version: string;
}

export interface AIModeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserAIMode extends AIMode {
  isOwner: boolean;
  isLiked: boolean;
  isInstalled: boolean;
}

export interface AIModerationResult {
  isApproved: boolean;
  reason?: string;
  confidence: number;
  issues: string[];
}
