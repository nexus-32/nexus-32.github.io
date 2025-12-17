import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  personality: string;
};

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onNewConversation: () => void;
}

const ConversationSidebar = ({
  currentConversationId,
  onNewConversation,
}: ConversationSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="w-64 border-r border-border/40 bg-gradient-subtle flex flex-col">
      <div className="p-4 border-b border-border/40 space-y-2">
        <Button onClick={onNewConversation} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Новый разговор
        </Button>
        <Button 
          onClick={() => navigate('/settings')} 
          variant="outline" 
          className="w-full gap-2"
        >
          <Settings className="w-4 h-4" />
          Настройки
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentConversationId === conv.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="truncate text-sm">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40">
        <Button onClick={handleSignOut} variant="outline" className="w-full gap-2">
          <LogOut className="w-4 h-4" />
          Выйти
        </Button>
      </div>
    </div>
  );
};

export default ConversationSidebar;
