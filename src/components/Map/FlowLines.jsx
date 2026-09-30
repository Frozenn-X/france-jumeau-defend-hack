import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { NEIGHBORS } from '../../data/neighbors';

export default function FlowLines({ nationalData }) {
  const { current: map } = useMap();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [particleOffset, setParticleOffset] = useState(0);

  // Animation loop for particles
  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const delta = time - lastTime;
      // Adjust speed based on time elapsed to make it smooth
      setParticleOffset((prev) => (prev + 0.005) % 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Redraw when map moves, zoom changes, or data/animation tick updates
  useEffect(() => {
    if (!map || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Resize canvas to match map container
    const mapCanvas = map.getCanvas();
    canvas.width = mapCanvas.clientWidth;
    canvas.height = mapCanvas.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!nationalData || nationalData.length === 0) return;
    const latest = nationalData[0];

    Object.entries(NEIGHBORS).forEach(([key, neighbor]) => {
      const val = latest[neighbor.key] || 0; // Value in MW
      if (val === 0) return;

      const isExport = val < 0; // Negative means exporting from France
      const absVal = Math.abs(val);

      // Project coordinates [lng, lat]
      const pStart = map.project([neighbor.franceAnchor[1], neighbor.franceAnchor[0]]);
      const pEnd = map.project([neighbor.coords[1], neighbor.coords[0]]);

      const x0 = pStart.x;
      const y0 = pStart.y;
      const x1 = pEnd.x;
      const y1 = pEnd.y;

      // Draw Bezier curve
      // Perpendicular offset for Bezier control point to curve the lines nicely
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Control point: mid point offset perpendicularly
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      
      // Curving factor (adjust strength and direction of curve)
      const curveScale = 0.15; 
      const nx = -dy / dist;
      const ny = dx / dist;
      const cx = mx + nx * dist * curveScale;
      const cy = my + ny * dist * curveScale;

      // Calculate path thickness based on flow volume (MW)
      // Min 2px, max 10px
      const thickness = Math.min(10, Math.max(2, (absVal / 8000) * 8 + 2));
      const color = isExport ? '#10b981' : '#f43f5e'; // Green for export, Red/Pink for import

      // Draw main line (glow + core)
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      
      // Glow effect
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness + 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.2;
      ctx.stroke();

      // Main core line
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw flow particles with glowing trails
      // Speed of particles depends on flow volume
      const speedMultiplier = Math.min(3, Math.max(0.5, absVal / 3000));
      const tOffset = (particleOffset * speedMultiplier) % 1;

      // Draw 3 particles spaced along the curve
      for (let i = 0; i < 3; i++) {
        let t = (tOffset + i * 0.33) % 1;
        // Direction of particles
        if (!isExport) {
          // Import: flows to France (end to start)
          t = 1 - t;
        }

        // Draw 5 trailing dots for each particle to create an electron trail effect
        for (let j = 0; j < 5; j++) {
          const step = j * 0.012;
          const trailT = isExport ? Math.max(0, t - step) : Math.min(1, t + step);

          // De Casteljau's algorithm for quadratic Bezier point
          const px = (1 - trailT) * (1 - trailT) * x0 + 2 * (1 - trailT) * trailT * cx + trailT * trailT * x1;
          const py = (1 - trailT) * (1 - trailT) * y0 + 2 * (1 - trailT) * trailT * cy + trailT * trailT * y1;

          const opacity = Math.max(0, 1.0 - (j * 0.22));
          const trailSize = Math.max(1, (thickness * 0.8 + 2) * (1.0 - j * 0.15));

          ctx.beginPath();
          ctx.arc(px, py, trailSize, 0, 2 * Math.PI);
          ctx.fillStyle = j === 0 ? '#ffffff' : color;
          ctx.shadowColor = color;
          ctx.shadowBlur = j === 0 ? 12 : 6;
          ctx.globalAlpha = opacity;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
        }
      }

      // Draw MW text label at the midpoint curve
      // Midpoint along the Bezier curve is at t = 0.5
      const tx = 0.25 * x0 + 0.5 * cx + 0.25 * x1;
      const ty = 0.25 * y0 + 0.5 * cy + 0.25 * y1;

      ctx.fillStyle = '#0a0e1a';
      ctx.beginPath();
      const text = `${isExport ? 'Export' : 'Import'} ${Math.round(absVal).toLocaleString('fr-FR')} MW`;
      ctx.font = '10px Inter, sans-serif';
      const textWidth = ctx.measureText(text).width;
      
      // Label background bubble
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.roundRect(tx - textWidth / 2 - 6, ty - 9, textWidth + 12, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tx, ty);
    });

  }, [map, nationalData, particleOffset]);

  // Bind to map rendering events so canvas is always in sync with panning/zooming
  useEffect(() => {
    if (!map) return;
    
    const triggerRepaint = () => {
      // Small state change or call draw directly. By binding to 'render' we redraw
      // whenever map views change.
    };

    map.on('render', triggerRepaint);
    map.on('move', triggerRepaint);
    map.on('zoom', triggerRepaint);
    
    return () => {
      map.off('render', triggerRepaint);
      map.off('move', triggerRepaint);
      map.off('zoom', triggerRepaint);
    };
  }, [map]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
