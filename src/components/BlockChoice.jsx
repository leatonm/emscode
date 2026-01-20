export default function BlockChoice({ choice, onClick, disabled = false }) {
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
      'action': '#0ea5e9',
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
    return colors[type] || '#0ea5e9';
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
      draggable={!disabled}
      onDragStart={handleDragStart}
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%',
        height: '110px',
        padding: '10px',
        border: `3px solid ${typeColor}`,
        borderRadius: '12px',
        background: disabled 
          ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
          : `linear-gradient(135deg, #ffffff 0%, ${typeColor}12 100%)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        boxShadow: disabled 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : `0 4px 12px ${typeColor}30`,
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onTouchStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 6px 16px ${typeColor}40`;
          e.currentTarget.style.borderWidth = '3px';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = disabled 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : `0 2px 8px ${typeColor}20`;
        e.currentTarget.style.borderWidth = '2px';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onDragStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.transform = 'scale(0.9)';
          handleDragStart(e);
        }
      }}
    >
      {/* Shine effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        transition: 'left 0.5s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.left = '100%';
        }
      }}
      />
      
      <div style={{ 
        fontSize: '28px', 
        marginBottom: '6px', 
        textAlign: 'center',
        lineHeight: '1',
        filter: disabled ? 'grayscale(100%)' : 'none'
      }}>
        {getTypeIcon(node.type)}
      </div>
      <div style={{ 
        fontSize: '8px', 
        color: typeColor, 
        marginBottom: '4px', 
        textAlign: 'center',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {node.type}
      </div>
      <div style={{ 
        fontWeight: '700', 
        fontSize: '11px', 
        textAlign: 'center',
        lineHeight: '1.3',
        color: disabled ? '#94a3b8' : '#1e293b',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {node.text}
      </div>
    </div>
  );
}
