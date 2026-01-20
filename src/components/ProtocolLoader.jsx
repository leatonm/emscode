import { useState, useEffect } from 'react';
import { fetchProtocol } from '../utils/fetchProtocol';
import PuzzleBoard from './PuzzleBoard';

const PROTOCOL_URLS = {
  'Adult Asystole': 'https://raw.githubusercontent.com/leatonm/emscode_data/refs/heads/main/Adult%20Asystole.json',
  'Bradycardia Pulse Present': 'https://raw.githubusercontent.com/leatonm/emscode_data/refs/heads/main/Bradycardia%20Pulse%20Present.json',
  'Cardiac Arrest Adult': 'https://raw.githubusercontent.com/leatonm/emscode_data/refs/heads/main/Cardiac%20Arrest%20Adult.json',
  'Chest Pain Cardiac and STEMI': 'https://raw.githubusercontent.com/leatonm/emscode_data/refs/heads/main/Chest%20Pain%20Cardiac%20and%20STEMI.json'
};

export default function ProtocolLoader() {
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [protocolMetadata, setProtocolMetadata] = useState({});

  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata = {};
      const fetchPromises = Object.entries(PROTOCOL_URLS).map(async ([name, url]) => {
        try {
          const data = await fetchProtocol(url);
          if (data && data.protocolId) {
            metadata[name] = data.protocolId;
          } else {
            metadata[name] = null;
          }
        } catch (err) {
          metadata[name] = null;
        }
      });
      
      await Promise.all(fetchPromises);
      setProtocolMetadata(metadata);
    };
    fetchMetadata();
  }, []);

  const loadProtocol = async (protocolName) => {
    setLoading(true);
    setError(null);
    try {
      const url = PROTOCOL_URLS[protocolName];
      if (!url) {
        throw new Error('Protocol not found');
      }
      const data = await fetchProtocol(url);
      setProtocol(data);
      setSelectedProtocol(protocolName);
      if (data && data.protocolId) {
        setProtocolMetadata(prev => ({
          ...prev,
          [protocolName]: data.protocolId
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (protocol) {
    return (
      <div style={{ padding: '0', minHeight: '100vh' }}>
        <PuzzleBoard protocol={protocol} difficulty={difficulty} onBack={() => setProtocol(null)} />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px 16px', 
      maxWidth: '100%', 
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '100vh',
      animation: 'fadeIn 0.6s ease-in'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '32px',
        paddingTop: '20px'
      }}>
        <h1 style={{ 
          color: 'white', 
          marginBottom: '12px', 
          fontSize: 'clamp(36px, 9vw, 56px)',
          fontWeight: '800',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.6s ease-out',
          letterSpacing: '-0.5px',
          lineHeight: '1.1'
        }}>
          Protocol Blitz
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 'clamp(15px, 3.5vw, 19px)',
          fontWeight: '500',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          marginTop: '8px'
        }}>
          Master EMS Protocols Through Interactive Puzzles
        </p>
      </div>
      
      {/* Difficulty Selector */}
      <div style={{ 
        marginBottom: '24px', 
        background: 'rgba(255,255,255,0.98)',
        padding: '20px', 
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.6s ease-out 0.1s both',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <label style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '14px',
          fontWeight: '700',
          fontSize: '17px',
          color: '#1e293b'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
              <span>Difficulty</span>
            </span>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(Number(e.target.value))}
              style={{ 
                padding: '14px 18px', 
                fontSize: '16px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s',
                fontWeight: '600',
                color: '#1e293b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <option value={1}>🟢 Easy - 1-2 missing blocks</option>
              <option value={2}>🟡 Medium - 2-3 missing blocks</option>
              <option value={3}>🔴 Hard - 3-4 missing blocks</option>
            </select>
            <div style={{ 
              fontSize: '13px', 
              color: '#64748b', 
              padding: '8px 12px',
              background: '#f1f5f9',
              borderRadius: '10px',
              lineHeight: '1.5'
            }}>
              {difficulty === 1 && '💡 Perfect for beginners - fewer gaps to fill'}
              {difficulty === 2 && '⚡ Balanced challenge - moderate difficulty'}
              {difficulty === 3 && '🔥 Expert mode - maximum challenge'}
            </div>
          </div>
        </label>
      </div>

      {/* Protocol Cards */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '24px'
      }}>
        {Object.keys(PROTOCOL_URLS).map((name, idx) => (
          <button
            key={name}
            onClick={() => loadProtocol(name)}
            disabled={loading}
            style={{
              padding: '20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading && selectedProtocol === name 
                ? 'rgba(148, 163, 184, 0.3)'
                : 'rgba(255,255,255,0.98)',
              border: 'none',
              borderRadius: '20px',
              fontWeight: '600',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              textAlign: 'left',
              opacity: loading && selectedProtocol === name ? 0.7 : 1,
              animation: `slideUp 0.6s ease-out ${0.15 + idx * 0.1}s both`,
              position: 'relative',
              overflow: 'hidden',
              color: '#1e293b',
              width: '100%',
              touchAction: 'manipulation',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onTouchStart={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
                e.currentTarget.style.background = 'rgba(255,255,255,1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
              e.currentTarget.style.background = loading && selectedProtocol === name 
                ? 'rgba(148, 163, 184, 0.3)'
                : 'rgba(255,255,255,0.98)';
            }}
          >
            {loading && selectedProtocol === name ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '10px' }}>
                <span className="loading-spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(59, 130, 246, 0.3)',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block'
                }}></span>
                <span style={{ fontWeight: '600' }}>Loading...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ 
                    fontSize: '32px', 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    lineHeight: '1'
                  }}>
                    📋
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, alignItems: 'flex-start' }}>
                    {protocolMetadata[name] && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#fff',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>
                        {protocolMetadata[name]}
                      </span>
                    )}
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b', lineHeight: '1.3' }}>
                      {name}
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  color: '#3b82f6',
                  fontWeight: 'bold'
                }}>
                  →
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ 
          marginTop: '16px', 
          color: 'white', 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          padding: '16px 20px',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', fontSize: '15px' }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <span>Error: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
