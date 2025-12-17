import { useState, useEffect, useRef } from 'react';
import { Mic, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useVoice } from '@/contexts/VoiceContext';

export type SearchTab = 'all' | 'images' | 'art' | 'shopping';

type VisualSearchRequest = {
  tab?: SearchTab;
  query: string;
};

type VisualSearchProps = {
  searchRequest?: VisualSearchRequest | null;
};

interface SearchResult {
  id: string;
  type: 'text' | 'image' | 'product';
  title?: string;
  content?: string;
  imageUrl?: string;
  price?: string;
  source?: string;
  url?: string;
}

export default function VisualSearch({ searchRequest }: VisualSearchProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { settings } = useUserSettings();
  const { speak } = useVoice();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
          handleSearch(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!searchRequest) return;
    const nextTab = searchRequest.tab ?? 'all';
    setActiveTab(nextTab);
    setSearchQuery(searchRequest.query);
    handleSearch(searchRequest.query, nextTab);
  }, [searchRequest]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      console.error('Speech recognition not supported');
    }
  };

  const handleSearch = async (query: string, tabOverride?: SearchTab) => {
    if (!query.trim()) return;

    const tab = tabOverride ?? activeTab;
    const q = query.trim();
    setResults([]);
    setIsSearching(true);
    setHasSearched(true);

    const nextResults: SearchResult[] = [];

    const lang = (settings.language || 'en').toLowerCase();
    const wikiLang = lang.split('-')[0] || 'en';
    const artHint = lang.startsWith('ru') ? ' рисунок иллюстрация арт' : ' illustration drawing art';
    const artQuery = `${q}${artHint}`;

    try {
      if (tab === 'all') {
        await Promise.allSettled([
          (async () => {
            try {
              const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
              const ddgRes = await fetch(ddgUrl);
              if (!ddgRes.ok) return;
              const ddg = await ddgRes.json();
              const abstractText: string | undefined = ddg?.AbstractText;
              const abstractUrl: string | undefined = ddg?.AbstractURL;
              const heading: string | undefined = ddg?.Heading;

              if (abstractText) {
                nextResults.push({
                  id: 'ddg-abstract',
                  type: 'text',
                  title: heading || 'DuckDuckGo',
                  content: abstractText,
                  source: abstractUrl || 'DuckDuckGo',
                  url: abstractUrl || undefined,
                });
              }

              const related: any[] = ddg?.RelatedTopics ?? [];
              related
                .flatMap((x) => (Array.isArray(x?.Topics) ? x.Topics : [x]))
                .slice(0, 3)
                .forEach((it, idx) => {
                  const text: string | undefined = it?.Text;
                  const firstURL: string | undefined = it?.FirstURL;
                  if (!text) return;
                  nextResults.push({
                    id: `ddg-related-${idx}`,
                    type: 'text',
                    title: text.split(' - ')[0] || 'DuckDuckGo',
                    content: text,
                    source: firstURL || 'DuckDuckGo',
                    url: firstURL || undefined,
                  });
                });
            } catch {
              return;
            }
          })(),
          (async () => {
            try {
              const wikiUrl = `https://${encodeURIComponent(wikiLang)}.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(q)}&limit=5`;
              const wikiRes = await fetch(wikiUrl);
              if (!wikiRes.ok) return;
              const data = (await wikiRes.json()) as [string, string[], string[], string[]];
              const titles = data[1] ?? [];
              const snippets = data[2] ?? [];
              const links = data[3] ?? [];
              titles.forEach((t, idx) => {
                nextResults.push({
                  id: `wiki-${idx}`,
                  type: 'text',
                  title: t,
                  content: snippets[idx],
                  source: links[idx] || 'Wikipedia',
                  url: links[idx] || undefined,
                });
              });
            } catch {
              return;
            }
          })(),
          (async () => {
            try {
              const seUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=stackoverflow&pagesize=5`;
              const seRes = await fetch(seUrl);
              if (!seRes.ok) return;
              const se = await seRes.json();
              const items: any[] = se?.items ?? [];
              items.slice(0, 5).forEach((it, idx) => {
                nextResults.push({
                  id: `se-${idx}-${it.question_id}`,
                  type: 'text',
                  title: it.title,
                  content: it.is_answered ? 'Есть принятый ответ' : 'Вопрос без принятого ответа',
                  source: it.link || 'StackOverflow',
                  url: it.link || undefined,
                });
              });
            } catch {
              return;
            }
          })(),
        ]);
      }

      if (tab === 'all' || tab === 'images' || tab === 'art') {
        try {
          const limit = tab === 'all' ? 6 : 12;
          const safe = settings.safeSearch ? '&mature=false' : '';

          const imageQuery = tab === 'art' ? artQuery : q;

          await Promise.allSettled([
            (async () => {
              try {
                const openverseUrl = `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(imageQuery)}&page_size=${limit}${safe}`;
                const ovRes = await fetch(openverseUrl);
                if (!ovRes.ok) return;
                const ov = await ovRes.json();
                const items: any[] = ov?.results ?? [];
                items.slice(0, limit).forEach((it, idx) => {
                  const title = it.title || it.alt || q;
                  const creator = it.creator ? ` • ${it.creator}` : '';
                  nextResults.push({
                    id: `ov-${tab}-${idx}-${it.id ?? idx}`,
                    type: 'image',
                    title: `${title}${creator}`,
                    imageUrl: it.thumbnail || it.url,
                    source: it.foreign_landing_url || 'Openverse',
                    url: it.foreign_landing_url || it.url || undefined,
                  });
                });
              } catch {
                return;
              }
            })(),
            (async () => {
              try {
                const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(imageQuery)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url`;
                const commonsRes = await fetch(commonsUrl);
                if (!commonsRes.ok) return;
                const commons = await commonsRes.json();
                const pages: Record<string, any> | undefined = commons?.query?.pages;
                if (!pages) return;
                Object.values(pages)
                  .slice(0, limit)
                  .forEach((p: any, idx: number) => {
                    const ii = p?.imageinfo?.[0];
                    const imageUrl = ii?.url;
                    if (!imageUrl) return;
                    const url = p?.pageid ? `https://commons.wikimedia.org/?curid=${p.pageid}` : imageUrl;
                    nextResults.push({
                      id: `commons-${tab}-${idx}-${p.pageid ?? idx}`,
                      type: 'image',
                      title: p?.title,
                      imageUrl,
                      source: 'Wikimedia Commons',
                      url,
                    });
                  });
              } catch {
                return;
              }
            })(),
          ]);
        } catch {
          
        }
      }

      if (tab === 'all' || tab === 'shopping') {
        try {
          const limit = tab === 'all' ? 6 : 12;

          const shopUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}&limit=${limit}`;
          const shopRes = await fetch(shopUrl);
          if (shopRes.ok) {
            const shop = await shopRes.json();
            const products: any[] = shop?.products ?? [];
            products.slice(0, limit).forEach((p, idx) => {
              nextResults.push({
                id: `dummy-${idx}-${p.id}`,
                type: 'product',
                title: p.title,
                price: `${p.price} $`,
                imageUrl: p.thumbnail,
                source: p.brand || 'DummyJSON',
                url: `https://dummyjson.com/products/${p.id}`,
              });
            });
          }

          if (nextResults.filter((r) => r.type === 'product').length === 0) {
            const fsRes = await fetch('https://fakestoreapi.com/products');
            if (fsRes.ok) {
              const items: any[] = await fsRes.json();
              const filtered = items.filter((p) => {
                const t = String(p?.title ?? '').toLowerCase();
                const d = String(p?.description ?? '').toLowerCase();
                const needle = q.toLowerCase();
                return t.includes(needle) || d.includes(needle);
              });
              filtered.slice(0, limit).forEach((p, idx) => {
                nextResults.push({
                  id: `fake-${idx}-${p.id}`,
                  type: 'product',
                  title: p.title,
                  price: `${p.price} $`,
                  imageUrl: p.image,
                  source: p.category || 'FakeStore',
                  url: `https://fakestoreapi.com/products/${p.id}`,
                });
              });
            }
          }
        } catch {
          
        }
      }
    } finally {
      setIsSearching(false);
    }

    const hasImages = nextResults.some((r) => r.type === 'image');
    const hasProducts = nextResults.some((r) => r.type === 'product');

    if ((tab === 'images' || tab === 'art') && !hasImages) {
      const qForImages = tab === 'art' ? artQuery : q;
      nextResults.push(
        {
          id: `fallback-${tab}-google-images`,
          type: 'text',
          title: tab === 'art' ? 'Искать рисунки в Google Images' : 'Искать изображения в Google Images',
          content: q,
          source: 'Google Images',
          url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(qForImages)}`,
        },
        {
          id: `fallback-${tab}-bing-images`,
          type: 'text',
          title: tab === 'art' ? 'Искать рисунки в Bing Images' : 'Искать изображения в Bing Images',
          content: q,
          source: 'Bing Images',
          url: `https://www.bing.com/images/search?q=${encodeURIComponent(qForImages)}`,
        }
      );
    }

    if (tab === 'shopping' && !hasProducts) {
      nextResults.push(
        {
          id: 'fallback-shopping-google',
          type: 'text',
          title: 'Искать товары в Google Shopping',
          content: q,
          source: 'Google Shopping',
          url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
        },
        {
          id: 'fallback-shopping-yandex-market',
          type: 'text',
          title: 'Искать товары в Яндекс.Маркет',
          content: q,
          source: 'Yandex Market',
          url: `https://market.yandex.ru/search?text=${encodeURIComponent(q)}`,
        },
        {
          id: 'fallback-shopping-ozon',
          type: 'text',
          title: 'Искать товары в Ozon',
          content: q,
          source: 'Ozon',
          url: `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}`,
        },
        {
          id: 'fallback-shopping-wildberries',
          type: 'text',
          title: 'Искать товары в Wildberries',
          content: q,
          source: 'Wildberries',
          url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}`,
        }
      );
    }

    setResults([...nextResults]);

    if (settings.voiceEnabled) {
      const count = nextResults.length;
      const label = tab === 'art' ? 'рисунков' : tab === 'images' ? 'изображений' : tab === 'shopping' ? 'товаров' : 'результатов';
      speak(`Нашёл ${count} ${label} по запросу: ${q}.`, {
        rate: settings.voiceSpeed,
        pitch: settings.voicePitch,
        volume: Math.max(0, Math.min(1, settings.voiceVolume / 100)),
        lang: settings.language || 'ru-RU',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const next = value as SearchTab;
            setActiveTab(next);
            if (searchQuery.trim()) {
              void handleSearch(searchQuery, next);
            }
          }}
          className="w-full"
        >
          <TabsList className="w-full justify-start gap-2 overflow-x-auto">
            <TabsTrigger className="whitespace-nowrap" value="all">
              Все
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap" value="images">
              Изображения
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap" value="art">
              Рисунки
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap" value="shopping">
              Покупки
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-11 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Mic size={18} />
            </button>
          </div>
          <Button type="submit" className="flex items-center gap-2" disabled={isSearching}>
            <Search size={16} />
            Найти
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Card
                key={result.id}
                className={`overflow-hidden ${result.url ? 'cursor-pointer hover:bg-accent/40 transition-colors' : ''}`}
                role={result.url ? 'button' : undefined}
                tabIndex={result.url ? 0 : undefined}
                onClick={() => {
                  if (!result.url) return;
                  window.open(result.url, '_blank', 'noopener,noreferrer');
                }}
                onKeyDown={(e) => {
                  if (!result.url) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(result.url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                {result.imageUrl && (
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img 
                      src={result.imageUrl} 
                      alt={result.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  {result.title && <h3 className="font-medium">{result.title}</h3>}
                  {result.price && <p className="text-lg font-bold">{result.price}</p>}
                  {result.source && (
                    <p className="text-sm text-gray-500 mt-1">{result.source}</p>
                  )}
                  {result.content && <p className="text-sm mt-2">{result.content}</p>}
                  {result.url && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(result.url!, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Открыть
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search size={48} className="mb-4" />
            {!searchQuery.trim() ? (
              <p>Введите запрос для поиска</p>
            ) : isSearching ? (
              <p>Ищу...</p>
            ) : hasSearched ? (
              <p>Ничего не найдено</p>
            ) : (
              <p>Введите запрос для поиска</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
