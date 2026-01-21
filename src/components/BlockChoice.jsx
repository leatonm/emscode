export default function BlockChoice({ choice, onClick, disabled = false, isHinted = false }) {
  const { node, isCorrect } = choice;
  
  const getTypeIcon = (type) => {
    const icons = {
      'action': '⚙️',
      'decision': '❓',
      'optional': '📋',
      'terminal': '🏁',
      'loop': '🔄',
      'event': '⚡',
      'jump': '↗️',
      'end': '🏁',
      'information': 'ℹ️',
      'reference': '📖'
    };
    return icons[type] || '📦';
  };

  const getTypeColor = (type) => {
    const colors = {
      'action': '#3b82f6',
      'decision': '#f59e0b',
      'optional': '#8b5cf6',
      'terminal': '#ef4444',
      'loop': '#06b6d4',
      'event': '#f59e0b',
      'jump': '#64748b',
      'end': '#ef4444',
      'information': '#14b8a6',
      'reference': '#06b6d4'
    };
    return colors[type] || '#3b82f6';
  };

  const handleDragStart = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('nodeId', choice.nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const typeColor = getTypeColor(node.type);

  return (
    <div
      data-choice-id={choice.nodeId}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onClick={disabled ? undefined : onClick}
      className={isHinted ? 'hint-highlight' : ''}
      style={{
        width: '100%',
        height: 'var(--pb-choice-h, 140px)',
        padding: '12px',
        border: `2px solid ${isHinted ? '#a78bfa' : typeColor}`,
        borderRadius: '16px',
        background: disabled 
          ? 'rgba(100, 116, 139, 0.1)'
          : isHinted
          ? 'rgba(139, 92, 246, 0.25)'
          : 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(10px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        boxShadow: disabled 
          ? '0 2px 8px rgba(0,0,0,0.2)' 
          : isHinted
          ? '0 8px 32px rgba(139, 92, 246, 0.6)'
          : `0 4px 16px ${typeColor}30`,
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
      onTouchStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.96)';
        }
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.04) translateY(-3px)';
          e.currentTarget.style.boxShadow = isHinted
            ? '0 12px 40px rgba(139, 92, 246, 0.8)'
            : `0 8px 24px ${typeColor}50`;
          e.currentTarget.style.borderWidth = '2.5px';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = disabled 
          ? '0 2px 8px rgba(0,0,0,0.2)' 
          : isHinted
          ? '0 8px 32px rgba(139, 92, 246, 0.6)'
          : `0 4px 16px ${typeColor}30`;
        e.currentTarget.style.borderWidth = '2px';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onDragStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.transform = 'scale(0.95)';
          handleDragStart(e);
        }
      }}
    >
      {isHinted && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '16px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          💡
        </div>
      )}
      <div style={{ 
        fontSize: '32px', 
        marginBottom: '8px', 
        textAlign: 'center',
        lineHeight: '1',
        filter: disabled ? 'grayscale(100%) opacity(0.5)' : 'none',
        transition: 'filter 0.2s'
      }}>
        {getTypeIcon(node.type)}
      </div>
      <div style={{ 
        fontSize: '9px', 
        color: isHinted ? '#a78bfa' : typeColor, 
        marginBottom: '6px', 
        textAlign: 'center',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {node.type}
      </div>
      <div style={{ 
        fontWeight: '600', 
        fontSize: '12px', 
        textAlign: 'center',
        lineHeight: '1.3',
        color: disabled ? '#64748b' : '#fff',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word'
      }}>
        {node.text}
      </div>
    </div>
  );
}
