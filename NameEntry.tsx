import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUserName } from "@/lib/store";

const NameEntry = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUserName(name.trim());
      navigate("/question");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(circle at top right, #14532D, #052E1B)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="rounded-xl border border-border bg-card p-8 gold-border-glow">
          <h2 className="text-3xl font-bold text-primary text-center mb-2">أهلاً بك</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            أدخل اسمك للمشاركة في فوازير رمضان
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك الكريم..."
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
                         text-center text-lg"
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full rounded-lg bg-primary text-primary-foreground font-bold py-3 text-lg
                         hover:bg-gold-light transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
                         gold-border-glow"
            >
              دخول
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NameEntry;
