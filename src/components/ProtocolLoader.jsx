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

  // Fetch protocol metadata on mount to get IDs
  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata = {};
      const fetchPromises = Object.entries(PROTOCOL_URLS).map(async ([name, url]) => {
        try {
          const data = await fetchProtocol(url);
          if (data && data.protocolId) {
            metadata[name] = data.protocolId;
          } else {
            console.warn(`No protocolId found for ${name}`);
            metadata[name] = null;
          }
        } catch (err) {
          console.error(`Error fetching metadata for ${name}:`, err);
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
      // Update metadata with protocol ID if we got it
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
      padding: '16px 12px', 
      maxWidth: '100%', 
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '100vh',
      animation: 'fadeIn 0.6s ease-in'
    }}>
      {/* Header - Mobile Game Style */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '24px',
        paddingTop: '20px'
      }}>
        <h1 style={{ 
          color: 'white', 
          marginBottom: '8px', 
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: '900',
          textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2)',
          animation: 'slideDown 0.6s ease-out',
          letterSpacing: '1px',
          lineHeight: '1.1'
        }}>
          🧩 Protocol Puzzle 🧩
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: 'clamp(14px, 3.5vw, 18px)',
          fontWeight: '600',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          marginTop: '8px'
        }}>
          Master EMS Protocols Through Interactive Puzzles
        </p>
      </div>
      
      {/* Difficulty Selector - Game Style */}
      <div style={{ 
        marginBottom: '20px', 
        background: 'rgba(255,255,255,0.95)',
        padding: '18px', 
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.6s ease-out 0.1s both'
      }}>
        <label style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          fontWeight: '800',
          fontSize: '18px',
          color: '#333'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🎯</span>
            <span>Select Difficulty</span>
          </span>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(Number(e.target.value))}
            style={{ 
              padding: '14px 18px', 
              fontSize: '17px',
              borderRadius: '16px',
              border: '3px solid #667eea',
              cursor: 'pointer',
              backgroundColor: '#fff',
              transition: 'all 0.3s',
              fontWeight: '700',
              color: '#333',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 18px center',
              paddingRight: '50px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#764ba2';
              e.target.style.boxShadow = '0 6px 16px rgba(118,75,162,0.4)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <option value={1}>🟢 Easy</option>
            <option value={2}>🟡 Medium</option>
            <option value={3}>🔴 Hard</option>
          </select>
        </label>
      </div>

      {/* Protocol Cards - Mobile Game Style */}
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
              padding: '20px 18px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading && selectedProtocol === name 
                ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
              border: 'none',
              borderRadius: '24px',
              fontWeight: '700',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              textAlign: 'left',
              opacity: loading && selectedProtocol === name ? 0.7 : 1,
              animation: `slideUp 0.6s ease-out ${0.15 + idx * 0.1}s both`,
              position: 'relative',
              overflow: 'hidden',
              color: '#333',
              width: '100%',
              touchAction: 'manipulation'
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
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
            }}
          >
            {loading && selectedProtocol === name ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '10px' }}>
                <span className="loading-spinner" style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(255,107,107,0.3)',
                  borderTop: '3px solid #FF6B6B',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block'
                }}></span>
                <span style={{ fontWeight: '700' }}>Loading...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ 
                      fontSize: '36px', 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      lineHeight: '1'
                    }}>
                      📋
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, alignItems: 'flex-start' }}>
                      {protocolMetadata[name] && (
                        <span style={{ 
                          fontSize: '15px', 
                          color: '#fff',
                          fontWeight: '900',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          padding: '6px 14px',
                          borderRadius: '12px',
                          display: 'inline-block',
                          boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          {protocolMetadata[name]}
                        </span>
                      )}
                      <span style={{ fontWeight: '800', fontSize: '17px', color: '#333', lineHeight: '1.3' }}>
                        {name}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    color: '#667eea',
                    fontWeight: 'bold',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    →
                  </div>
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '18px 20px',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', fontSize: '16px' }}>
            <span style={{ fontSize: '24px' }}>❌</span>
            <span>Error: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
