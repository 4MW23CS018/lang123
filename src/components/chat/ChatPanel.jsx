import { useState, useRef, useEffect, useCallback } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ChatBubble from './ChatBubble';

const SUGGESTED_PROMPTS = [
  { icon: '👋', text: 'How do I say "hello"?' },
  { icon: '🔤', text: 'Teach me the vowels' },
  { icon: '🍛', text: 'How to order food?' },
  { icon: '📝', text: 'Explain basic grammar' },
  { icon: '🗣️', text: 'Common daily phrases' },
  { icon: '🔢', text: 'How to count to 10?' },
];

export default function ChatPanel({ compact = false }) {
  const userId = localStorage.getItem('userId');
  const language = localStorage.getItem('selectedLanguage') || 'Kannada';

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const chatAction = useAction(api.chatbot.chat);
  const history = useQuery(
    api.chatMessages.getChatHistory,
    userId ? { userId, language } : 'skip'
  );
  const clearHistory = useMutation(api.chatMessages.clearHistory);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading, scrollToBottom]);

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isLoading || !userId) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await chatAction({
        userId,
        message: text,
        language,
      });
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (!userId) return;
    await clearHistory({ userId, language });
  };

  const messages = history || [];
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="chat-panel" style={{
      display: 'flex', flexDirection: 'column',
      height: compact ? '480px' : '100%',
      background: 'var(--bg-card)',
      borderRadius: compact ? 'var(--radius-xl)' : 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: compact ? '0 25px 60px rgba(0,0,0,0.4)' : 'none',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: compact ? '14px 16px' : '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--text-primary)',
          }}>
            ✨
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              EnZo
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e', display: 'inline-block',
                boxShadow: '0 0 6px rgba(34,197,94,0.5)',
              }} />
              Learning {language}
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            title="Clear chat history"
            style={{
              padding: '6px 10px', borderRadius: 8,
              background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.borderColor = 'var(--coral)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {/* ── Messages Area ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {isEmpty && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            animation: 'fadeUp 0.5s ease-out',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              💬
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                Ask me anything about {language}!
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>
                I know your curriculum, progress, and can help with pronunciation, grammar, and cultural tips.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8, width: '100%', maxWidth: 340,
            }}>
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s var(--ease-out)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--purple-border)';
                    e.currentTarget.style.background = 'var(--purple-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={msg._id || i} message={msg} index={i} />
        ))}

        {isLoading && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            animation: 'fadeUp 0.3s ease-out',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 10,
              background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0, color: 'var(--text-primary)',
            }}>
              ✨
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            }}>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'var(--coral-bg)', border: '1px solid rgba(244,63,94,0.2)',
            color: 'var(--coral)', fontSize: 13, textAlign: 'center',
            animation: 'fadeUp 0.3s ease-out',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div style={{
        padding: compact ? '10px 12px' : '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${language}...`}
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid var(--border-default)',
              borderRadius: 14, padding: '10px 14px',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 14, lineHeight: 1.4, outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              maxHeight: 100, overflow: 'auto',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--purple)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: input.trim() && !isLoading
                ? 'var(--text-primary)'
                : 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0, color: input.trim() && !isLoading ? 'var(--bg-base)' : 'var(--text-muted)',
              transition: 'all 0.25s var(--ease-spring)',
              transform: input.trim() && !isLoading ? 'scale(1)' : 'scale(0.95)',
              opacity: input.trim() && !isLoading ? 1 : 0.5,
            }}
            onMouseEnter={e => {
              if (input.trim() && !isLoading) e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              if (input.trim() && !isLoading) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-faint)', textAlign: 'center',
          marginTop: 6,
        }}>
          Powered by Gemini · Grounded in your curriculum
        </div>
      </div>
    </div>
  );
}
