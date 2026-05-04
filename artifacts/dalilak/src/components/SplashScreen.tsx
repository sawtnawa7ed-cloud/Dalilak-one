import { useEffect, useState } from "react";

export function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 100));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a1400 0%, #080808 70%)" }}>
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-[#FFC107] pulse-ring" />
        <div className="absolute inset-3 rounded-full border border-[#FFC107]/30 pulse-ring-2" />
        <div className="absolute inset-0 flex items-center justify-center text-5xl">♿</div>
      </div>

      <h1 className="text-4xl font-black text-[#FFC107] tracking-widest mb-2">دليلك</h1>
      <p className="text-base text-[#FFC107]/70 font-semibold mb-1 text-center px-6">دليلك نحو مكان يستقبلك بكرامة</p>
      <p className="text-xs text-[#666] mb-10">إمكانية الوصول في لبنان</p>

      <div className="w-40 h-1 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #FFC107, #FF8F00)",
          }}
        />
      </div>
    </div>
  );
}
