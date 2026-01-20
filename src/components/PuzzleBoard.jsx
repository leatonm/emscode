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
      
      setTimeout(() => {
        setFilledGaps(prev => new Map(prev).set(gapIndex, droppedNodeId));
        setScore(prev => prev + 1);
        setAnimating(false);
        
        const totalGaps = puzzle.puzzlePath.filter(p => p.type === 'gap').length;
        if (filledGaps.size + 1 === totalGaps) {
          setTimeout(() => setCompleted(true), 500);
        }
      }, 500);
    } else {
      setStreak(0);
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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeIn 0.5s ease-in',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)'
    }}>
      {/* Top Bar - Fixed Height */}
      <div style={{ 
        background: 'rgba(255,255,255,0.98)',
        padding: '8px 12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 100,
        flexShrink: 0,
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <button 
          onClick={onBack}
          style={{ 
            padding: '6px 12px', 
            cursor: 'pointer',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '12px',
            transition: 'all 0.2s',
            touchAction: 'manipulation',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.target.style.background = '#0284c7'}
          onMouseLeave={(e) => e.target.style.background = '#0ea5e9'}
        >
          ← Back
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
          {(puzzle.protocolId || protocol.protocolId) && (
            <span style={{
              fontSize: '10px',
              color: '#0ea5e9',
              fontWeight: '800',
              background: '#e0f2fe',
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap'
            }}>
              {puzzle.protocolId || protocol.protocolId}
            </span>
          )}
          <div style={{ 
            fontSize: '13px',
            fontWeight: '800',
            color: '#1e293b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '250px'
          }}>
            {puzzle.title}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ 
            padding: '4px 10px',
            background: '#10b981',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '800',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}>
            <span>✓</span>
            <span>{score}/{puzzle.removed.length}</span>
          </div>
          <div style={{ 
            padding: '4px 10px',
            background: '#f59e0b',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '800',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}>
            <span>⏱️</span>
            <span>{time}s</span>
          </div>
          {streak > 0 && (
            <div style={{ 
              padding: '4px 10px',
              background: '#ef4444',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '800',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              animation: streak > 2 ? 'pulse 1s ease-in-out infinite' : 'none'
            }}>
              <span>🔥</span>
              <span>{streak}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar - Fixed Height */}
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)',
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(16,185,129,0.6)'
        }}></div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 0,
        gap: '8px',
        padding: '8px'
      }}>
        {/* Puzzle Flow - Left Side */}
        <div style={{
          flex: '1 1 60%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid #e0f2fe',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            {/* Subtle background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(14,165,233,0.02) 0%, rgba(6,182,212,0.02) 100%)',
              pointerEvents: 'none',
              borderRadius: '14px'
            }}></div>
            
            <div style={{ 
              fontSize: '14px',
              fontWeight: '900',
              color: '#0ea5e9',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{ fontSize: '20px' }}>🧩</span>
              <span>Protocol Flow</span>
            </div>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex', 
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px',
              paddingBottom: '8px',
              position: 'relative',
              zIndex: 1,
              minHeight: 0,
              justifyContent: 'flex-start'
            }}>
              {puzzle.puzzlePath.map((item, idx) => {
                if (item.type === 'gap') {
                  const filledNodeId = filledGaps.get(idx);
                  const filledNode = filledNodeId ? protocol.nodes[filledNodeId] : null;
                  const isCorrectAnimation = correctAnimations.has(idx);
                  
                  return (
                    <div key={idx} style={{ width: '100%', flexShrink: 0 }}>
                      <div
                        data-gap-index={idx}
                        onDrop={(e) => {
                          e.preventDefault();
                          const droppedId = e.dataTransfer.getData('nodeId');
                          if (droppedId) handleDrop(idx, droppedId);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => {
                          if (!filledNode && availableChoices.length > 0) {
                            handleChoiceClick(availableChoices[0]);
                          }
                        }}
                        className={isCorrectAnimation ? 'correct-fill' : ''}
                      style={{
                        width: '100%',
                        minHeight: '75px',
                        border: filledNode 
                          ? '3px solid #10b981' 
                          : '3px dashed #ef4444',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: filledNode 
                          ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                          : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        padding: '12px',
                        boxShadow: filledNode 
                          ? '0 4px 16px rgba(16,185,129,0.25)' 
                          : '0 3px 12px rgba(239,68,68,0.15)',
                        position: 'relative',
                        touchAction: 'manipulation'
                      }}
                      >
                        {filledNode ? (
                          <div style={{ 
                            textAlign: 'center', 
                            width: '100%',
                            animation: 'slideIn 0.3s ease-out'
                          }}>
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#10b981', 
                              marginBottom: '6px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {filledNode.type}
                            </div>
                            <div style={{ 
                              fontWeight: '700', 
                              fontSize: '14px',
                              lineHeight: '1.4',
                              color: '#1e293b'
                            }}>
                              {filledNode.text}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#ef4444', textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '36px', 
                              marginBottom: '6px',
                              animation: 'pulse 2s ease-in-out infinite'
                            }}>
                              ❓
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
                              Drop Answer Here
                            </div>
                          </div>
                        )}
                      </div>
                      {idx < puzzle.puzzlePath.length - 1 && (
                        <div style={{ 
                          textAlign: 'center',
                          margin: '2px 0',
                          fontSize: '14px',
                          color: '#0ea5e9',
                          fontWeight: 'bold',
                          animation: 'arrowPulse 2s ease-in-out infinite',
                          opacity: 0.6,
                          flexShrink: 0,
                          lineHeight: '1'
                        }}>
                          ↓
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const isDecision = item.isDecision;
                  
                  return (
                    <div key={idx} style={{ width: '100%', flexShrink: 0 }}>
                      <div
                        style={{
                          width: '100%',
                          minHeight: '75px',
                          border: isDecision 
                            ? '3px solid #f59e0b' 
                            : '3px solid #0ea5e9',
                          borderRadius: '12px',
                          padding: '12px',
                          background: isDecision 
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ 
                          fontSize: '10px', 
                          color: isDecision ? '#f59e0b' : '#0ea5e9', 
                          marginBottom: '6px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.node.type}
                        </div>
                        <div style={{ 
                          fontWeight: '700', 
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: '#1e293b'
                        }}>
                          {item.node.text}
                        </div>
                      </div>
                      {idx < puzzle.puzzlePath.length - 1 && (
                        <div style={{ 
                          textAlign: 'center',
                          margin: '6px 0',
                          fontSize: '20px',
                          color: '#0ea5e9',
                          fontWeight: 'bold',
                          animation: 'arrowPulse 2s ease-in-out infinite',
                          opacity: 0.7,
                          flexShrink: 0,
                          lineHeight: '1'
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
        </div>

        {/* Answer Blocks - Right Side */}
        <div style={{
          flex: '1 1 40%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid #e0f2fe',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            {/* Subtle background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(14,165,233,0.03) 0%, rgba(6,182,212,0.03) 100%)',
              pointerEvents: 'none',
              borderRadius: '14px'
            }}></div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ 
                fontSize: '14px',
                fontWeight: '900',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <span>Answer Blocks</span>
                {availableChoices.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    boxShadow: '0 2px 6px rgba(14,165,233,0.3)'
                  }}>
                    {availableChoices.length}
                  </span>
                )}
              </div>
              <button 
                onClick={resetPuzzle}
                disabled={animating}
                style={{
                  padding: '6px 12px',
                  background: animating 
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: animating ? 'not-allowed' : 'pointer',
                  fontWeight: '800',
                  fontSize: '11px',
                  transition: 'all 0.2s',
                  opacity: animating ? 0.7 : 1,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                  boxShadow: animating ? 'none' : '0 2px 6px rgba(14,165,233,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!animating) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 10px rgba(14,165,233,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = animating ? 'none' : '0 2px 6px rgba(14,165,233,0.3)';
                }}
              >
                🔄 Reset
              </button>
            </div>
            
            <div style={{ 
              flex: 1,
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '10px',
              overflowY: 'auto',
              overflowX: 'hidden',
              alignContent: 'start',
              paddingRight: '4px',
              paddingBottom: '8px',
              position: 'relative',
              zIndex: 1,
              minHeight: 0
            }}>
              {availableChoices.length > 0 ? (
                availableChoices.map((choice, idx) => (
                  <BlockChoice
                    key={`${choice.nodeId}-${idx}`}
                    choice={choice}
                    onClick={() => handleChoiceClick(choice)}
                    disabled={animating}
                  />
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '24px',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1',
                  marginTop: '8px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <div>All blocks used!</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Great job completing the puzzle!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
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
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
              color: 'white',
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '16px', 
              animation: 'bounce 0.8s ease'
            }}>
              🎉
            </div>
            <h2 style={{ 
              fontSize: '28px', 
              marginBottom: '16px', 
              fontWeight: '900',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              Puzzle Complete!
            </h2>
            <div style={{ 
              fontSize: '18px', 
              marginBottom: '8px',
              background: 'rgba(255,255,255,0.25)',
              padding: '12px 16px',
              borderRadius: '12px',
              margin: '8px 0',
              fontWeight: '800'
            }}>
              Score: <strong>{score}/{puzzle.removed.length}</strong>
            </div>
            <div style={{ 
              fontSize: '18px', 
              marginBottom: '20px',
              background: 'rgba(255,255,255,0.25)',
              padding: '12px 16px',
              borderRadius: '12px',
              margin: '8px 0',
              fontWeight: '800'
            }}>
              ⏱️ Time: <strong>{time}s</strong>
            </div>
            <button 
              onClick={resetPuzzle}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.95)',
                color: '#0ea5e9',
                border: 'none',
                borderRadius: '16px',
                fontWeight: '900',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .shake {
          animation: shake 0.6s;
          border-color: #ef4444 !important;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
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
          50% { opacity: 1; transform: translateY(3px); }
        }
        
        .correct-fill {
          animation: correctFill 0.5s ease-out;
        }
        
        @keyframes correctFill {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(16,185,129,0.6); }
          100% { transform: scale(1); }
        }
        
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #e0f2fe;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: #0ea5e9;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #0284c7;
        }
        
        @media (max-width: 768px) {
          .game-area {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
