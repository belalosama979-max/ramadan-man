import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SubmissionService } from '../services/submissionService';
import { QuestionService } from '../services/questionService';

// --- DYNAMIC MESSAGES ---
const MESSAGES = {
    upcoming: [
        "جهز نفسك… التحدي قادم 🔥",
        "راجع معلوماتك قبل ما يبدأ 😏",
        "اللي يستنى… يكسب 🎯",
        "لا تروح بعيد… العد التنازلي شغال ⏳",
        "هل أنت مستعد؟ 🚀"
    ],
    active: [
        "شايفك لا تغش 👀",
        "ركز… الجائزة تستاهل 😉",
        "لا تستعجل… فكر مرتين 🧠",
        "يا رجل… أخوي الصغير بحل السؤال 😏",
        "خذ نفس… وفكر زي الأبطال 🏆"
    ],
    ended: [
        "انتهى الوقت… نلتقي في الجولة القادمة 🏁",
        "يلا بطلع منك 😎",
        "اللي سبق لبق...",
        "حاول أسرع المرة الجاية 😉",
        "خيرها بغيرها 👋"
    ]
};

const getRandomMessage = (type) => {
    const msgs = MESSAGES[type];
    return msgs[Math.floor(Math.random() * msgs.length)];
};

// --- LOCALSTORAGE HELPERS ---
const getSubmittedKey = (questionId, userName) => `submitted_${questionId}_${userName?.trim().toLowerCase()}`;
const getResultSeenKey = (questionId, userName) => `resultSeen_${questionId}_${userName?.trim().toLowerCase()}`;

const QuestionPage = () => {
    const { user, activeQuestion: contextActiveQuestion } = useGame();
    const navigate = useNavigate();

    // Local State
    const [localQuestion, setLocalQuestion] = useState(null); // Can be upcoming or active sourced locally
    const [viewState, setViewState] = useState('loading'); // 'loading', 'upcoming', 'active', 'ended', 'none'
    
    const [timeLeft, setTimeLeft] = useState(0);
    const [dynamicMessage, setDynamicMessage] = useState("");

    // Form State
    const [answer, setAnswer] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState('idle'); // idle, submitting, submitted, error
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Feedback State (post-question)
    const [feedbackResult, setFeedbackResult] = useState(null); // 'correct', 'incorrect', 'none'
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Determines the question object to use (Context takes precedence if active, otherwise local)
    const effectiveQuestion = contextActiveQuestion || localQuestion;

    // 1. STATE MANAGEMENT & DATA FETCHING
    useEffect(() => {
        const determineState = async () => {
             // If we have an active question from Context, we are definitely ACTIVE
            if (contextActiveQuestion) {
                 setViewState('active');
                 setLocalQuestion(null); // Clear local if context takes over
                 return;
            }

            // If no context question, check schedule for UPCOMING, ACTIVE, or recently ENDED
            try {
                const schedule = await QuestionService.getSchedule();
                const now = new Date();
                
                // Find next upcoming question
                const nextQ = schedule.find(q => new Date(q.startTime) > now);
                
                // Find potential active question that Context missed (or during transition)
                const currentQ = schedule.find(q => new Date(q.startTime) <= now && new Date(q.endTime) > now);

                // Find most recently ended question (ended within the last 24h)
                const recentlyEndedQ = schedule
                    .filter(q => new Date(q.endTime) <= now && (now - new Date(q.endTime)) < 86400000)
                    .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

                if (currentQ) {
                    setLocalQuestion(currentQ);
                    setViewState('active');
                } else if (recentlyEndedQ && user) {
                    // Check if the user already saw the result for this ended question
                    const seenKey = getResultSeenKey(recentlyEndedQ.id, user);
                    const alreadySeen = localStorage.getItem(seenKey);
                    if (!alreadySeen) {
                        // Show feedback for the first time
                        setLocalQuestion(recentlyEndedQ);
                        setViewState('ended');
                    } else if (nextQ) {
                        setLocalQuestion(nextQ);
                        setViewState('upcoming');
                    } else {
                        setViewState('none');
                    }
                } else if (nextQ) {
                    setLocalQuestion(nextQ);
                    setViewState('upcoming');
                } else {
                    setViewState('none');
                }
            } catch (e) {
                console.error("Error fetching schedule:", e);
                setViewState('none');
            }
        };

        determineState();
        // Poll briefly to keep sync if needed, but the Countdown engine handles the main transition
    }, [contextActiveQuestion, user]);


    // 2. MESSAGE ROTATION
    useEffect(() => {
        if (viewState !== 'loading' && viewState !== 'none') {
            setDynamicMessage(getRandomMessage(viewState));
        }
    }, [viewState]);


    // 3. CHECK SUBMISSION STATUS (On Mount or Q Change)
    useEffect(() => {
        if (!user) {
            navigate('/name');
            return;
        }
        if (effectiveQuestion && viewState === 'active') {
            // Check localStorage first for instant restore
            const submittedKey = getSubmittedKey(effectiveQuestion.id, user);
            const localFlag = localStorage.getItem(submittedKey);
            if (localFlag) {
                setHasSubmitted(true);
                setSubmissionStatus('submitted');
                return;
            }
            // Fallback: check DB
            SubmissionService.hasUserAnswered(effectiveQuestion.id, user).then(submitted => {
                setHasSubmitted(submitted);
                if (submitted) {
                    setSubmissionStatus('submitted');
                    // Persist to localStorage so refresh doesn't break
                    localStorage.setItem(submittedKey, 'true');
                }
            });
        }
    }, [effectiveQuestion, user, navigate, viewState]);


    // 3.5 FETCH FEEDBACK WHEN ENDED
    useEffect(() => {
        if (viewState !== 'ended' || !effectiveQuestion || !user) return;

        // If already seen, skip (safety check — determineState should handle this)
        const seenKey = getResultSeenKey(effectiveQuestion.id, user);
        if (localStorage.getItem(seenKey)) {
            setViewState('none');
            return;
        }

        const fetchFeedback = async () => {
            setFeedbackLoading(true);
            try {
                const submission = await SubmissionService.getUserSubmission(effectiveQuestion.id, user);
                if (!submission) {
                    setFeedbackResult('none');
                } else if (submission.isCorrect) {
                    setFeedbackResult('correct');
                } else {
                    setFeedbackResult('incorrect');
                }
                // Mark as seen so next refresh goes to 'none'
                localStorage.setItem(seenKey, 'true');
            } catch (err) {
                console.error('Error fetching feedback:', err);
                setFeedbackResult('none');
                localStorage.setItem(seenKey, 'true');
            } finally {
                setFeedbackLoading(false);
            }
        };

        fetchFeedback();
    }, [viewState, effectiveQuestion, user]);


    // 4. PREMIUM COUNTDOWN ENGINE
    useEffect(() => {
        if (!effectiveQuestion || (viewState !== 'upcoming' && viewState !== 'active')) return;

        const targetDate = viewState === 'upcoming' 
            ? new Date(effectiveQuestion.startTime) 
            : new Date(effectiveQuestion.endTime);

        const timer = setInterval(() => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeft(0);

                // Auto-transition logic
                if (viewState === 'upcoming') {
                    setViewState('active');
                    // Force refresh to ensure strictly consistent state logic
                    // logic handled by next render cycle picking up 'active' viewState
                } else if (viewState === 'active') {
                    setViewState('ended');
                }
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        // Initial set
        const now = new Date();
        setTimeLeft(Math.max(0, targetDate - now));

        return () => clearInterval(timer);
    }, [effectiveQuestion, viewState]);

    // 5. CINEMATIC REVEAL EFFECT
    const [isRevealing, setIsRevealing] = useState(false);

    useEffect(() => {
        if (viewState === 'active' && !hasSubmitted) {
            setIsRevealing(true);
            const timer = setTimeout(() => setIsRevealing(false), 600);
            return () => clearTimeout(timer);
        }
    }, [viewState, hasSubmitted]);


    // Helper: Format Time
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Helper: Countdown Color Logic
    const getCountdownColor = (ms) => {
        const seconds = ms / 1000;
        if (seconds > 60) return "text-green-500";
        if (seconds > 10) return "text-amber-500";
        return "text-red-500 animate-pulse scale-110"; 
    };


    // 5. SUBMISSION HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim() || !effectiveQuestion) return;

        setSubmissionStatus('submitting');

        try {
            await SubmissionService.submit({
                user,
                question: effectiveQuestion,
                answer
            });
            setSubmissionStatus('submitted');
            setHasSubmitted(true);
            setSubmissionMessage('تم استلام إجابتك بنجاح! بالتوفيق.');
            // Persist to localStorage
            localStorage.setItem(getSubmittedKey(effectiveQuestion.id, user), 'true');
        } catch (error) {
            setSubmissionStatus('error');
            setSubmissionMessage(error.message);
            if (error.message.includes('مسبقاً')) {
                setTimeout(() => {
                    setSubmissionStatus('submitted');
                    setHasSubmitted(true);
                }, 1500);
            } else {
                 setTimeout(() => setSubmissionStatus('idle'), 2000);
            }
        }
    };


    // --- RENDERERS ---

    if (!effectiveQuestion || viewState === 'none' || viewState === 'loading') {
        return (
            <div className="w-full max-w-2xl animate-fade-in my-12 text-center">
                 <div className="bg-white p-12 rounded-3xl shadow-sm border border-primary/5 backdrop-blur-sm">
                    <div className="mb-6 opacity-80 animate-bounce">
                        <span className="text-6xl">🕌</span>
                    </div>
                    <h2 className="text-3xl font-bold text-primary-dark mb-4 tracking-tight">لا يوجد تحدي نشط حالياً</h2>
                    <p className="text-lg text-primary/70 font-medium">ترقبوا السؤال القادم!</p>
                </div>
            </div>
        );
    }

    // UPCOMING STATE UI
    if (viewState === 'upcoming') {
        return (
            <div className="w-full max-w-2xl animate-slide-up text-center">
                <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 overflow-hidden border border-primary/10 p-10">
                   
                   <div className="mb-8 relative">
                       <span className="text-sm font-bold bg-primary/10 text-primary px-4 py-1 rounded-full uppercase tracking-widest">
                           قريباً
                       </span>
                   </div>

                   {/* Dynamic Message */}
                   <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-8 animate-fade-in h-16 flex items-center justify-center">
                       "{dynamicMessage}"
                   </h3>

                   {/* Digital Countdown */}
                   <div className="mb-10 relative">
                       <div className={`text-6xl md:text-8xl font-black font-mono tracking-tighter transition-all duration-300 ${getCountdownColor(timeLeft)}`}>
                           {formatTime(timeLeft)}
                       </div>
                       <p className="text-gray-400 text-sm mt-2 font-medium">ساعات : دقائق : ثواني</p>
                   </div>
                   
                    {/* Question (Blurry Preview) */}
                   <div className="opacity-50 blur-sm select-none pointer-events-none grayscale transition-all duration-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-400">سؤال التحدي</h2>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                   </div>

                </div>
            </div>
        );
    }

    // ACTIVE & ENDED STATE UI
    const isEnded = viewState === 'ended';

    return (
        <div className="w-full max-w-2xl animate-slide-up text-right relative">
             {/* Flash Overlay */}
             <div 
                className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-500 ease-out ${isRevealing ? 'opacity-100' : 'opacity-0'}`}
            ></div>

            <div className={`bg-white rounded-3xl shadow-xl shadow-primary/5 overflow-hidden border border-primary/10 transition-all duration-500 ease-out ${isRevealing ? 'scale-95 shadow-2xl' : 'scale-100'}`}>
                
                {/* Header */}
                <div 
                    className="p-8 text-white text-center relative overflow-hidden"
                    style={{ background: 'radial-gradient(circle at top right, #14532D, #052E1B)' }}
                >
                    <div className="absolute inset-0 opacity-10"></div>
                    
                    {/* Active Timer Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full mb-4 text-sm font-bold tracking-wider ${isEnded ? 'bg-red-500/20 text-red-100' : 'bg-white/20 text-yellow-300'}`}>
                        <span>{isEnded ? 'انتهى الوقت' : 'الوقت المتبقي'}</span>
                        <span className="font-mono text-lg" dir="ltr">{isEnded ? '00:00:00' : formatTime(timeLeft)}</span>
                    </div>

                    <h3 className="text-lg font-medium opacity-90 relative z-10 text-primary-light mb-2">سؤال اليوم</h3>
                    <h1 className="text-2xl md:text-4xl font-bold leading-relaxed relative z-10 drop-shadow-md">
                        {effectiveQuestion.text}
                    </h1>

                    {/* Dynamic Message for Active/Ended */}
                    <p className="mt-4 text-white/80 text-sm font-medium animate-pulse relative z-10">
                        "{dynamicMessage}"
                    </p>
                </div>

                <div className="p-8">
                    {isEnded ? (
                        /* POST-QUESTION FEEDBACK CARD */
                        <div className="text-center animate-fade-in py-8">
                            {feedbackLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-gray-500 font-medium">جاري التحقق...</p>
                                </div>
                            ) : feedbackResult === 'correct' ? (
                                <div className="p-8 rounded-2xl border-2 border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-2">إجابتك صحيحة ✅</h3>
                                    <p className="text-green-600 font-medium">أحسنت يا {user}! بارك الله فيك.</p>
                                </div>
                            ) : feedbackResult === 'incorrect' ? (
                                <div className="p-8 rounded-2xl border-2 border-red-200" style={{ background: 'linear-gradient(135deg, #fef2f2, #fecaca)' }}>
                                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-200">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-red-800 mb-2">إجابتك غير صحيحة ❌</h3>
                                    <p className="text-red-600 font-medium">لا بأس يا {user}، حاول في السؤال القادم!</p>
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl border-2 border-gray-200" style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)' }}>
                                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gray-200">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-600 mb-2">لم تقم بإرسال إجابة</h3>
                                    <p className="text-gray-500 font-medium">حظاً موفقاً في السؤال القادم!</p>
                                </div>
                            )}
                        </div>
                    ) : hasSubmitted ? (
                        <div className="text-center animate-fade-in py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">شكراً {user}!</h3>
                            <p className="text-gray-600">تم تسجيل إجابتك. سيتم الإعلان عن الفائز قريباً.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <label className="block text-primary-dark font-bold text-lg mb-4">إجابتك:</label>
                                
                                {effectiveQuestion.type === 'multiple_choice' && effectiveQuestion.options ? (
                                    <div className="space-y-3">
                                        {effectiveQuestion.options.map((option, idx) => (
                                            <label 
                                                key={idx} 
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                    answer === option 
                                                        ? 'border-primary bg-primary/5 shadow-md' 
                                                        : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="mcq-answer"
                                                    value={option}
                                                    checked={answer === option}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    className="w-5 h-5 text-primary focus:ring-primary/50 accent-primary"
                                                    disabled={submissionStatus === 'submitting'}
                                                />
                                                <span className="text-lg font-medium text-gray-800">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-lg resize-none shadow-inner"
                                        rows="4"
                                        placeholder="اكتب الإجابة هنا..."
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        disabled={submissionStatus === 'submitting'}
                                    ></textarea>
                                )}
                            </div>

                            {submissionStatus === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                                    🚫 {submissionMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submissionStatus === 'submitting' || !answer.trim()}
                                className={`w-full py-5 text-xl font-bold rounded-2xl transition-all duration-200 shadow-md 
                                    ${submissionStatus === 'submitting' || !answer.trim()
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                        : 'bg-[#14532D] hover:bg-[#0F3D2E] text-white hover:-translate-y-1 hover:shadow-lg'}`}
                            >
                                {submissionStatus === 'submitting' ? 'جاري الإرسال...' : 'إرسال الإجابة'}
                            </button>
                        </form>
                    )}
                </div>
                
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <span>
                        {isEnded 
                            ? `انتهى في: ${new Date(effectiveQuestion.endTime).toLocaleTimeString('ar-SA')}`
                            : `يغلق في: ${new Date(effectiveQuestion.endTime).toLocaleTimeString('ar-SA')}`
                        }
                    </span>
                    <span>بالتوفيق!</span>
                </div>
            </div>
        </div>
    );
};

export default QuestionPage;
