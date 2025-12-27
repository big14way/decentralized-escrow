import React, { useState, useEffect } from 'react';
import '../styles/ThemeCustomizer.css';

const ThemeCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [customTheme, setCustomTheme] = useState({
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c',
    background: '#ffffff',
    text: '#2c3e50',
    cardBg: '#f8f9fa'
  });

  const presetThemes = [
    {
      id: 'default',
      name: 'Default Blue',
      icon: '🔵',
      colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#f8f9fa'
      }
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      icon: '🌙',
      colors: {
        primary: '#5dade2',
        secondary: '#58d68d',
        accent: '#ec7063',
        background: '#1a1a1a',
        text: '#ecf0f1',
        cardBg: '#2c2c2c'
      }
    },
    {
      id: 'purple',
      name: 'Purple Dream',
      icon: '💜',
      colors: {
        primary: '#9b59b6',
        secondary: '#3498db',
        accent: '#f39c12',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#f4ecf7'
      }
    },
    {
      id: 'ocean',
      name: 'Ocean Breeze',
      icon: '🌊',
      colors: {
        primary: '#1abc9c',
        secondary: '#16a085',
        accent: '#3498db',
        background: '#ecf8f8',
        text: '#2c3e50',
        cardBg: '#d1f2eb'
      }
    },
    {
      id: 'sunset',
      name: 'Sunset',
      icon: '🌅',
      colors: {
        primary: '#e67e22',
        secondary: '#e74c3c',
        accent: '#f39c12',
        background: '#fff5f0',
        text: '#2c3e50',
        cardBg: '#fdecea'
      }
    },
    {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      colors: {
        primary: '#27ae60',
        secondary: '#229954',
        accent: '#f39c12',
        background: '#f1f8f4',
        text: '#1e4620',
        cardBg: '#d5f4e6'
      }
    },
    {
      id: 'midnight',
      name: 'Midnight',
      icon: '🌃',
      colors: {
        primary: '#5dade2',
        secondary: '#af7ac5',
        accent: '#f1c40f',
        background: '#0d1117',
        text: '#c9d1d9',
        cardBg: '#161b22'
      }
    },
    {
      id: 'cherry',
      name: 'Cherry Blossom',
      icon: '🌸',
      colors: {
        primary: '#e91e63',
        secondary: '#9c27b0',
        accent: '#ff9800',
        background: '#fff0f5',
        text: '#2c3e50',
        cardBg: '#fce4ec'
      }
    }
  ];

  const [selectedTheme, setSelectedTheme] = useState('default');
  const [fontSize, setFontSize] = useState(16);
  const [borderRadius, setBorderRadius] = useState(8);
  const [spacing, setSpacing] = useState(20);
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  useEffect(() => {
    applyTheme();
  }, [customTheme, fontSize, borderRadius, spacing, animations]);

  const loadThemeSettings = () => {
    const saved = localStorage.getItem('theme-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setSelectedTheme(settings.selectedTheme || 'default');
      setCustomTheme(settings.customTheme || customTheme);
      setFontSize(settings.fontSize || 16);
      setBorderRadius(settings.borderRadius || 8);
      setSpacing(settings.spacing || 20);
      setAnimations(settings.animations !== false);
    }
  };

  const saveThemeSettings = () => {
    const settings = {
      selectedTheme,
      customTheme,
      fontSize,
      borderRadius,
      spacing,
      animations
    };
    localStorage.setItem('theme-settings', JSON.stringify(settings));
  };

  const applyTheme = () => {
    const root = document.documentElement;

    root.style.setProperty('--primary-color', customTheme.primary);
    root.style.setProperty('--secondary-color', customTheme.secondary);
    root.style.setProperty('--accent-color', customTheme.accent);
    root.style.setProperty('--background-color', customTheme.background);
    root.style.setProperty('--text-color', customTheme.text);
    root.style.setProperty('--card-bg', customTheme.cardBg);

    root.style.setProperty('--base-font-size', `${fontSize}px`);
    root.style.setProperty('--border-radius', `${borderRadius}px`);
    root.style.setProperty('--base-spacing', `${spacing}px`);
    root.style.setProperty('--animation-duration', animations ? '0.3s' : '0s');

    saveThemeSettings();
  };

  const selectPresetTheme = (themeId) => {
    const theme = presetThemes.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(themeId);
      setCustomTheme(theme.colors);
    }
  };

  const updateCustomColor = (key, value) => {
    setCustomTheme(prev => ({ ...prev, [key]: value }));
    setSelectedTheme('custom');
  };

  const resetToDefault = () => {
    const defaultTheme = presetThemes[0];
    setSelectedTheme('default');
    setCustomTheme(defaultTheme.colors);
    setFontSize(16);
    setBorderRadius(8);
    setSpacing(20);
    setAnimations(true);
  };

  const exportTheme = () => {
    const themeData = {
      customTheme,
      fontSize,
      borderRadius,
      spacing,
      animations
    };
    const dataStr = JSON.stringify(themeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-theme.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setCustomTheme(imported.customTheme || customTheme);
          setFontSize(imported.fontSize || 16);
          setBorderRadius(imported.borderRadius || 8);
          setSpacing(imported.spacing || 20);
          setAnimations(imported.animations !== false);
          setSelectedTheme('custom');
          alert('Theme imported successfully!');
        } catch (error) {
          alert('Error importing theme. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <button
        className="theme-customizer-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Theme Customizer"
      >
        🎨
      </button>

      {isOpen && (
        <div className="theme-customizer-modal">
          <div className="theme-backdrop" onClick={() => setIsOpen(false)} />
          <div className="theme-content">
            <div className="theme-header">
              <h2>🎨 Theme Customizer</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="theme-tabs">
              <button
                className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
                onClick={() => setActiveTab('themes')}
              >
                🎨 Themes
              </button>
              <button
                className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
                onClick={() => setActiveTab('colors')}
              >
                🌈 Colors
              </button>
              <button
                className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                📐 Layout
              </button>
            </div>

            <div className="theme-body">
              {activeTab === 'themes' && (
                <div className="themes-section">
                  <h3>Preset Themes</h3>
                  <div className="themes-grid">
                    {presetThemes.map(theme => (
                      <button
                        key={theme.id}
                        className={`theme-card ${selectedTheme === theme.id ? 'active' : ''}`}
                        onClick={() => selectPresetTheme(theme.id)}
                      >
                        <div className="theme-icon">{theme.icon}</div>
                        <div className="theme-name">{theme.name}</div>
                        <div className="theme-colors">
                          <span
                            className="color-dot"
                            style={{ background: theme.colors.primary }}
                          />
                          <span
                            className="color-dot"
                            style={{ background: theme.colors.secondary }}
                          />
                          <span
                            className="color-dot"
                            style={{ background: theme.colors.accent }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'colors' && (
                <div className="colors-section">
                  <h3>Custom Colors</h3>
                  <div className="color-pickers">
                    <div className="color-picker-group">
                      <label>Primary Color</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.primary}
                          onChange={(e) => updateCustomColor('primary', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.primary}
                          onChange={(e) => updateCustomColor('primary', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group">
                      <label>Secondary Color</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.secondary}
                          onChange={(e) => updateCustomColor('secondary', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.secondary}
                          onChange={(e) => updateCustomColor('secondary', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group">
                      <label>Accent Color</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.accent}
                          onChange={(e) => updateCustomColor('accent', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.accent}
                          onChange={(e) => updateCustomColor('accent', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group">
                      <label>Background Color</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.background}
                          onChange={(e) => updateCustomColor('background', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.background}
                          onChange={(e) => updateCustomColor('background', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group">
                      <label>Text Color</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.text}
                          onChange={(e) => updateCustomColor('text', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.text}
                          onChange={(e) => updateCustomColor('text', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group">
                      <label>Card Background</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customTheme.cardBg}
                          onChange={(e) => updateCustomColor('cardBg', e.target.value)}
                        />
                        <input
                          type="text"
                          value={customTheme.cardBg}
                          onChange={(e) => updateCustomColor('cardBg', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="layout-section">
                  <h3>Layout Settings</h3>

                  <div className="layout-control">
                    <label>
                      <span>Font Size</span>
                      <span className="control-value">{fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="layout-control">
                    <label>
                      <span>Border Radius</span>
                      <span className="control-value">{borderRadius}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="layout-control">
                    <label>
                      <span>Spacing</span>
                      <span className="control-value">{spacing}px</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      value={spacing}
                      onChange={(e) => setSpacing(parseInt(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="layout-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={animations}
                        onChange={(e) => setAnimations(e.target.checked)}
                      />
                      <span>Enable Animations</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="theme-footer">
              <div className="footer-actions">
                <button className="action-btn reset" onClick={resetToDefault}>
                  Reset to Default
                </button>
                <div className="export-import">
                  <button className="action-btn export" onClick={exportTheme}>
                    📥 Export
                  </button>
                  <label className="action-btn import">
                    📤 Import
                    <input
                      type="file"
                      accept="application/json"
                      onChange={importTheme}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeCustomizer;
