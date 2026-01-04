import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Menu, Mic, Search, Send, Settings as SettingsIcon, Sparkles, Upload, FileText, Brain, Heart, Zap, Code, Briefcase, GraduationCap } from 'lucide-react';
import PersonalitySelector from '@/components/chat/PersonalitySelector';
import MessageList from '@/components/chat/MessageList';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import VisualSearch, { type SearchTab } from '@/components/visual-search/VisualSearch';
import FileUpload from '@/components/FileUpload';
import AnalystMode from '@/components/AnalystMode';
import AIModeSelector from '@/components/AIModeSelector';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVoice } from '@/contexts/VoiceContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AIMode } from '@/types/aimodes';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detected_mood?: string;
  created_at: string;
};

type Personality = 'coach' | 'friend' | 'analyst' | 'creative' | string;

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { listenOnce, speak, isListening, setSelectedVoiceURI } = useVoice();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState<Personality>('friend');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock user for demo
  const user = {
    id: 'demo-user',
    email: 'demo@example.com',
    user_metadata: {
      name: 'Demo User',
      avatar_url: null
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [customPersonalities, setCustomPersonalities] = useState<any[]>([]);

  useEffect(() => {
    setSelectedVoiceURI(settings.voiceURI ?? null);
  }, [settings.voiceURI, setSelectedVoiceURI]);

  // Load custom personalities from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customPersonalities');
      if (saved) {
        const customPersonalities = JSON.parse(saved);
        // Convert to format expected by PersonalitySelector
        const formattedPersonalities = customPersonalities.map((p: any) => ({
          id: p.id,
          label: p.name,
          icon: (() => {
            const iconMap: any = {
              'Brain': Brain,
              'Heart': Heart,
              'Sparkles': Sparkles,
              'Zap': Zap,
              'Code': Code,
              'Briefcase': Briefcase,
              'GraduationCap': GraduationCap
            };
            return iconMap[p.icon] || Brain;
          })(),
          color: p.color,
          isCustom: true
        }));
        setCustomPersonalities(formattedPersonalities);
      }
    } catch (error) {
      console.error('Error loading custom personalities:', error);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if ((settings as any)?.twoFactorMode === 'email') {
      ;(async () => {
        try {
          const { data: pref } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', user.id)
            .eq('preference_key', 'email2fa_enabled')
            .maybeSingle();

          const enabled = pref?.preference_value === 'true';
          if (!enabled) return;

          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData.session;
          if (!session) {
            navigate('/auth');
            return;
          }

          const raw = sessionStorage.getItem('mw_email2fa_ok');
          if (!raw) {
            navigate('/auth');
            return;
          }
          const parsed = JSON.parse(raw);
          const ok = parsed?.uid === session.user.id && parsed?.tokenTail === session.access_token.slice(-16);
          if (!ok) {
            navigate('/auth');
            return;
          }
        } catch {
          navigate('/auth');
        }
      })();
    }

    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation();
    }
  }, [conversationId, user, loading, settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  const parseSearchIntent = (text: string): { tab?: SearchTab; query: string } | null => {
    const t = text.trim();
    if (!t) return null;

    const lower = t.toLowerCase();

    const isSearch = /(поиск|найди|покажи|ищи)/i.test(lower);
    if (!isSearch) return null;

    let tab: SearchTab | undefined;
    if (/(рисунк|арт|скетч|вектор)/i.test(lower)) tab = 'art';
    else if (/(изображ|фото|картинк|сток)/i.test(lower)) tab = 'images';
    else if (/(покупк|товар|магазин|цена|купить)/i.test(lower)) tab = 'shopping';
    else tab = 'all';

    const query = t
      .replace(/^(покажи|найди|ищи|поиск)\s+/i, '')
      .replace(/^(мне\s+)?(картинки|изображения|рисунки|покупки)\s+/i, '')
      .trim();

    return { tab, query: query || t };
  };

  const openSmartSearch = (req: { tab?: SearchTab; query: string }) => {
    setIsSearchOpen(true);
    setSearchRequest({ tab: req.tab, query: req.query });
  };

  const handleChatMic = async () => {
    try {
      const transcript = await listenOnce({ lang: settings.language || 'ru-RU' });
      if (!transcript.trim()) return;

      const intent = parseSearchIntent(transcript);
      if (intent && intent.query.trim()) {
        openSmartSearch(intent);
        if (settings.voiceEnabled) {
          speak(
            `Открываю умный поиск. Вкладка: ${
              intent.tab === 'art'
                ? 'рисунки'
                : intent.tab === 'images'
                  ? 'изображения'
                  : intent.tab === 'shopping'
                    ? 'покупки'
                    : 'все'
            }.`,
            {
              rate: settings.voiceSpeed,
              pitch: settings.voicePitch,
              volume: Math.max(0, Math.min(1, settings.voiceVolume / 100)),
              lang: settings.language || 'ru-RU',
            }
          );
        }
      } else {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch (e) {
      toast({
        title: 'Голосовой ввод недоступен',
        description: e instanceof Error ? e.message : 'Не удалось распознать речь',
        variant: 'destructive',
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        personality: (personality as string).match(/^(coach|friend|analyst|creative)$/) ? personality as 'coach' | 'friend' | 'analyst' | 'creative' : 'friend',
        title: 'Новый разговор',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    setCurrentConversationId(data.id);
    navigate(`/chat/${data.id}`);
  };

  const loadConversation = async (id: string) => {
    setCurrentConversationId(id);

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conv) {
      toast({ title: 'Ошибка', description: 'Разговор не найден', variant: 'destructive' });
      navigate('/chat');
      return;
    }

    setPersonality(conv.personality);

    const { data: msgs, error: msgsError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgsError) {
      toast({ title: 'Ошибка', description: msgsError.message, variant: 'destructive' });
      return;
    }

    setMessages((msgs || []) as Message[]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      await supabase.from('messages').insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: assistantMessage,
      });

      if (settings.voiceEnabled) {
        const snippet = assistantMessage.replace(/\s+/g, ' ').trim().slice(0, 350);
        if (snippet) {
          speak(snippet, {
            rate: settings.voiceSpeed,
            pitch: settings.voicePitch,
            volume: Math.max(0, Math.min(1, settings.voiceVolume / 100)),
            lang: settings.language || 'ru-RU',
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onNewConversation={createNewConversation}
        />
      )}

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="border-b border-border/40 bg-gradient-subtle p-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-semibold">MindWeaver</h1>
              </div>

              <div className="flex items-center gap-2">
                {isMobile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Меню"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                )}
                <PersonalitySelector 
                value={personality} 
                onChange={setPersonality} 
                customPersonalities={customPersonalities}
              />
                <LanguageSelector className="hidden sm:flex w-[180px]" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFileUploadOpen(true)}
                  title="Загрузить файлы"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  title="Умный поиск"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={isListening ? 'default' : 'outline'}
                  size="icon"
                  onClick={handleChatMic}
                  title="Голосовой ввод"
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/settings')}
                  title="Настройки"
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <AIModeSelector 
                onModeSelect={setSelectedAIMode}
                currentMode={selectedAIMode}
              />
              <MessageList 
                messages={messages} 
                isLoading={isLoading}
                fontSize={settings.fontSize}
                messageSpacing={settings.messageSpacing}
                aiAvatar={settings.aiAvatar}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-border/40 bg-gradient-subtle p-4">
            <div className="max-w-6xl mx-auto flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Напишите сообщение..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="self-end"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isMobile && isSearchOpen && (
          <div className="w-[420px] border-l border-border/40 bg-background">
            <div className="h-full p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Умный поиск</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsSearchOpen(false)}>
                  Закрыть
                </Button>
              </div>
              <VisualSearch searchRequest={searchRequest} />
            </div>
          </div>
        )}

        {!isMobile && isFileUploadOpen && (
          <div className="w-[420px] border-l border-border/40 bg-background">
            <div className="h-full p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Загрузка файлов</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsFileUploadOpen(false)}>
                  Закрыть
                </Button>
              </div>
              <FileUpload 
                onFilesChange={setUploadedFiles}
                className="max-h-[calc(100vh-120px)]"
              />
            </div>
          </div>
        )}

        {personality === 'analyst' && !isSearchOpen && !isFileUploadOpen && (
          <div className="w-[420px] border-l border-border/40 bg-background">
            <div className="h-full p-4 overflow-y-auto">
              <AnalystMode />
            </div>
          </div>
        )}

        {isMobile && (
          <>
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetContent side="left" className="p-0">
                <div className="p-4 border-b border-border/40">
                  <LanguageSelector className="w-full" />
                </div>
                <ConversationSidebar
                  currentConversationId={currentConversationId}
                  onNewConversation={createNewConversation}
                />
              </SheetContent>
            </Sheet>

            <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <SheetContent side="bottom" className="h-[85vh] p-4">
                <SheetHeader>
                  <SheetTitle>Умный поиск</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-[calc(85vh-120px)]">
                  <VisualSearch searchRequest={searchRequest} />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
              <SheetContent side="bottom" className="h-[85vh] p-4">
                <SheetHeader>
                  <SheetTitle>Загрузка файлов</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-[calc(85vh-120px)] overflow-y-auto">
                  <FileUpload onFilesChange={setUploadedFiles} />
                </div>
              </SheetContent>
            </Sheet>

            {personality === 'analyst' && (
              <Sheet open={true} onOpenChange={() => {}}>
                <SheetContent side="bottom" className="h-[85vh] p-4">
                  <SheetHeader>
                    <SheetTitle>Аналитический режим</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(85vh-120px)] overflow-y-auto">
                    <AnalystMode />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
