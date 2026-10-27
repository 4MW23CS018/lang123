/**
 * Individual chat message bubble with distinct styling for user vs assistant.
 * Supports basic markdown-like formatting: **bold**, `code`, line breaks.
 */
export default function ChatBubble({ message, index }) {
  const isUser = message.role === 'user';

  // Simple markdown-ish rendering
  const renderContent = (text) => {
    // Split by newlines, then process each line
    return text.split('\n').map((line, lineIdx) => {
      // Process bold (**text**) and code (`text`)
      const parts = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Code
        const codeMatch = remaining.match(/`(.+?)`/);

        let firstMatch = null;
        let firstIdx = Infinity;

        if (boldMatch && remaining.indexOf(boldMatch[0]) < firstIdx) {
          firstIdx = remaining.indexOf(boldMatch[0]);
          firstMatch = { type: 'bold', match: boldMatch };
        }
        if (codeMatch && remaining.indexOf(codeMatch[0]) < firstIdx) {
          firstIdx = remaining.indexOf(codeMatch[0]);
          firstMatch = { type: 'code', match: codeMatch };
        }

        if (!firstMatch) {
          parts.push(<span key={key++}>{remaining}</span>);
          break;
        }

        // Add text before the match
        const beforeText = remaining.substring(0, firstIdx);
        if (beforeText) parts.push(<span key={key++}>{beforeText}</span>);

        if (firstMatch.type === 'bold') {
          parts.push(
            <strong key={key++} style={{ fontWeight: 700, color: isUser ? '#fff' : 'var(--text-primary)' }}>
              {firstMatch.match[1]}
            </strong>
          );
        } else {
          parts.push(
            <code key={key++} style={{
              padding: '1px 5px', borderRadius: 4, fontSize: '0.9em',
              background: isUser ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)',
              fontFamily: 'monospace',
            }}>
              {firstMatch.match[1]}
            </code>
          );
        }

        remaining = remaining.substring(firstIdx + firstMatch.match[0].length);
      }

      return (
        <span key={lineIdx}>
          {parts}
          {lineIdx < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start', gap: 8,
      animation: `fadeUp 0.3s ease-out ${Math.min(index * 0.03, 0.3)}s both`,
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--purple), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>
          🤖
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser
          ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: 13.5, lineHeight: 1.55,
        boxShadow: isUser
          ? '0 4px 14px rgba(139,92,246,0.25)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        wordBreak: 'break-word',
      }}>
        {renderContent(message.content)}

        {time && (
          <div style={{
            fontSize: 10, marginTop: 4,
            color: isUser ? 'rgba(255,255,255,0.5)' : 'var(--text-faint)',
            textAlign: isUser ? 'right' : 'left',
          }}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
