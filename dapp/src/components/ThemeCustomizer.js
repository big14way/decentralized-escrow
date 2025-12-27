import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ThemeCustomizer.css';

const ThemeCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [showPreview, setShowPreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [colorHarmony, setColorHarmony] = useState('complementary');
  const [contrastWarnings, setContrastWarnings] = useState([]);
  const [savedThemes, setSavedThemes] = useState([]);
  const [themeName, setThemeName] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [borderRadius, setBorderRadius] = useState(8);
  const [spacing, setSpacing] = useState(20);
  const [animations, setAnimations] = useState(true);
  const [autoDetectDarkMode, setAutoDetectDarkMode] = useState(false);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [shadowIntensity, setShadowIntensity] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [colorBrightness, setColorBrightness] = useState(100);
  const [colorSaturation, setColorSaturation] = useState(100);
  const [themeCategory, setThemeCategory] = useState('all');
  const [customTheme, setCustomTheme] = useState({
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c',
    background: '#ffffff',
    text: '#2c3e50',
    cardBg: '#f8f9fa'
  });

  const themeCategories = {
    all: { name: 'All Themes', icon: '🎨' },
    light: { name: 'Light', icon: '☀️' },
    dark: { name: 'Dark', icon: '🌙' },
    colorful: { name: 'Colorful', icon: '🌈' },
    professional: { name: 'Professional', icon: '💼' }
  };

  const presetThemes = [
    {
      id: 'default',
      name: 'Default Blue',
      icon: '🔵',
      category: 'professional',
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
      category: 'dark',
      colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e67e22',
        background: '#1a1a1a',
        text: '#ecf0f1',
        cardBg: '#2c3e50'
      }
    },
    {
      id: 'purple',
      name: 'Purple Dream',
      icon: '💜',
      category: 'colorful',
      colors: {
        primary: '#9b59b6',
        secondary: '#8e44ad',
        accent: '#e74c3c',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#f4ecf7'
      }
    },
    {
      id: 'ocean',
      name: 'Ocean Breeze',
      icon: '🌊',
      category: 'colorful',
      colors: {
        primary: '#1abc9c',
        secondary: '#16a085',
        accent: '#3498db',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#e8f8f5'
      }
    },
    {
      id: 'sunset',
      name: 'Sunset',
      icon: '🌅',
      category: 'colorful',
      colors: {
        primary: '#e67e22',
        secondary: '#d35400',
        accent: '#e74c3c',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#fef5e7'
      }
    },
    {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      category: 'colorful',
      colors: {
        primary: '#27ae60',
        secondary: '#229954',
        accent: '#f39c12',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#eafaf1'
      }
    },
    {
      id: 'midnight',
      name: 'Midnight',
      icon: '🌃',
      category: 'dark',
      colors: {
        primary: '#34495e',
        secondary: '#2c3e50',
        accent: '#3498db',
        background: '#0f1419',
        text: '#ecf0f1',
        cardBg: '#1c2833'
      }
    },
    {
      id: 'cherry',
      name: 'Cherry Blossom',
      icon: '🌸',
      category: 'light',
      colors: {
        primary: '#ff6b9d',
        secondary: '#c23866',
        accent: '#ffa07a',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#fff0f5'
      }
    },
    {
      id: 'corporate',
      name: 'Corporate',
      icon: '💼',
      category: 'professional',
      colors: {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#3498db',
        background: '#ffffff',
        text: '#2c3e50',
        cardBg: '#ecf0f1'
      }
    },
    {
      id: 'neon',
      name: 'Neon Nights',
      icon: '⚡',
      category: 'dark',
      colors: {
        primary: '#00ff88',
        secondary: '#00ccff',
        accent: '#ff00ff',
        background: '#0a0a0a',
        text: '#ffffff',
        cardBg: '#1a1a1a'
      }
    },
    {
      id: 'autumn',
      name: 'Autumn Leaves',
      icon: '🍂',
      category: 'colorful',
      colors: {
        primary: '#d35400',
        secondary: '#e67e22',
        accent: '#c0392b',
        background: '#fef9f3',
        text: '#2c3e50',
        cardBg: '#fdebd0'
      }
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      icon: '⚪',
      category: 'professional',
      colors: {
        primary: '#333333',
        secondary: '#666666',
        accent: '#999999',
        background: '#ffffff',
        text: '#333333',
        cardBg: '#f5f5f5'
      }
    }
  ];

  // Auto-detect system dark mode preference
  useEffect(() => {
    if (autoDetectDarkMode) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleDarkModeChange = (e) => {
        const darkTheme = presetThemes.find(t => t.category === 'dark');
        const lightTheme = presetThemes.find(t => t.id === 'default');
        const theme = e.matches ? darkTheme : lightTheme;
        if (theme) {
          setSelectedTheme(theme.id);
          setCustomTheme(theme.colors);
          applyTheme(theme.colors);
        }
      };

      handleDarkModeChange(darkModeMediaQuery);
      darkModeMediaQuery.addEventListener('change', handleDarkModeChange);

      return () => darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    }
  }, [autoDetectDarkMode]);

  // Calculate relative luminance for contrast checking
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Adjust color brightness
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // Adjust color saturation
  const adjustSaturation = (hex, percent) => {
    const rgb = parseInt(hex.slice(1), 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = rgb & 0xff;

    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
    const factor = percent / 100;

    r = Math.round(gray + (r - gray) * factor);
    g = Math.round(gray + (g - gray) * factor);
    b = Math.round(gray + (b - gray) * factor);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Apply brightness and saturation adjustments
  const applyColorAdjustments = () => {
    const adjusted = {};
    Object.keys(customTheme).forEach(key => {
      let color = customTheme[key];
      if (colorBrightness !== 100) {
        const brightDiff = (colorBrightness - 100) * 0.5;
        color = adjustBrightness(color, brightDiff);
      }
      if (colorSaturation !== 100) {
        color = adjustSaturation(color, colorSaturation);
      }
      adjusted[key] = color;
    });
    return adjusted;
  };

  // Check contrast compliance
  const checkContrast = useCallback(() => {
    const warnings = [];
    const textBgRatio = getContrastRatio(customTheme.text, customTheme.background);
    const textCardRatio = getContrastRatio(customTheme.text, customTheme.cardBg);
    const primaryBgRatio = getContrastRatio(customTheme.primary, customTheme.background);

    if (textBgRatio < 4.5) {
      warnings.push({
        type: 'text-bg',
        message: `Text/Background contrast (${textBgRatio.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        severity: 'high'
      });
    }

    if (textCardRatio < 4.5) {
      warnings.push({
        type: 'text-card',
        message: `Text/Card contrast (${textCardRatio.toFixed(2)}:1) is below WCAG AA standard (4.5:1)`,
        severity: 'high'
      });
    }

    if (primaryBgRatio < 3) {
      warnings.push({
        type: 'primary-bg',
        message: `Primary/Background contrast (${primaryBgRatio.toFixed(2)}:1) may be too low for UI elements`,
        severity: 'medium'
      });
    }

    setContrastWarnings(warnings);
  }, [customTheme]);

  // Generate color harmony suggestions
  const generateHarmony = (baseColor, type) => {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
        default: h = 0;
      }
    }

    const hslToHex = (h, s, l) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    switch (type) {
      case 'complementary':
        return {
          secondary: hslToHex((h + 0.5) % 1, s, l),
          accent: hslToHex((h + 0.33) % 1, s * 0.9, l * 0.95)
        };
      case 'analogous':
        return {
          secondary: hslToHex((h + 0.083) % 1, s, l),
          accent: hslToHex((h - 0.083 + 1) % 1, s, l)
        };
      case 'triadic':
        return {
          secondary: hslToHex((h + 0.333) % 1, s, l),
          accent: hslToHex((h + 0.666) % 1, s, l)
        };
      case 'monochromatic':
        return {
          secondary: hslToHex(h, s * 0.7, l * 1.1),
          accent: hslToHex(h, s * 0.5, l * 0.8)
        };
      default:
        return { secondary: customTheme.secondary, accent: customTheme.accent };
    }
  };

  // Apply color harmony
  const applyColorHarmony = () => {
    const harmony = generateHarmony(customTheme.primary, colorHarmony);
    setCustomTheme(prev => ({
      ...prev,
      secondary: harmony.secondary,
      accent: harmony.accent
    }));
    setSelectedTheme('custom');
  };

  // Load saved themes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-themes');
    if (saved) {
      try {
        setSavedThemes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved themes', e);
      }
    }

    const settings = localStorage.getItem('theme-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setCustomTheme(parsed.colors || customTheme);
        setFontSize(parsed.fontSize || 16);
        setBorderRadius(parsed.borderRadius || 8);
        setSpacing(parsed.spacing || 20);
        setAnimations(parsed.animations !== false);
        setSelectedTheme(parsed.themeId || 'default');
        setGradientEnabled(parsed.gradientEnabled || false);
        setGradientAngle(parsed.gradientAngle || 135);
        setShadowIntensity(parsed.shadowIntensity || 1);
        setAutoDetectDarkMode(parsed.autoDetectDarkMode || false);
      } catch (e) {
        console.error('Failed to load theme settings', e);
      }
    }
  }, []);

  // Check contrast when colors change
  useEffect(() => {
    checkContrast();
  }, [customTheme, checkContrast]);

  const applyTheme = (theme = customTheme, preview = false) => {
    const adjustedTheme = colorBrightness === 100 && colorSaturation === 100 ? theme : applyColorAdjustments();
    const root = document.documentElement;

    if (preview) {
      root.style.setProperty('--preview-primary', adjustedTheme.primary);
      root.style.setProperty('--preview-secondary', adjustedTheme.secondary);
      root.style.setProperty('--preview-accent', adjustedTheme.accent);
      root.style.setProperty('--preview-background', adjustedTheme.background);
      root.style.setProperty('--preview-text', adjustedTheme.text);
      root.style.setProperty('--preview-card-bg', adjustedTheme.cardBg);
    } else {
      if (gradientEnabled) {
        root.style.setProperty('--primary-color', `linear-gradient(${gradientAngle}deg, ${adjustedTheme.primary}, ${adjustedTheme.secondary})`);
      } else {
        root.style.setProperty('--primary-color', adjustedTheme.primary);
      }
      root.style.setProperty('--secondary-color', adjustedTheme.secondary);
      root.style.setProperty('--accent-color', adjustedTheme.accent);
      root.style.setProperty('--background-color', adjustedTheme.background);
      root.style.setProperty('--text-color', adjustedTheme.text);
      root.style.setProperty('--card-bg', adjustedTheme.cardBg);
      root.style.setProperty('--base-font-size', `${fontSize}px`);
      root.style.setProperty('--border-radius', `${borderRadius}px`);
      root.style.setProperty('--base-spacing', `${spacing}px`);
      root.style.setProperty('--animation-duration', animations ? '0.3s' : '0s');
      root.style.setProperty('--shadow-intensity', shadowIntensity);
      saveThemeSettings();
    }
  };

  const saveThemeSettings = () => {
    const settings = {
      themeId: selectedTheme,
      colors: customTheme,
      fontSize,
      borderRadius,
      spacing,
      animations,
      gradientEnabled,
      gradientAngle,
      shadowIntensity,
      autoDetectDarkMode
    };
    localStorage.setItem('theme-settings', JSON.stringify(settings));
  };

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme.id);
    setCustomTheme(theme.colors);
    applyTheme(theme.colors);
  };

  const handlePreview = (theme) => {
    setPreviewTheme(theme);
    setShowPreview(true);
    applyTheme(theme.colors, true);
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewTheme(null);
  };

  const confirmPreview = () => {
    if (previewTheme) {
      setSelectedTheme(previewTheme.id);
      setCustomTheme(previewTheme.colors);
      applyTheme(previewTheme.colors);
    }
    setShowPreview(false);
    setPreviewTheme(null);
  };

  const handleColorChange = (key, value) => {
    setCustomTheme(prev => ({ ...prev, [key]: value }));
    setSelectedTheme('custom');
  };

  const exportTheme = () => {
    const themeData = {
      name: themeName || 'Custom Theme',
      colors: customTheme,
      layout: { fontSize, borderRadius, spacing, animations, gradientEnabled, gradientAngle, shadowIntensity },
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName || 'theme'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.colors) {
            setCustomTheme(imported.colors);
            if (imported.layout) {
              setFontSize(imported.layout.fontSize || 16);
              setBorderRadius(imported.layout.borderRadius || 8);
              setSpacing(imported.layout.spacing || 20);
              setAnimations(imported.layout.animations !== false);
              setGradientEnabled(imported.layout.gradientEnabled || false);
              setGradientAngle(imported.layout.gradientAngle || 135);
              setShadowIntensity(imported.layout.shadowIntensity || 1);
            }
            setSelectedTheme('custom');
            applyTheme(imported.colors);
            alert('Theme imported successfully!');
          }
        } catch (error) {
          alert('Failed to import theme. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const saveCurrentTheme = () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const newTheme = {
      id: `custom-${Date.now()}`,
      name: themeName,
      colors: customTheme,
      layout: { fontSize, borderRadius, spacing, animations, gradientEnabled, gradientAngle, shadowIntensity },
      createdAt: new Date().toISOString()
    };

    const updated = [...savedThemes, newTheme];
    setSavedThemes(updated);
    localStorage.setItem('saved-themes', JSON.stringify(updated));
    setThemeName('');
    alert('Theme saved successfully!');
  };

  const loadSavedTheme = (theme) => {
    setCustomTheme(theme.colors);
    if (theme.layout) {
      setFontSize(theme.layout.fontSize || 16);
      setBorderRadius(theme.layout.borderRadius || 8);
      setSpacing(theme.layout.spacing || 20);
      setAnimations(theme.layout.animations !== false);
      setGradientEnabled(theme.layout.gradientEnabled || false);
      setGradientAngle(theme.layout.gradientAngle || 135);
      setShadowIntensity(theme.layout.shadowIntensity || 1);
    }
    setSelectedTheme(theme.id);
    applyTheme(theme.colors);
  };

  const deleteSavedTheme = (themeId) => {
    const updated = savedThemes.filter(t => t.id !== themeId);
    setSavedThemes(updated);
    localStorage.setItem('saved-themes', JSON.stringify(updated));
  };

  const generateShareUrl = () => {
    const themeData = btoa(JSON.stringify({
      colors: customTheme,
      layout: { fontSize, borderRadius, spacing, animations, gradientEnabled, gradientAngle, shadowIntensity }
    }));
    const url = `${window.location.origin}${window.location.pathname}?theme=${themeData}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default theme? This will clear all customizations.')) {
      const defaultTheme = presetThemes[0];
      setCustomTheme(defaultTheme.colors);
      setSelectedTheme('default');
      setFontSize(16);
      setBorderRadius(8);
      setSpacing(20);
      setAnimations(true);
      setGradientEnabled(false);
      setGradientAngle(135);
      setShadowIntensity(1);
      setColorBrightness(100);
      setColorSaturation(100);
      applyTheme(defaultTheme.colors);
    }
  };

  useEffect(() => {
    applyTheme();
  }, [fontSize, borderRadius, spacing, animations, gradientEnabled, gradientAngle, shadowIntensity, colorBrightness, colorSaturation]);

  // Load theme from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam) {
      try {
        const decoded = JSON.parse(atob(themeParam));
        if (decoded.colors) {
          setCustomTheme(decoded.colors);
          if (decoded.layout) {
            setFontSize(decoded.layout.fontSize || 16);
            setBorderRadius(decoded.layout.borderRadius || 8);
            setSpacing(decoded.layout.spacing || 20);
            setAnimations(decoded.layout.animations !== false);
            setGradientEnabled(decoded.layout.gradientEnabled || false);
            setGradientAngle(decoded.layout.gradientAngle || 135);
            setShadowIntensity(decoded.layout.shadowIntensity || 1);
          }
          setSelectedTheme('custom');
          applyTheme(decoded.colors);
        }
      } catch (e) {
        console.error('Failed to load theme from URL', e);
      }
    }
  }, []);

  const filteredThemes = themeCategory === 'all'
    ? presetThemes
    : presetThemes.filter(t => t.category === themeCategory);

  return (
    <>
      <button
        className="theme-customizer-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open theme customizer"
      >
        🎨
      </button>

      {isOpen && (
        <div className="theme-customizer-overlay" onClick={() => setIsOpen(false)}>
          <div className="theme-customizer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="theme-customizer-header">
              <h2>🎨 Theme Customizer Pro</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="theme-customizer-tabs">
              <button
                className={activeTab === 'themes' ? 'active' : ''}
                onClick={() => setActiveTab('themes')}
              >
                🎭 Themes
              </button>
              <button
                className={activeTab === 'colors' ? 'active' : ''}
                onClick={() => setActiveTab('colors')}
              >
                🎨 Colors
              </button>
              <button
                className={activeTab === 'layout' ? 'active' : ''}
                onClick={() => setActiveTab('layout')}
              >
                📐 Layout
              </button>
              <button
                className={activeTab === 'advanced' ? 'active' : ''}
                onClick={() => setActiveTab('advanced')}
              >
                ⚙️ Advanced
              </button>
              <button
                className={activeTab === 'saved' ? 'active' : ''}
                onClick={() => setActiveTab('saved')}
              >
                💾 Saved ({savedThemes.length})
              </button>
              <button
                className={activeTab === 'accessibility' ? 'active' : ''}
                onClick={() => setActiveTab('accessibility')}
              >
                ♿ A11y
              </button>
            </div>

            <div className="theme-customizer-content">
              {activeTab === 'themes' && (
                <div className="themes-tab">
                  <div className="theme-category-filter">
                    {Object.entries(themeCategories).map(([key, cat]) => (
                      <button
                        key={key}
                        className={themeCategory === key ? 'active' : ''}
                        onClick={() => setThemeCategory(key)}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                  <h3>Preset Themes ({filteredThemes.length})</h3>
                  <div className="theme-grid">
                    {filteredThemes.map(theme => (
                      <div
                        key={theme.id}
                        className={`theme-card ${selectedTheme === theme.id ? 'active' : ''}`}
                      >
                        <div className="theme-card-header">
                          <span className="theme-icon">{theme.icon}</span>
                          <span className="theme-name">{theme.name}</span>
                        </div>
                        <div className="theme-colors">
                          <div className="color-dot" style={{ background: theme.colors.primary }} />
                          <div className="color-dot" style={{ background: theme.colors.secondary }} />
                          <div className="color-dot" style={{ background: theme.colors.accent }} />
                        </div>
                        <div className="theme-actions">
                          <button
                            className="preview-btn"
                            onClick={() => handlePreview(theme)}
                          >
                            👁️ Preview
                          </button>
                          <button
                            className="apply-btn"
                            onClick={() => handleThemeSelect(theme)}
                          >
                            ✓ Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'colors' && (
                <div className="colors-tab">
                  <h3>Custom Colors</h3>

                  <div className="color-harmony-section">
                    <label>Color Harmony:</label>
                    <div className="harmony-controls">
                      <select
                        value={colorHarmony}
                        onChange={(e) => setColorHarmony(e.target.value)}
                      >
                        <option value="complementary">Complementary</option>
                        <option value="analogous">Analogous</option>
                        <option value="triadic">Triadic</option>
                        <option value="monochromatic">Monochromatic</option>
                      </select>
                      <button onClick={applyColorHarmony} className="harmony-btn">
                        ✨ Generate Harmony
                      </button>
                    </div>
                  </div>

                  <div className="color-adjustments">
                    <div className="adjustment-control">
                      <label>Brightness: {colorBrightness}%</label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={colorBrightness}
                        onChange={(e) => setColorBrightness(Number(e.target.value))}
                      />
                    </div>
                    <div className="adjustment-control">
                      <label>Saturation: {colorSaturation}%</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={colorSaturation}
                        onChange={(e) => setColorSaturation(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="color-pickers">
                    {Object.keys(customTheme).map(key => (
                      <div key={key} className="color-picker-group">
                        <label>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                        <div className="picker-inputs">
                          <input
                            type="color"
                            value={customTheme[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                          />
                          <input
                            type="text"
                            value={customTheme[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="layout-tab">
                  <h3>Layout Settings</h3>

                  <div className="layout-control">
                    <label>Font Size: {fontSize}px</label>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                  </div>

                  <div className="layout-control">
                    <label>Border Radius: {borderRadius}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                    />
                  </div>

                  <div className="layout-control">
                    <label>Spacing: {spacing}px</label>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      value={spacing}
                      onChange={(e) => setSpacing(Number(e.target.value))}
                    />
                  </div>

                  <div className="layout-control">
                    <label>
                      <input
                        type="checkbox"
                        checked={animations}
                        onChange={(e) => setAnimations(e.target.checked)}
                      />
                      Enable Animations
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="advanced-tab">
                  <h3>Advanced Settings</h3>

                  <div className="advanced-control">
                    <label>
                      <input
                        type="checkbox"
                        checked={autoDetectDarkMode}
                        onChange={(e) => setAutoDetectDarkMode(e.target.checked)}
                      />
                      Auto-detect System Dark Mode
                    </label>
                    <p className="control-description">Automatically switch theme based on system preferences</p>
                  </div>

                  <div className="advanced-control">
                    <label>
                      <input
                        type="checkbox"
                        checked={gradientEnabled}
                        onChange={(e) => setGradientEnabled(e.target.checked)}
                      />
                      Enable Gradient Colors
                    </label>
                    <p className="control-description">Apply gradient effects to primary colors</p>
                  </div>

                  {gradientEnabled && (
                    <div className="layout-control">
                      <label>Gradient Angle: {gradientAngle}°</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="layout-control">
                    <label>Shadow Intensity: {shadowIntensity.toFixed(1)}x</label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={shadowIntensity}
                      onChange={(e) => setShadowIntensity(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="saved-tab">
                  <h3>Save Current Theme</h3>
                  <div className="save-theme-section">
                    <input
                      type="text"
                      placeholder="Enter theme name..."
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      className="theme-name-input"
                    />
                    <button onClick={saveCurrentTheme} className="save-theme-btn">
                      💾 Save Theme
                    </button>
                  </div>

                  <h3>Your Saved Themes ({savedThemes.length})</h3>
                  {savedThemes.length === 0 ? (
                    <p className="empty-state">No saved themes yet. Create and save your first theme!</p>
                  ) : (
                    <div className="saved-themes-list">
                      {savedThemes.map(theme => (
                        <div key={theme.id} className="saved-theme-card">
                          <div className="saved-theme-info">
                            <h4>{theme.name}</h4>
                            <small>{new Date(theme.createdAt).toLocaleDateString()}</small>
                          </div>
                          <div className="saved-theme-colors">
                            <div className="color-dot" style={{ background: theme.colors.primary }} />
                            <div className="color-dot" style={{ background: theme.colors.secondary }} />
                            <div className="color-dot" style={{ background: theme.colors.accent }} />
                          </div>
                          <div className="saved-theme-actions">
                            <button onClick={() => loadSavedTheme(theme)}>Load</button>
                            <button onClick={() => deleteSavedTheme(theme.id)} className="delete-btn">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'accessibility' && (
                <div className="accessibility-tab">
                  <h3>Accessibility Check</h3>

                  {contrastWarnings.length === 0 ? (
                    <div className="accessibility-pass">
                      <div className="check-icon">✓</div>
                      <h4>All Checks Passed!</h4>
                      <p>Your color choices meet WCAG accessibility standards.</p>
                    </div>
                  ) : (
                    <div className="accessibility-warnings">
                      <p className="warning-intro">⚠️ {contrastWarnings.length} contrast issue(s) detected:</p>
                      {contrastWarnings.map((warning, idx) => (
                        <div key={idx} className={`warning-card severity-${warning.severity}`}>
                          <div className="warning-header">
                            <span className="severity-badge">{warning.severity}</span>
                            <span className="warning-type">{warning.type}</span>
                          </div>
                          <p>{warning.message}</p>
                        </div>
                      ))}
                      <div className="accessibility-info">
                        <h4>Recommendations:</h4>
                        <ul>
                          <li>Text should have at least 4.5:1 contrast ratio with background (WCAG AA)</li>
                          <li>Large text (18pt+) should have at least 3:1 contrast ratio</li>
                          <li>UI components should have at least 3:1 contrast ratio</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="theme-customizer-footer">
              <div className="footer-left">
                <button onClick={resetToDefault} className="reset-btn">
                  🔄 Reset
                </button>
              </div>
              <div className="footer-right">
                <button onClick={generateShareUrl} className="share-btn">
                  🔗 Share
                </button>
                <button onClick={exportTheme} className="export-btn">
                  ⬇️ Export
                </button>
                <label className="import-btn">
                  ⬆️ Import
                  <input type="file" accept=".json" onChange={importTheme} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-banner">
            <div className="preview-info">
              <span className="preview-icon">👁️</span>
              <span>Previewing: {previewTheme?.name}</span>
            </div>
            <div className="preview-actions">
              <button onClick={cancelPreview} className="cancel-preview">Cancel</button>
              <button onClick={confirmPreview} className="confirm-preview">Apply Theme</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Share Your Theme</h3>
            <p>Copy this link to share your theme with others:</p>
            <div className="share-url-container">
              <input type="text" value={shareUrl} readOnly />
              <button onClick={copyShareUrl}>📋 Copy</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="close-share-btn">Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeCustomizer;
