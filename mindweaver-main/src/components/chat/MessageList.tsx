import { Card } from '@/components/ui/card';
import { Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detected_mood?: string;
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  fontSize?: number;
  messageSpacing?: number;
  aiAvatar?: string;
}

const avatarEmojis: Record<string, string> = {
  sparkles: '✨',
  brain: '🧠',
  heart: '💙',
  star: '⭐',
  moon: '🌙',
};

const MessageList = ({ messages, isLoading, fontSize = 16, messageSpacing = 16, aiAvatar = 'sparkles' }: MessageListProps) => {
  const avatarEmoji = avatarEmojis[aiAvatar] || '✨';
  
  return (
    <div data-no-translate style={{ gap: `${messageSpacing}px` }} className="flex flex-col">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-xl">
              {avatarEmoji}
            </div>
          )}
          <Card
            className={`max-w-[80%] p-4 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border-border/40'
            }`}
            style={{ fontSize: `${fontSize}px` }}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </Card>
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xl animate-pulse">
            {avatarEmoji}
          </div>
          <Card className="p-4 bg-card border-border/40">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MessageList;
