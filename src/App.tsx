\
  import { useState, useEffect, useRef } from "react";
  import { motion } from "framer-motion";
  import { Button } from "@/components/ui/button";

  export default function HolyCannoli() {
    const [dogX, setDogX] = useState(200);
    const [pastries, setPastries] = useState<any[]>([]);
    const [hazards, setHazards] = useState<any[]>([]);
    const [emotes, setEmotes] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isRunning, setIsRunning] = useState(true);
    const [speed, setSpeed] = useState(4);
    const gameRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);

    // --- Simple WebAudio sound manager (no external files) ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ensureAudio = () => {
      if (!audioCtxRef.current) {
        const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    };
    const resumeOnUserGesture = () => {
      try { ensureAudio(); } catch {}
    };

    // Gulp / eating sound (quick descending blip)
    const playGulp = () => {
      const ctx = ensureAudio();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    };

    // Vacuum / hazard hit (short filtered noise with gentle whoosh)
    const playVacuum = () => {
      const ctx = ensureAudio();
      const now = ctx.currentTime;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.45);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.46);
    };

    // Enable audio after first interaction
    useEffect(() => {
      const onDown = () => resumeOnUserGesture();
      const onClick = () => resumeOnUserGesture();
      window.addEventListener("keydown", onDown, { once: true });
      window.addEventListener("pointerdown", onClick, { once: true });
      return () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("pointerdown", onClick);
      };
    }, []);

    // Keyboard movement (arrow keys)
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (!isRunning) return;
        if (e.key === "ArrowLeft") {
          setDogX((prev) => Math.max(prev - 30, 0));
        } else if (e.key === "ArrowRight") {
          setDogX((prev) => Math.min(prev + 30, 400));
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [isRunning]);

    // Touch/drag movement on mobile
    const moveDogToClientX = (clientX: number) => {
      if (!gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();
      const rel = clientX - rect.left; // 0 .. width
      const clamped = Math.min(Math.max(rel - 40, 0), 400); // center sprite (approx 40px)
      setDogX(clamped);
    };

    const onPointerDown = (e: React.PointerEvent) => {
      if (!isRunning) return;
      isDraggingRef.current = true;
      moveDogToClientX(e.clientX);
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!isRunning) return;
      if (!isDraggingRef.current) return;
      moveDogToClientX(e.clientX);
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    // Game timer (60s) + difficulty ramp
    useEffect(() => {
      if (!isRunning) return;
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          const next = t - 1;
          if (next <= 0) setIsRunning(false);
          return Math.max(next, 0);
        });
        setSpeed((s) => Math.min(s + 0.15, 20));
      }, 1000);
      return () => clearInterval(timer);
    }, [isRunning]);

    // Spawn pastries (cannoli)
    useEffect(() => {
      if (!isRunning) return;
      const interval = setInterval(() => {
        setPastries((prev) => [
          ...prev,
          { id: `p-${Date.now()}-${Math.random()}`, x: Math.random() * 400, y: 0 },
        ]);
      }, 900);
      return () => clearInterval(interval);
    }, [isRunning]);

    // Spawn hazards
    useEffect(() => {
      if (!isRunning) return;
      const interval = setInterval(() => {
        setHazards((prev) => [
          ...prev,
          { id: `h-${Date.now()}-${Math.random()}`, x: Math.random() * 400, y: 0 },
        ]);
      }, 1400);
      return () => clearInterval(interval);
    }, [isRunning]);

    // Move pastries & hazards & decay emotes
    useEffect(() => {
      if (!isRunning) return;
      const fallInterval = setInterval(() => {
        setPastries((prev) => prev.map((p: any) => ({ ...p, y: p.y + speed })).filter((p: any) => p.y < 500));
        setHazards((prev) => prev.map((h: any) => ({ ...h, y: h.y + speed })).filter((h: any) => h.y < 500));
        setEmotes((prev) => prev.map((e: any) => ({ ...e, life: e.life - 0.05 })).filter((e: any) => e.life > 0));
      }, 50);
      return () => clearInterval(fallInterval);
    }, [isRunning, speed]);

    // Collision detection (play sounds + emotes)
    useEffect(() => {
      if (!isRunning) return;
      setPastries((prev: any[]) => {
        return prev.filter((p: any) => {
          if (p.y > 420 && p.x > dogX - 30 && p.x < dogX + 80) {
            setScore((s) => s + 1);
            setEmotes((ems) => [
              ...ems,
              { id: `e-heart-${Date.now()}`, type: "heart", x: dogX + 20, y: 420, life: 1 },
            ]);
            playGulp();
            return false;
          }
          return true;
        });
      });
      setHazards((prev: any[]) => {
        return prev.filter((h: any) => {
          if (h.y > 420 && h.x > dogX - 30 && h.x < dogX + 80) {
            setScore((s) => Math.max(0, s - 1));
            setEmotes((ems) => [
              ...ems,
              { id: `e-cry-${Date.now()}`, type: "cry", x: dogX + 20, y: 420, life: 1 },
            ]);
            playVacuum();
            return false;
          }
          return true;
        });
      });
    }, [dogX, pastries, hazards, isRunning]);

    const restart = () => {
      setDogX(200);
      setPastries([]);
      setHazards([]);
      setEmotes([]);
      setScore(0);
      setTimeLeft(60);
      setSpeed(4);
      setIsRunning(true);
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-300 to-green-400">
        <div className="flex items-center gap-3 mb-2">
          <motion.img
            src="https://i.ibb.co/kgDMJ8yW/Untitled-design-77.png"
            alt="Cannoli"
            className="w-10 h-10"
            style={{ imageRendering: "pixelated" }}
            animate={{ rotate: [0, -10, 0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Holy Cannoli</h1>
          <motion.img
            src="https://i.ibb.co/kgDMJ8yW/Untitled-design-77.png"
            alt="Cannoli"
            className="w-10 h-10"
            style={{ imageRendering: "pixelated" }}
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
        </div>

        <div className="flex items-center gap-6 mb-4 text-lg text-white drop-shadow">
          <p>Score: {score}</p>
          <p>Time: {timeLeft}s</p>
        </div>

        <div
          ref={gameRef}
          className="relative w-[500px] h-[500px] border-4 border-orange-600 rounded-lg overflow-hidden bg-sky-200"
          onClick={resumeOnUserGesture}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ touchAction: "none" }}
        >
          {/* Dog */}
          <motion.img
            src="https://i.ibb.co/v6DzKgzy/dog.png"
            alt="Dog Catcher"
            className="absolute bottom-0 w-20 drop-shadow-lg"
            style={{ imageRendering: "pixelated" }}
            animate={{ x: dogX }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />

          {/* Falling pastries (cannoli) */}
          {pastries.map((p: any) => (
            <motion.img
              key={p.id}
              src="https://i.ibb.co/kgDMJ8yW/Untitled-design-77.png"
              alt="Cannoli"
              className="absolute w-10 drop-shadow"
              style={{ imageRendering: "pixelated" }}
              initial={{ y: 0 }}
              animate={{ x: p.x, y: p.y }}
              transition={{ duration: 0.05 }}
            />
          ))}

          {/* Falling hazards */}
          {hazards.map((h: any) => (
            <motion.img
              key={h.id}
              src="https://i.ibb.co/XxsPtqQh/Untitled-design-78.png"
              alt="Hazard"
              className="absolute w-10 drop-shadow"
              style={{ imageRendering: "pixelated" }}
              initial={{ y: 0 }}
              animate={{ x: h.x, y: h.y }}
              transition={{ duration: 0.05 }}
            />
          ))}

          {/* Emotes appear above dog */}
          {emotes.map((e: any) => (
            <div
              key={e.id}
              className="absolute text-2xl select-none"
              style={{ left: e.x, top: e.y - 40, opacity: e.life }}
            >
              {e.type === "heart" ? "❤️" : "😭"}
            </div>
          ))}

          {!isRunning && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-4">
              <div className="text-3xl font-bold">Time's up!</div>
              <div className="text-xl">Final Score: {score}</div>
              <Button onClick={restart}>Play Again</Button>
              <a
                href="https://x.com/HolyCannoliNFT"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg白 text-black text-sm hover:bg-neutral-200 transition"
              >
                Follow us
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button onClick={restart}>Restart</Button>
          <span className="text-sm text-white/90">
            Follow us at{" "}
            <a
              href="https://x.com/HolyCannoliNFT"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-white"
            >
              @HolyCannoliNFT
            </a>
          </span>
        </div>
      </div>
    );
  }
