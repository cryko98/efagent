import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Investigative keywords
    const words = [
        "REDACTED", "CONFIDENTIAL", "CASE 09-CR-332", "SEALED", "JOHN DOE", 
        "FLIGHT LOG", "EVIDENCE", "RESTRICTED", "NO FLY", "SURVEILLANCE", 
        "WITNESS", "DEPOSITION", "EXHIBIT A", "CLASSIFIED", "TOP SECRET"
    ];
    
    interface Floater {
        x: number;
        y: number;
        text: string;
        speed: number;
        opacity: number;
        isRedacted: boolean;
    }

    const floaters: Floater[] = [];
    const maxFloaters = 40;

    const initFloater = (): Floater => ({
        x: Math.random() * width,
        y: Math.random() * height,
        text: words[Math.floor(Math.random() * words.length)],
        speed: 0.2 + Math.random() * 0.5,
        opacity: Math.random() * 0.3,
        isRedacted: Math.random() > 0.6
    });

    for(let i=0; i<maxFloaters; i++) {
        floaters.push(initFloater());
    }

    const draw = () => {
      // Create a trail effect for the "microfilm" look
      ctx.fillStyle = 'rgba(10, 10, 10, 0.2)'; 
      ctx.fillRect(0, 0, width, height);

      ctx.font = "14px 'Special Elite', monospace";

      floaters.forEach((f, i) => {
          f.y -= f.speed; // Float Up
          if (f.y < -50) {
              floaters[i] = { ...initFloater(), y: height + 20 };
          }

          // Random horizontal jitter for "film grain" effect
          const jitter = (Math.random() - 0.5) * 2;

          if (f.isRedacted) {
             // Draw black block
             const metrics = ctx.measureText(f.text);
             ctx.fillStyle = `rgba(0, 0, 0, ${f.opacity + 0.2})`;
             ctx.fillRect(f.x + jitter - 2, f.y - 12, metrics.width + 4, 16);
          } else {
             // Draw text
             ctx.fillStyle = `rgba(150, 150, 150, ${f.opacity})`;
             ctx.fillText(f.text, f.x + jitter, f.y);
          }
      });

      // Add random horizontal scan lines (interference)
      if (Math.random() > 0.9) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          const y = Math.random() * height;
          ctx.fillRect(0, y, width, 2);
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
  );
};

export default MatrixBackground;