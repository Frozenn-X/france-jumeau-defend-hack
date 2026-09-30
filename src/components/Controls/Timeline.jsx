import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function Timeline({ nationalData, forecastData }) {
  const { timelineIndex, setTimelineIndex } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);

  const pastLength = nationalData?.length || 0;
  const futureLength = forecastData?.length || 0;
  const totalLength = pastLength + futureLength;

  // Auto-play history timeline
  useEffect(() => {
    if (!isPlaying || totalLength <= 1) return;

    const interval = setInterval(() => {
      setTimelineIndex((prev) => {
        // TimelineIndex mapping:
        // past: > 0 (e.g. 99 = oldest)
        // live: 0
        // future: < 0 (e.g. -1 = 15m ahead, -96 = furthest future)
        const currentSlider = (pastLength - 1) - prev;
        let nextSlider = currentSlider + 1;
        
        if (nextSlider >= totalLength) {
          nextSlider = 0; // loop to past
        }
        return (pastLength - 1) - nextSlider;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, pastLength, totalLength]);

  if (pastLength === 0) return null;

  const sliderVal = (pastLength - 1) - timelineIndex;

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setTimelineIndex((pastLength - 1) - val);
  };

  let activeRecord;
  if (timelineIndex < 0 && forecastData) {
    activeRecord = forecastData[Math.abs(timelineIndex) - 1];
  } else {
    activeRecord = nationalData[timelineIndex] || nationalData[0];
  }

  const activeTimeLabel = activeRecord?.date_heure
    ? new Date(activeRecord.date_heure).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Temps Réel';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      width: '100%',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        style={{
          background: isPlaying ? 'var(--color-import)' : 'var(--color-export)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: `0 0 10px ${isPlaying ? 'var(--color-import)' : 'var(--color-export)'}`,
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Slider & Label Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Historique & Prévisions</span>
          <span style={{ color: 'var(--text-accent)', fontWeight: 'bold' }}>{activeTimeLabel}</span>
        </div>

        <input
          type="range"
          min="0"
          max={totalLength - 1}
          value={sliderVal}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.1)',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none'
          }}
        />
      </div>

      {/* Realtime label Indicator */}
      <button
        onClick={() => {
          setIsPlaying(false);
          setTimelineIndex(0);
        }}
        disabled={timelineIndex === 0}
        style={{
          background: timelineIndex === 0 ? 'rgba(34,197,94,0.15)' : 'transparent',
          color: timelineIndex === 0 ? 'var(--color-export)' : 'var(--text-secondary)',
          border: `1px solid ${timelineIndex === 0 ? 'var(--color-export)' : 'var(--border-light)'}`,
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '10px',
          fontWeight: 'bold',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        Live ●
      </button>
    </div>
  );
}
