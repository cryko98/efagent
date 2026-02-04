import React, { useEffect, useRef } from 'react';
import { BotMood } from '../types';

interface RobotFaceProps {
  mood: BotMood;
  isUserTyping: boolean;
}

const RobotFace: React.FC<RobotFaceProps> = ({ mood, isUserTyping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    
    const updateSize = () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // --- LENS STATE ---
    let frame = 0;
    
    // Camera Panning (Mouse Follow)
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.left + width / 2;
        const cy = rect.top + height / 2;
        targetX = (e.clientX - cx) / (width / 2); // -1 to 1
        targetY = (e.clientY - cy) / (height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Drawing Helpers
    const drawCrosshair = (x: number, y: number, size: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
    };

    const drawBracket = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top Left
        ctx.moveTo(x, y + 20); ctx.lineTo(x, y); ctx.lineTo(x + 20, y);
        // Top Right
        ctx.moveTo(x + w - 20, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + 20);
        // Bottom Right
        ctx.moveTo(x + w, y + h - 20); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - 20, y + h);
        // Bottom Left
        ctx.moveTo(x + 20, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - 20);
        ctx.stroke();
    };

    // --- RENDER LOOP ---
    let frameId: number;

    const render = () => {
        ctx.clearRect(0, 0, width, height);
        frame++;

        // Heavy lag for "Security Camera" feel
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        const cx = width / 2 + currentX * 50;
        const cy = height / 2 + currentY * 50;

        // Colors
        const lensColor = mood === BotMood.TALKING ? '#FF1F1F' : '#E0E0E0';
        const uiColor = '#FF1F1F'; // Evidence Red

        // 1. Aperture / Lens Body
        const maxRadius = 100;
        
        // Outer rim
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = uiColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 15]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner Lens Elements (Reflections)
        const reflectionOffset = currentX * 20;
        
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius - 10, 0, Math.PI * 2);
        ctx.fill();

        // The "Eye" / Glass
        const pupilSize = (isUserTyping || mood === BotMood.THINKING) ? 40 + Math.sin(frame * 0.2) * 10 : 50;
        
        const grad = ctx.createRadialGradient(cx - reflectionOffset, cy - reflectionOffset, 5, cx, cy, 80);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Pupil / Shutter
        ctx.beginPath();
        ctx.arc(cx, cy, pupilSize, 0, Math.PI * 2);
        ctx.strokeStyle = lensColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (mood === BotMood.THINKING) {
             // Loading spinner around pupil
             ctx.beginPath();
             ctx.arc(cx, cy, pupilSize + 10, frame * 0.1, frame * 0.1 + Math.PI/2);
             ctx.strokeStyle = uiColor;
             ctx.stroke();
        }

        // 2. HUD Overlay (The Viewfinder)
        drawCrosshair(width/2, height/2, 20, 'rgba(255, 31, 31, 0.3)');
        drawBracket(width/2 - 150, height/2 - 150, 300, 300, 'rgba(255, 31, 31, 0.5)');

        // 3. Status Text
        ctx.font = "12px 'Courier Prime', monospace";
        ctx.fillStyle = uiColor;
        ctx.fillText(`ISO 3200`, width/2 - 140, height/2 + 140);
        ctx.fillText(`F/2.8`, width/2 - 80, height/2 + 140);
        ctx.fillText(`SHUTTER 1/60`, width/2 + 50, height/2 + 140);

        // Coordinates
        const lat = 18.33; // Little St James coords hint
        const long = -64.87; 
        ctx.fillText(`LAT: ${lat + currentY}`, 50, height - 50);
        ctx.fillText(`LNG: ${long + currentX}`, 50, height - 30);

        // REC Indicator
        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.beginPath();
            ctx.arc(width - 50, 50, 6, 0, Math.PI*2);
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            ctx.fillText("REC", width - 35, 54);
        }

        frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', updateSize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(frameId);
    };
  }, [mood, isUserTyping]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] flex items-center justify-center">
        <canvas ref={canvasRef} className="relative z-10 block w-full h-full" />
    </div>
  );
};

export default RobotFace;