
"use client";

import { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Timer,
  Target,
  Zap,
  AlertCircle,
  Trophy,
} from "lucide-react";

export type TypingResult = {
  wpm: number;
  accuracy: number;
  errors: number;
  rank: "S" | "A" | "B" | "C" | "D";
  completed: boolean;
};

type TypingEngineProps = {
  passage?: string;
  duration?: number;
  onComplete?: (result: TypingResult) => void;
};

function getPerformanceRank(accuracy: number): TypingResult["rank"] {
  if (accuracy >= 98) return "S";
  if (accuracy >= 95) return "A";
  if (accuracy >= 90) return "B";
  if (accuracy >= 80) return "C";
  return "D";
}

export default function TypingEngine({
  passage = "The goblin raises its rusty blade and charges toward you. You steady your weapon and prepare to strike. Your courage will determine the fate of this battle.",
  duration = 60,
  onComplete,
}: TypingEngineProps) {
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const keystrokesRef = useRef({ total: 0, correct: 0 });
  const completionSentRef = useRef(false);

  const correctCharacters = input
    .split("")
    .filter((char, index) => char === passage[index]).length;

  const errors = totalKeystrokes - correctKeystrokes;

  const accuracy =
    totalKeystrokes === 0
      ? 100
      : Math.round((correctKeystrokes / totalKeystrokes) * 100);

  const elapsedSeconds = duration - timeLeft;

  const wpm =
    elapsedSeconds > 0
      ? Math.round((correctCharacters / 5) / (elapsedSeconds / 60))
      : 0;

  const progress = Math.round((input.length / passage.length) * 100);
  const rank = getPerformanceRank(accuracy);

  function finishTyping(completed: boolean, finalTimeLeft: number) {
    if (completionSentRef.current) return;

    completionSentRef.current = true;
    setIsActive(false);
    setIsFinished(true);

    const elapsed = Math.max(1, duration - finalTimeLeft);

    const finalCorrectCharacters = input
      .split("")
      .filter((char, index) => char === passage[index]).length;

    const finalTotal = keystrokesRef.current.total;
    const finalCorrect = keystrokesRef.current.correct;

    const finalAccuracy =
      finalTotal === 0
        ? 100
        : Math.round((finalCorrect / finalTotal) * 100);

    const finalWpm = Math.round(
      (finalCorrectCharacters / 5) / (elapsed / 60)
    );

    const result: TypingResult = {
      wpm: finalWpm,
      accuracy: finalAccuracy,
      errors: finalTotal - finalCorrect,
      rank: getPerformanceRank(finalAccuracy),
      completed,
    };

    onComplete?.(result);
  }

 
    useEffect(() => {
    if (!isActive || isFinished) return;

    const timer = setInterval(() => {
        setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
    }, [isActive, isFinished]);

    // Finish the typing challenge when the timer reaches zero
    useEffect(() => {
    if (isActive && timeLeft === 0 && !isFinished) {
        finishTyping(false, 0);
    }
    }, [timeLeft, isActive, isFinished]);


  function handleTyping(value: string) {
    if (isFinished || value.length > passage.length) return;

    if (!isActive && value.length > 0) {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }

    if (value.length > input.length) {
      const addedCharacters = value.slice(input.length);

      const correctCount = addedCharacters
        .split("")
        .filter(
          (char, index) => char === passage[input.length + index]
        ).length;

      keystrokesRef.current.total += addedCharacters.length;
      keystrokesRef.current.correct += correctCount;

      setTotalKeystrokes(keystrokesRef.current.total);
      setCorrectKeystrokes(keystrokesRef.current.correct);
    }

    setInput(value);

    if (value === passage) {
      finishTyping(true, timeLeft);
    }
  }

  function restart() {
    setInput("");
    setTimeLeft(duration);
    setIsActive(false);
    setIsFinished(false);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    keystrokesRef.current = { total: 0, correct: 0 };
    completionSentRef.current = false;
    startTimeRef.current = null;
    inputRef.current?.focus();
  }

  const rankColors: Record<string, string> = {
    S: "text-yellow-400",
    A: "text-green-400",
    B: "text-blue-400",
    C: "text-orange-400",
    D: "text-red-400",
  };

  return (
    <div className="bg-[#171522] border border-white/10 rounded-xl p-6 space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <p className="text-amber-400 text-sm tracking-widest">
            TYPING CHALLENGE
          </p>
          <h2 className="text-2xl font-bold mt-1">
            Prepare Your Attack
          </h2>
        </div>

        <button
          onClick={restart}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <RotateCcw size={16} />
          Restart
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Timer size={16} /> Time
          </div>
          <p className="text-2xl font-bold mt-2">{timeLeft}s</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Zap size={16} /> WPM
          </div>
          <p className="text-2xl font-bold mt-2">{wpm}</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Target size={16} /> Accuracy
          </div>
          <p className="text-2xl font-bold mt-2">{accuracy}%</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <AlertCircle size={16} /> Errors
          </div>
          <p className="text-2xl font-bold mt-2 text-red-400">{errors}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Passage Progress</span>
          <span className="text-amber-400">{progress}%</span>
        </div>

        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-gray-400 text-sm mb-3">
          Type the following passage:
        </p>

        <div className="bg-black/30 border border-white/10 rounded-lg p-5 text-lg leading-9 break-words">
          {passage.split("").map((char, index) => {
            let color = "text-gray-400";

            if (index < input.length) {
              color =
                input[index] === char
                  ? "text-green-400"
                  : "text-red-400 bg-red-500/20";
            }

            return (
              <span key={index} className={color}>
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {!isFinished && (
        <>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => handleTyping(event.target.value)}
            onPaste={(event) => event.preventDefault()}
            placeholder="Start typing here..."
            rows={4}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white outline-none focus:border-amber-500 resize-none"
          />

          <p className="text-gray-500 text-sm">
            The timer starts with your first character. Backspace is allowed,
            but previous mistakes remain in your error history.
          </p>
        </>
      )}

      {isFinished && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <Trophy className="text-amber-400" size={28} />
            <h3 className="text-xl font-bold text-amber-400">
              Performance Results
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Final WPM</p>
              <p className="text-2xl font-bold">{wpm}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">{accuracy}%</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-400">{errors}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Rank</p>
              <p className={`text-3xl font-black ${rankColors[rank]}`}>
                {rank}
              </p>
            </div>
          </div>

          <p className="text-gray-300 mb-4">
            {input === passage
              ? "You successfully completed the passage!"
              : "Time is up! You did not finish the passage."}
          </p>

          <button
            onClick={restart}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
