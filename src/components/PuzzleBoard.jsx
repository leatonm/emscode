import { useState, useEffect, useRef } from 'react';
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
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [history, setHistory] = useState([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

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
    setShowHint(false);
    setHintIndex(null);
    setHistory([]);
    setWrongAttempts(0);
    setShowConfetti(false);
  }, [protocol, difficulty]);

  useEffect(() => {
    if (!completed && puzzle) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [completed, puzzle]);

  useEffect(() => {
    if (completed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [completed]);

  const handleDrop = (gapIndex, droppedNodeId) => {
    if (filledGaps.has(gapIndex) || animating) return;
    
    const gap = puzzle.puzzlePath[gapIndex];
    if (gap.type !== 'gap') return;
    
    const isCorrect = gap.expectedId === droppedNodeId;
    
    if (isCorrect) {
      setAnimating(true);
      setCorrectAnimations(prev => new Set(prev).add(gapIndex));
      setStreak(prev => prev + 1);
      
      // Save to history for undo
      setHistory(prev => [...prev, { gapIndex, nodeId: droppedNodeId, action: 'fill' }]);
      
      setTimeout(() => {
        setFilledGaps(prev => new Map(prev).set(gapIndex, droppedNodeId));
        setScore(prev => prev + 1);
        setAnimating(false);
        setShowHint(false);
        setHintIndex(null);
        
        const totalGaps = puzzle.puzzlePath.filter(p => p.type === 'gap').length;
        if (filledGaps.size + 1 === totalGaps) {
          setTimeout(() => setCompleted(true), 500);
        }
      }, 500);
    } else {
      setStreak(0);
      setWrongAttempts(prev => prev + 1);
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

  const handleUndo = () => {
    if (history.length === 0 || animating) return;
    
    const lastAction = history[history.length - 1];
    if (lastAction.action === 'fill') {
      setFilledGaps(prev => {
        const newMap = new Map(prev);
        newMap.delete(lastAction.gapIndex);
        return newMap;
      });
      setScore(prev => Math.max(0, prev - 1));
      setHistory(prev => prev.slice(0, -1));
      setCorrectAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(lastAction.gapIndex);
        return newSet;
      });
    }
  };

  const handleHint = () => {
    const firstEmptyGap = puzzle.puzzlePath.findIndex(
      (p, idx) => p.type === 'gap' && !filledGaps.has(idx)
    );
    
    if (firstEmptyGap !== -1) {
      setHintIndex(firstEmptyGap);
      setShowHint(true);
      
      // Highlight the correct answer
      const gap = puzzle.puzzlePath[firstEmptyGap];
      const correctChoice = puzzle.choices.find(c => c.nodeId === gap.expectedId);
      if (correctChoice) {
        const choiceElement = document.querySelector(`[data-choice-id="${correctChoice.nodeId}"]`);
        if (choiceElement) {
          choiceElement.classList.add('hint-highlight');
          setTimeout(() => {
            choiceElement.classList.remove('hint-highlight');
            setShowHint(false);
            setHintIndex(null);
          }, 3000);
        }
      }
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
    setShowHint(false);
    setHintIndex(null);
    setHistory([]);
    setWrongAttempts(0);
    setShowConfetti(false);
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
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>Loading puzzle...</div>
      </div>
    );
  }

  const availableChoices = puzzle.choices.filter(
    choice => !Array.from(filledGaps.values()).includes(choice.nodeId) || 
              choice.isCorrect
  );

  const progress = puzzle.removed.length > 0 ? (score / puzzle.removed.length) * 100 : 0;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const accuracy = score + wrongAttempts > 0 
    ? Math.round((score / (score + wrongAttempts)) * 100) 
    : 100;

  const canUndo = history.length > 0 && !animating;
  const canHint = availableChoices.length > 0 && !showHint && !animating;

  return (
    <div style={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease-in',
      background: 'transparent',
      position: 'relative'
    }}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div ref={confettiRef} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 2000
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                background: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][i % 6],
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              How to Play
            </h2>
            <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <div>
                  <strong style={{ color: '#fff' }}>Goal:</strong> Fill in the missing protocol steps by selecting the correct blocks.
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>👆</span>
                <div>
                  <strong style={{ color: '#fff' }}>Tap blocks</strong> to fill the empty gaps in order.
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                <div>
                  <strong style={{ color: '#fff' }}>Use hints</strong> if you're stuck - they'll highlight the correct answer.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>↩️</span>
                <div>
                  <strong style={{ color: '#fff' }}>Undo</strong> your last move if you make a mistake.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontWeight: '700',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
              }}
            >
              Got it! Let's Play
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 100,
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={onBack}
            style={{ 
              padding: '8px 16px', 
              cursor: 'pointer',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.3)';
              e.target.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            ← Back
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
            {(puzzle.protocolId || protocol.protocolId) && (
              <span style={{
                fontSize: '11px',
                color: '#fff',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                padding: '4px 10px',
                borderRadius: '8px',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
              }}>
                {puzzle.protocolId || protocol.protocolId}
              </span>
            )}
            <div style={{ 
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px'
            }}>
              {puzzle.title}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ 
              padding: '6px 12px',
              background: 'rgba(34, 197, 94, 0.2)',
              borderRadius: '10px',
              color: '#4ade80',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <span>✓</span>
              <span>{score}/{puzzle.removed.length}</span>
            </div>
            <div style={{ 
              padding: '6px 12px',
              background: 'rgba(251, 191, 36, 0.2)',
              borderRadius: '10px',
              color: '#fbbf24',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <span>⏱</span>
              <span>{formatTime(time)}</span>
            </div>
            {streak > 0 && (
              <div style={{ 
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#f87171',
                fontWeight: '700',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                animation: streak > 2 ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}>
                <span>🔥</span>
                <span>{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleHint}
            disabled={!canHint}
            style={{
              padding: '6px 14px',
              background: canHint ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)',
              color: canHint ? '#a78bfa' : '#64748b',
              border: `1px solid ${canHint ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '12px',
              cursor: canHint ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: canHint ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (canHint) {
                e.target.style.background = 'rgba(139, 92, 246, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = canHint ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            title="Get a hint for the next gap"
          >
            💡 Hint
          </button>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              padding: '6px 14px',
              background: canUndo ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)',
              color: canUndo ? '#cbd5e1' : '#64748b',
              border: `1px solid ${canUndo ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '12px',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: canUndo ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (canUndo) {
                e.target.style.background = 'rgba(100, 116, 139, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = canUndo ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            title="Undo your last move"
          >
            ↩️ Undo
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              padding: '6px 14px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.3)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
            title="Show tutorial"
          >
            ❓ Help
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '20px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
            animation: 'shimmer 2s infinite'
          }}></div>
        </div>
      </div>

      {/* Main Content - Vertical Stack for Mobile */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        gap: '12px',
        padding: '12px',
        background: 'transparent'
      }}>
        {/* Puzzle Flow Section */}
        <div style={{
          flex: '1 1 60%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              fontSize: '13px',
              fontWeight: '700',
              color: '#94a3b8',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{ fontSize: '18px' }}>🧩</span>
              <span>Protocol Flow</span>
              {hintIndex !== null && (
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(139, 92, 246, 0.3)',
                  color: '#a78bfa',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  marginLeft: '8px',
                  animation: 'pulse 1s infinite'
                }}>
                  💡 Hint Active
                </span>
              )}
            </div>
            
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
              paddingRight: '8px',
              paddingBottom: '8px',
              position: 'relative',
              zIndex: 1,
              minHeight: 0
            }}>
              {puzzle.puzzlePath.map((item, idx) => {
                if (item.type === 'gap') {
                  const filledNodeId = filledGaps.get(idx);
                  const filledNode = filledNodeId ? protocol.nodes[filledNodeId] : null;
                  const isCorrectAnimation = correctAnimations.has(idx);
                  const isHinted = hintIndex === idx;
                  
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
                        className={isCorrectAnimation ? 'correct-fill' : isHinted ? 'hint-gap' : ''}
                        style={{
                          width: '100%',
                          minHeight: '90px',
                          border: filledNode 
                            ? '2px solid #22c55e' 
                            : isHinted
                            ? '2px dashed #a78bfa'
                            : '2px dashed #64748b',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: filledNode 
                            ? 'rgba(34, 197, 94, 0.15)'
                            : isHinted
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(100, 116, 139, 0.1)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          padding: '16px',
                          boxShadow: filledNode 
                            ? '0 4px 20px rgba(34, 197, 94, 0.2)' 
                            : isHinted
                            ? '0 4px 20px rgba(139, 92, 246, 0.3)'
                            : '0 2px 10px rgba(0,0,0,0.1)',
                          position: 'relative',
                          touchAction: 'manipulation',
                          backdropFilter: 'blur(10px)',
                          animation: isHinted ? 'glow 2s ease-in-out infinite' : 'none'
                        }}
                      >
                        {filledNode ? (
                          <div style={{ 
                            textAlign: 'center', 
                            width: '100%',
                            animation: 'scaleIn 0.3s ease-out'
                          }}>
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#22c55e', 
                              marginBottom: '8px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {filledNode.type}
                            </div>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '15px',
                              lineHeight: '1.4',
                              color: '#fff'
                            }}>
                              {filledNode.text}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#94a3b8', textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '32px', 
                              marginBottom: '8px',
                              opacity: isHinted ? 1 : 0.6,
                              animation: isHinted ? 'pulse 1.5s ease-in-out infinite' : 'none'
                            }}>
                              {isHinted ? '💡' : '❓'}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: isHinted ? '#a78bfa' : '#94a3b8' }}>
                              {isHinted ? 'Hint: Check highlighted block' : 'Tap to fill'}
                            </div>
                          </div>
                        )}
                      </div>
                      {idx < puzzle.puzzlePath.length - 1 && (
                        <div style={{ 
                          textAlign: 'center',
                          margin: '4px 0',
                          fontSize: '16px',
                          color: '#64748b',
                          fontWeight: 'bold',
                          opacity: 0.5,
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
                          minHeight: '90px',
                          border: isDecision 
                            ? '2px solid #f59e0b' 
                            : '2px solid #3b82f6',
                          borderRadius: '16px',
                          padding: '16px',
                          background: isDecision 
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <div style={{ 
                          fontSize: '10px', 
                          color: isDecision ? '#f59e0b' : '#60a5fa', 
                          marginBottom: '8px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.node.type}
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '15px',
                          lineHeight: '1.4',
                          color: '#fff'
                        }}>
                          {item.node.text}
                        </div>
                      </div>
                      {idx < puzzle.puzzlePath.length - 1 && (
                        <div style={{ 
                          textAlign: 'center',
                          margin: '6px 0',
                          fontSize: '18px',
                          color: '#64748b',
                          fontWeight: 'bold',
                          opacity: 0.5,
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

        {/* Answer Blocks Section */}
        <div style={{
          flex: '0 0 auto',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ 
                fontSize: '13px',
                fontWeight: '700',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span style={{ fontSize: '18px' }}>📦</span>
                <span>Answer Blocks</span>
                {availableChoices.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    background: 'rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    border: '1px solid rgba(59, 130, 246, 0.4)'
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
                    ? 'rgba(100, 116, 139, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
                  color: animating ? '#64748b' : '#60a5fa',
                  border: `1px solid ${animating ? 'rgba(100, 116, 139, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: '10px',
                  cursor: animating ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '11px',
                  transition: 'all 0.2s',
                  opacity: animating ? 0.5 : 1,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!animating) {
                    e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = animating 
                    ? 'rgba(100, 116, 139, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                🔄 Reset
              </button>
            </div>
            
            <div style={{ 
              flex: 1,
              display: 'flex', 
              gap: '10px',
              overflowX: 'auto',
              overflowY: 'hidden',
              alignContent: 'start',
              paddingBottom: '8px',
              position: 'relative',
              zIndex: 1,
              minHeight: 0,
              scrollbarWidth: 'thin'
            }}>
              {availableChoices.length > 0 ? (
                availableChoices.map((choice, idx) => (
                  <div key={`${choice.nodeId}-${idx}`} style={{ flexShrink: 0, width: '140px' }}>
                    <BlockChoice
                      choice={choice}
                      onClick={() => handleChoiceClick(choice)}
                      disabled={animating}
                      isHinted={hintIndex !== null && puzzle.puzzlePath[hintIndex]?.expectedId === choice.nodeId}
                    />
                  </div>
                ))
              ) : (
                <div style={{
                  width: '100%',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '20px',
                  background: 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(100, 116, 139, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <div>All blocks used!</div>
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
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
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
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(20px)',
              color: 'white',
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '20px', 
              animation: 'bounce 0.6s ease'
            }}>
              🎉
            </div>
            <h2 style={{ 
              fontSize: '28px', 
              marginBottom: '20px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Puzzle Complete!
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                fontSize: '14px',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Score</div>
                <div style={{ fontWeight: '700', color: '#4ade80', fontSize: '18px' }}>
                  {score}/{puzzle.removed.length}
                </div>
              </div>
              <div style={{ 
                fontSize: '14px',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Time</div>
                <div style={{ fontWeight: '700', color: '#fbbf24', fontSize: '18px' }}>
                  {formatTime(time)}
                </div>
              </div>
              <div style={{ 
                fontSize: '14px',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Accuracy</div>
                <div style={{ fontWeight: '700', color: '#60a5fa', fontSize: '18px' }}>
                  {accuracy}%
                </div>
              </div>
              <div style={{ 
                fontSize: '14px',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Best Streak</div>
                <div style={{ fontWeight: '700', color: '#f87171', fontSize: '18px' }}>
                  {streak > 0 ? streak : '-'}
                </div>
              </div>
            </div>

            <button 
              onClick={resetPuzzle}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontWeight: '700',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
              }}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .shake {
          animation: shake 0.5s;
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.2) !important;
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .correct-fill {
          animation: correctFill 0.5s ease-out;
        }
        
        @keyframes correctFill {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(34, 197, 94, 0.5); }
          100% { transform: scale(1); }
        }

        .hint-gap {
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6); }
        }

        .hint-highlight {
          animation: hintPulse 1.5s ease-in-out infinite;
          border-color: #a78bfa !important;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6) !important;
        }

        @keyframes hintPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  );
}
