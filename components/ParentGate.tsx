"use client";

import { useState } from "react";

function randomOperand() {
  return Math.floor(Math.random() * 6) + 2; // 2-7
}

export default function ParentGate({
  onApprove,
  triggerLabel,
  triggerClassName,
}: {
  onApprove: () => void;
  triggerLabel: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(randomOperand);
  const [b, setB] = useState(randomOperand);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);

  function openGate() {
    setA(randomOperand());
    setB(randomOperand());
    setAnswer("");
    setError(false);
    setOpen(true);
  }

  function submit() {
    if (Number(answer) === a + b) {
      setOpen(false);
      onApprove();
    } else {
      setError(true);
    }
  }

  return (
    <>
      <button type="button" onClick={openGate} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm text-center space-y-4 animate-bounce-in">
            <p className="text-sm font-semibold text-purple-500 uppercase tracking-wide">
              Grown-ups only
            </p>
            <p className="text-xl font-bold text-purple-900">
              What is {a} + {b}?
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError(false);
              }}
              autoFocus
              className="w-full text-center text-2xl border-4 border-amber-200 rounded-xl py-2 focus:outline-none focus:border-amber-400"
            />
            {error ? <p className="text-red-500 text-sm font-medium">Not quite, try again!</p> : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 py-3 rounded-xl bg-amber-400 font-semibold text-purple-900"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
