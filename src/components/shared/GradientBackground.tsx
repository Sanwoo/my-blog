"use client";

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
      {/* Top gradient wash — soft teal/blue atmosphere */}
      <div className="absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-[#e8f4f8]/80 via-[#f0f7fa]/40 to-transparent dark:from-[#0d2428]/60 dark:via-[#111714]/30 dark:to-transparent transition-colors duration-500" />
      {/* Left ambient blob */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-[#d4eeee]/30 dark:bg-[#0f3333]/20 blur-[100px] transition-colors duration-500" />
      {/* Right ambient blob */}
      <div className="absolute -top-12 right-0 w-[400px] h-[400px] rounded-full bg-[#dde8f0]/25 dark:bg-[#141e28]/20 blur-[100px] transition-colors duration-500" />
    </div>
  );
}
