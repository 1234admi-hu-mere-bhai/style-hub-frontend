import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import botAvatar from '@/assets/bot-avatar.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };

const WELCOME_MSG: Message = {
  role: 'assistant',
  content: "Hey there! 👋 I'm **StyleGenie**, your personal shopping assistant at Muffi Gout Apparel Hub. How can I help you today?",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Something went wrong' }));
    onError(err.error || 'Something went wrong');
    return;
  }

  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }

  if (buf.trim()) {
    for (let raw of buf.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (!raw.startsWith('data: ')) continue;
      const json = raw.slice(6).trim();
      if (json === '[DONE]') continue;
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {}
    }
  }

  onDone();
}

const LiveSupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Show speech bubble after 3 seconds, auto-dismiss after 6 more
  useEffect(() => {
    if (open || bubbleDismissed) return;
    const showTimer = setTimeout(() => setShowBubble(true), 3000);
    return () => clearTimeout(showTimer);
  }, [open, bubbleDismissed]);

  useEffect(() => {
    if (!showBubble) return;
    const hideTimer = setTimeout(() => {
      setShowBubble(false);
      setBubbleDismissed(true);
    }, 6000);
    return () => clearTimeout(hideTimer);
  }, [showBubble]);

  // Load chat history when user is available and chat opens
  const loadHistory = useCallback(async () => {
    if (!user || historyLoaded) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const loaded: Message[] = data.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        setMessages([WELCOME_MSG, ...loaded]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
    setHistoryLoaded(true);
  }, [user, historyLoaded]);

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Persist a message to DB
  const saveMessage = async (role: string, content: string) => {
    if (!user) return;
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    try {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      setMessages([WELCOME_MSG]);
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput('');
    setLoading(true);

    // Save user message
    saveMessage('user', text);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length === allMsgs.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: allMsgs,
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          // Save completed assistant message
          if (assistantSoFar) saveMessage('assistant', assistantSoFar);
        },
        onError: (msg) => {
          const errContent = `Sorry, I ran into an issue: ${msg}. Please try again!`;
          setMessages(prev => [...prev, { role: 'assistant', content: errContent }]);
          setLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Please try again.' }]);
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <div className="fixed bottom-36 md:bottom-6 right-6 z-50 flex items-end gap-2">
          {/* Speech bubble */}
          {showBubble && (
            <div
              className="relative bg-background border border-border shadow-lg rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium text-foreground animate-fade-in cursor-pointer max-w-[180px]"
              onClick={() => { setShowBubble(false); setBubbleDismissed(true); setOpen(true); }}
            >
              <span>Hi! 👋 How can I assist you?</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowBubble(false); setBubbleDismissed(true); }}
                className="absolute -top-2 -left-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={() => { setOpen(true); setShowBubble(false); setBubbleDismissed(true); }}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 overflow-hidden border-2 border-primary bg-background"
            aria-label="Open support chat"
          >
            <img src={botAvatar} alt="StyleGenie" className="w-full h-full object-cover" />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-[380px] h-[500px] md:h-[540px] rounded-2xl shadow-2xl border border-border bg-background flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
              <AvatarImage src={botAvatar} alt="StyleGenie" />
              <AvatarFallback>SG</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">StyleGenie</p>
              <p className="text-[11px] opacity-80">Muffi Gout AI Assistant</p>
            </div>
            {user && messages.length > 1 && (
              <button
                onClick={clearHistory}
                className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
                title="Clear chat history"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <Avatar className="h-7 w-7 mt-1 shrink-0">
                      <AvatarImage src={botAvatar} alt="StyleGenie" />
                      <AvatarFallback>SG</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-7 w-7 mt-1 shrink-0">
                    <AvatarImage src={botAvatar} alt="StyleGenie" />
                    <AvatarFallback>SG</AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Ask about products, shipping..." : "Sign in to save chat history..."}
                className="flex-1 rounded-full text-sm h-9"
                disabled={loading}
              />
              <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveSupportChat;
