import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveQuestion, getUserName, submitAnswer, hasUserAnswered } from "@/lib/store";

const Question = () => {
  const navigate = useNavigate();
  const userName = getUserName();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const activeQuestion = getActiveQuestion();

  useEffect(() => {
    if (!userName) {
      navigate("/enter");
      return;
    }
    if (activeQuestion && hasUserAnswered(activeQuestion.id, userName)) {
      setAlreadyAnswered(true);
    }
  }, [userName, activeQuestion, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !activeQuestion || !userName) return;
    submitAnswer(activeQuestion.id, userName, answer.trim());
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(circle at top right, #14532D, #052E1B)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">مرحباً، {userName}</p>
          <h1 className="text-2xl font-bold text-primary">فزورة اليوم</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 gold-border-glow">
          {!activeQuestion ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🕌</div>
              <p className="text-xl font-semibold text-foreground mb-2">السؤال غير متاح حالياً</p>
              <p className="text-muted-foreground text-sm">ترقب السؤال القادم!</p>
            </div>
          ) : submitted || alreadyAnswered ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-xl font-semibold text-primary mb-2">تم إرسال إجابتك</p>
              <p className="text-muted-foreground text-sm">بالتوفيق! سيتم الإعلان عن الفائز قريباً</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-foreground text-center mb-6 leading-relaxed">
                {activeQuestion.text}
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="اكتب إجابتك هنا..."
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
                             text-center text-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="w-full rounded-lg bg-primary text-primary-foreground font-bold py-3 text-lg
                             hover:bg-gold-light transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
                             gold-border-glow"
                >
                  إرسال
                </button>
              </form>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 text-muted-foreground text-sm hover:text-primary transition-colors block mx-auto"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
};

export default Question;
