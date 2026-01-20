import { useState, useEffect } from 'react';
import { buildPuzzleSlice } from '../utils/buildPuzzleSlice';
import BlockChoice from './BlockChoice';

export default function PuzzleBoard({ protocol, difficulty, onBack }) {
  const [puzzle, setPuzzle] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [filledGaps, setFilledGaps] = useState(new Map());
  const [animating, setAnimating] = useState(false);
  const [correctAnimations, setCorrectAnimations] = useState(new Set());
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const startNode = protocol.start || protocol.entry || Object.keys(protocol.nodes)[0];
    const newPuzzle = buildPuzzleSlice(protocol, startNode, difficulty);
    setPuzzle(newPuzzle);
    setFilledGaps(new Map());
    setScore(0);
    setTime(0);
    setCompleted(false);
    setCorrectAnimations(new Set());
    setStreak(0);
  }, [protocol, difficulty]);

  useEffect(() => {
    if (!completed && puzzle) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [completed, puzzle]);

  const handleDrop = (gapIndex, droppedNodeId) => {
    if (filledGaps.has(gapIndex) || animating) return;
    
    const gap = puzzle.puzzlePath[gapIndex];
    if (gap.type !== 'gap') return;
    
    const isCorrect = gap.expectedId === droppedNodeId;
    
    if (isCorrect) {
      setAnimating(true);
      setCorrectAnimations(prev => new Set(prev).add(gapIndex));
      setStreak(prev => prev + 1);
      
      // Animate success with celebration
      setTimeout(() => {
        setFilledGaps(prev => new Map(prev).set(gapIndex, droppedNodeId));
        setScore(prev => prev + 1);
        setAnimating(false);
        
        // Check if all gaps are filled
        const totalGaps = puzzle.puzzlePath.filter(p => p.type === 'gap').length;
        if (filledGaps.size + 1 === totalGaps) {
          setTimeout(() => setCompleted(true), 500);
        }
      }, 500);
    } else {
      setStreak(0);
      // Shake animation
      const gapElement = document.querySelector(`[data-gap-index="${gapIndex}"]`);
      if (gapElement) {
        gapElement.classList.add('shake');
        setTimeout(() => {
          gapElement.classList.remove('shake');
        }, 600);
      }
    }
  };

  const handleChoiceClick = (choice) => {
    if (animating) return;
    
    const gapIndex = puzzle.puzzlePath.findIndex(
      (p, idx) => p.type === 'gap' && !filledGaps.has(idx)
    );
    
    if (gapIndex !== -1) {
      handleDrop(gapIndex, choice.nodeId);
    }
  };

  const resetPuzzle = () => {
    setAnimating(false);
    const startNode = protocol.start || protocol.entry || Object.keys(protocol.nodes)[0];
    const newPuzzle = buildPuzzleSlice(protocol, startNode, difficulty);
    setPuzzle(newPuzzle);
    setFilledGaps(new Map());
    setScore(0);
    setTime(0);
    setCompleted(false);
    setCorrectAnimations(new Set());
    setStreak(0);
  };

  if (!puzzle) {
    return (
      <div style={{ 
        color: 'white', 
        textAlign: 'center',
        padding: '60px 20px',
        fontSize: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" style={{
          width: '60px',
          height: '60px',
          border: '5px solid rgba(255,255,255,0.3)',
          borderTop: '5px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <div style={{ fontWeight: '700' }}>Loading puzzle...</div>
      </div>
    );
  }

  const availableChoices = puzzle.choices.filter(
    choice => !Array.from(filledGaps.values()).includes(choice.nodeId) || 
              choice.isCorrect
  );

  const progress = puzzle.removed.length > 0 ? (score / puzzle.removed.length) * 100 : 0;

  return (
    <div style={{ 
      padding: '0', 
      maxWidth: '100%', 
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '100vh',
      animation: 'fadeIn 0.5s ease-in',
      position: 'relative'
    }}>
      {/* Mobile Game Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        padding: '16px 12px', 
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        marginBottom: '16px'
      }}>
        {/* Back Button & Protocol ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button 
            onClick={onBack}
            style={{ 
              padding: '10px 16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
              transition: 'all 0.3s',
              touchAction: 'manipulation'
            }}
            onTouchStart={(e) => e.target.style.transform = 'scale(0.95)'}
            onTouchEnd={(e) => e.target.style.transform = 'scale(1)'}
          >
            ← Back
          </button>
          {(puzzle.protocolId || protocol.protocolId) && (
            <div style={{
              fontSize: '16px',
              color: '#fff',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
              padding: '8px 16px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
              letterSpacing: '1px'
            }}>
              {puzzle.protocolId || protocol.protocolId}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 style={{ 
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: '900',
          color: '#333',
          marginBottom: '12px',
          lineHeight: '1.2'
        }}>
          {puzzle.title}
        </h2>

        {/* Stats Bar - Game Style */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          <div style={{ 
            flex: 1,
            minWidth: '100px',
            padding: '10px 12px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #ee5a6f 100%)',
            borderRadius: '14px',
            color: 'white',
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>✓</span>
            <span>{score}/{puzzle.removed.length}</span>
          </div>
          <div style={{ 
            flex: 1,
            minWidth: '100px',
            padding: '10px 12px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)',
            borderRadius: '14px',
            color: 'white',
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(78,205,196,0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <span>{time}s</span>
          </div>
          {streak > 0 && (
            <div style={{ 
              padding: '10px 12px',
              background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)',
              borderRadius: '14px',
              color: 'white',
              fontWeight: '800',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(255,217,61,0.4)',
              animation: streak > 2 ? 'pulse 1s ease-in-out infinite' : 'none'
            }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <span>{streak}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4ECDC4 0%, #45B7D1 100%)',
            borderRadius: '10px',
            transition: 'width 0.5s ease',
            boxShadow: '0 2px 8px rgba(78,205,196,0.5)'
          }}></div>
        </div>

        {/* Reset Button */}
        <button 
          onClick={resetPuzzle}
          disabled={animating}
          style={{
            width: '100%',
            padding: '12px',
            background: animating 
              ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
              : 'linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: animating ? 'not-allowed' : 'pointer',
            fontWeight: '800',
            fontSize: '15px',
            transition: 'all 0.3s',
            opacity: animating ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(69,183,209,0.4)',
            touchAction: 'manipulation'
          }}
          onTouchStart={(e) => {
            if (!animating) e.target.style.transform = 'scale(0.98)';
          }}
          onTouchEnd={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          🔄 New Puzzle
        </button>
      </div>

      {/* Puzzle Flow - Vertical Mobile Layout */}
      <div style={{ 
        marginBottom: '20px',
        padding: '16px 12px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        marginLeft: '12px',
        marginRight: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center'
        }}>
          {puzzle.puzzlePath.map((item, idx) => {
            if (item.type === 'gap') {
              const filledNodeId = filledGaps.get(idx);
              const filledNode = filledNodeId ? protocol.nodes[filledNodeId] : null;
              const isCorrectAnimation = correctAnimations.has(idx);
              
              return (
                <div key={idx} style={{ width: '100%', maxWidth: '100%' }}>
                  <div
                    data-gap-index={idx}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedId = e.dataTransfer.getData('nodeId');
                      if (droppedId) handleDrop(idx, droppedId);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => {
                      // Auto-fill with first available choice if clicked
                      if (!filledNode && availableChoices.length > 0) {
                        handleChoiceClick(availableChoices[0]);
                      }
                    }}
                    className={isCorrectAnimation ? 'correct-fill' : ''}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      border: filledNode 
                        ? '4px solid #4CAF50' 
                        : '4px dashed #FF6B6B',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: filledNode 
                        ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                        : 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      padding: '16px',
                      boxShadow: filledNode 
                        ? '0 8px 24px rgba(76,175,80,0.4)' 
                        : '0 4px 16px rgba(255,107,107,0.2)',
                      transform: filledNode ? 'scale(1.02)' : 'scale(1)',
                      position: 'relative',
                      overflow: 'hidden',
                      touchAction: 'manipulation'
                    }}
                    onTouchStart={(e) => {
                      if (!filledNode) {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = filledNode ? 'scale(1.02)' : 'scale(1)';
                    }}
                  >
                    {filledNode ? (
                      <div style={{ 
                        textAlign: 'center', 
                        width: '100%',
                        animation: 'slideIn 0.4s ease-out'
                      }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#4CAF50', 
                          marginBottom: '6px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          {filledNode.type}
                        </div>
                        <div style={{ 
                          fontWeight: '700', 
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: '#333'
                        }}>
                          {filledNode.text}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#FF6B6B', textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '40px', 
                          marginBottom: '8px',
                          animation: 'pulse 2s ease-in-out infinite',
                          filter: 'drop-shadow(0 2px 4px rgba(255,107,107,0.3))'
                        }}>
                          ❓
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF6B6B' }}>
                          Tap to Fill
                        </div>
                      </div>
                    )}
                  </div>
                  {idx < puzzle.puzzlePath.length - 1 && (
                    <div style={{ 
                      textAlign: 'center',
                      margin: '8px 0',
                      fontSize: '32px',
                      color: '#4ECDC4',
                      fontWeight: 'bold',
                      animation: 'arrowPulse 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 2px 4px rgba(78,205,196,0.3))'
                    }}>
                      ↓
                    </div>
                  )}
                </div>
              );
            } else {
              const isDecision = item.isDecision;
              
              return (
                <div key={idx} style={{ width: '100%', maxWidth: '100%' }}>
                  <div
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      border: isDecision 
                        ? '4px solid #FF9800' 
                        : '4px solid #4ECDC4',
                      borderRadius: '20px',
                      padding: '16px',
                      background: isDecision 
                        ? 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
                        : 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    {isDecision && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        fontSize: '24px',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}>
                        ❓
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '11px', 
                      color: isDecision ? '#FF9800' : '#4ECDC4', 
                      marginBottom: '6px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {item.node.type}
                    </div>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: '#333'
                    }}>
                      {item.node.text}
                    </div>
                  </div>
                  {idx < puzzle.puzzlePath.length - 1 && (
                    <div style={{ 
                      textAlign: 'center',
                      margin: '8px 0',
                      fontSize: '32px',
                      color: '#4ECDC4',
                      fontWeight: 'bold',
                      animation: 'arrowPulse 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 2px 4px rgba(78,205,196,0.3))'
                    }}>
                      ↓
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Available Blocks - Mobile Game Style */}
      <div style={{ 
        background: 'rgba(255,255,255,0.95)',
        padding: '20px 12px', 
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        marginLeft: '12px',
        marginRight: '12px',
        marginBottom: '0'
      }}>
        <h3 style={{ 
          marginBottom: '16px',
          fontSize: '20px',
          fontWeight: '900',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '28px' }}>📦</span>
          <span>Available Blocks</span>
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
          justifyContent: 'center'
        }}>
          {availableChoices.map((choice, idx) => (
            <BlockChoice
              key={`${choice.nodeId}-${idx}`}
              choice={choice}
              onClick={() => handleChoiceClick(choice)}
              disabled={animating}
            />
          ))}
        </div>
      </div>

      {/* Completion Modal - Mobile Game Style */}
      {completed && (
        <div 
          className="completion-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in',
            padding: '20px'
          }}
          onClick={resetPuzzle}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%)',
              color: 'white',
              borderRadius: '32px',
              padding: 'clamp(32px, 8vw, 48px)',
              textAlign: 'center',
              maxWidth: 'min(90vw, 400px)',
              width: '100%',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: 'clamp(64px, 15vw, 96px)', 
              marginBottom: '20px', 
              animation: 'bounce 0.8s ease',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}>
              🎉
            </div>
            <h2 style={{ 
              fontSize: 'clamp(28px, 7vw, 36px)', 
              marginBottom: '20px', 
              fontWeight: '900',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              Puzzle Complete!
            </h2>
            <div style={{ 
              fontSize: 'clamp(18px, 4vw, 22px)', 
              marginBottom: '12px',
              background: 'rgba(255,255,255,0.25)',
              padding: '14px 20px',
              borderRadius: '16px',
              margin: '10px 0',
              fontWeight: '800'
            }}>
              Score: <strong>{score}/{puzzle.removed.length}</strong>
            </div>
            <div style={{ 
              fontSize: 'clamp(18px, 4vw, 22px)', 
              marginBottom: '24px',
              background: 'rgba(255,255,255,0.25)',
              padding: '14px 20px',
              borderRadius: '16px',
              margin: '10px 0',
              fontWeight: '800'
            }}>
              ⏱️ Time: <strong>{time}s</strong>
            </div>
            <button 
              onClick={resetPuzzle}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: 'clamp(16px, 4vw, 20px)',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.95)',
                color: '#FF6B6B',
                border: 'none',
                borderRadius: '20px',
                fontWeight: '900',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                touchAction: 'manipulation'
              }}
              onTouchStart={(e) => e.target.style.transform = 'scale(0.95)'}
              onTouchEnd={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-12px); }
          20%, 40%, 60%, 80% { transform: translateX(12px); }
        }
        .shake {
          animation: shake 0.6s;
          border-color: #FF6B6B !important;
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes arrowPulse {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(5px); }
        }
        
        .correct-fill {
          animation: correctFill 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
