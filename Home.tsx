import { useNavigate } from "react-router-dom";
import dalLogo from "@/assets/dal-logo-hd.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at top right, #14532D, #052E1B)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Crescent decoration */}
        <img
           src={dalLogo}
           alt="شعار نادي دال"
           className="w-36 h-36 object-contain animate-glow-pulse mb-2 rounded-2xl"
         />

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black text-primary text-gold-glow">
          رمضان دال
        </h1>

        <p className="text-xl md:text-2xl font-semibold text-accent-foreground/80">
          فوازير رمضان
        </p>

        <p className="text-muted-foreground text-sm max-w-md">
          نادي دال يقدم لكم تحدي رمضاني يومي — أجب بسرعة وصحة لتكون فائز اليوم!
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/enter")}
          className="mt-6 px-10 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg
                     hover:bg-gold-light transition-all duration-300
                     gold-border-glow hover:scale-105 active:scale-95"
        >
          ابدأ الآن
        </button>

        {/* Footer badge */}
        <p className="mt-12 text-muted-foreground text-xs">
          نادي دال — جامعة الحسين التقنية
        </p>
      </div>
    </div>
  );
};

export default Home;
