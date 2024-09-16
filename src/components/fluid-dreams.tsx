"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function FluidDreams() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.connect(audioContextRef.current.destination);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const drawBlakeInspiredBackground = (time: number) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, `hsl(${time % 360}, 100%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${(time + 120) % 360}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(time + 240) % 360}, 100%, 50%)`);

      ctx.globalAlpha = 0.1;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(
        (Math.sin(time * 0.01) * canvas.width) / 2 + canvas.width / 2,
        0
      );
      ctx.lineTo(
        (Math.cos(time * 0.02) * canvas.width) / 2 + canvas.width / 2,
        canvas.height
      );
      ctx.lineTo(
        (Math.sin(time * 0.03) * canvas.width) / 2 + canvas.width / 2,
        0
      );
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
    };

    const draw = (time: number) => {
      if (!analyserRef.current || !ctx) return;

      drawBlakeInspiredBackground(time);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${(time / 50) % 360}, 100%, 50%)`;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ("asdfghjklwetyu".includes(key)) {
        playNote(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ("asdfghjklwetyu".includes(key)) {
        setActiveNote(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playNote = (note: string) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const frequencies: { [key: string]: number } = {
      a: 261.63,
      w: 277.18,
      s: 293.66,
      e: 311.13,
      d: 329.63,
      f: 349.23,
      t: 369.99,
      g: 392.0,
      y: 415.3,
      h: 440.0,
      u: 466.16,
      j: 493.88,
      k: 523.25,
      l: 587.33,
    };

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequencies[note],
      audioContextRef.current.currentTime
    );
    oscillator.connect(gainNode);
    gainNode.connect(analyserRef.current);

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.5,
      audioContextRef.current.currentTime + 0.01
    );

    oscillator.start();
    setActiveNote(note);

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === note) {
        gainNode.gain.linearRampToValueAtTime(
          0,
          audioContextRef.current!.currentTime + 0.01
        );
        setTimeout(() => oscillator.stop(), 10);
        setActiveNote(null);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };

    window.addEventListener("keyup", handleKeyUp);
  };

  const renderKey = (note: string, index: number, isBlack: boolean) => (
    <motion.div
      key={note}
      className="absolute rounded-lg cursor-pointer overflow-hidden"
      style={{
        width: isBlack ? "30px" : "60px",
        height: isBlack ? "120px" : "180px",
        left: `${index * 60 + (isBlack ? 45 : 0)}px`,
        zIndex: isBlack ? 10 : 0,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => playNote(note)}
      aria-label={`Play note ${note.toUpperCase()}`}
    >
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(45deg, 
            hsl(${index * 30}, 100%, ${isBlack ? "20%" : "50%"}), 
            hsl(${index * 30 + 60}, 100%, ${isBlack ? "30%" : "60%"})
          )`,
          opacity: activeNote === note ? 1 : 0.7,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.3) 90%)",
        }}
      />
    </motion.div>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="relative h-48 mb-4">
          {["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((note, index) =>
            renderKey(note, index, false)
          )}
          {["w", "e", "t", "y", "u"].map((note, index) =>
            renderKey(note, index, true)
          )}
        </div>
      </div>
    </div>
  );
}
