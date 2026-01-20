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
      'action': '#4ECDC4',
      'decision': '#FF9800',
      'optional': '#9C27B0',
      'terminal': '#FF6B6B',
      'loop': '#45B7D1',
      'event': '#FFD93D',
      'jump': '#795548',
      'end': '#FF6B6B',
      'information': '#607D8B',
      'reference': '#45B7D1'
    };
    return colors[type] || '#4ECDC4';
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
        minHeight: '140px',
        padding: '14px',
        border: `3px solid ${typeColor}`,
        borderRadius: '20px',
        background: disabled 
          ? 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'
          : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        boxShadow: disabled 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : `0 6px 16px ${typeColor}40`,
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation'
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
          e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 12px 24px ${typeColor}60`;
          e.currentTarget.style.borderWidth = '4px';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = disabled 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : `0 6px 16px ${typeColor}40`;
        e.currentTarget.style.borderWidth = '3px';
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
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        transition: 'left 0.6s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.left = '100%';
        }
      }}
      />
      
      <div style={{ 
        fontSize: '32px', 
        marginBottom: '8px', 
        textAlign: 'center',
        lineHeight: '1',
        filter: disabled ? 'grayscale(100%)' : 'none'
      }}>
        {getTypeIcon(node.type)}
      </div>
      <div style={{ 
        fontSize: '10px', 
        color: typeColor, 
        marginBottom: '6px', 
        textAlign: 'center',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {node.type}
      </div>
      <div style={{ 
        fontWeight: '700', 
        fontSize: '12px', 
        textAlign: 'center',
        lineHeight: '1.4',
        color: disabled ? '#999' : '#333'
      }}>
        {node.text}
      </div>
    </div>
  );
}
