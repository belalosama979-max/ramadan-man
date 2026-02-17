import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SubmissionService } from '../services/submissionService';
import { useCountdown } from '../hooks/useCountdown';

const QuestionPage = () => {
  const { user, activeQuestion, submitAnswer } = useGame();
  const navigate = useNavigate();
  
  // Timer Hook
  const { timeLeft, isExpired, formattedTime } = useCountdown(activeQuestion?.endTime || new Date());

  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('loading'); // loading, active, submitted, expired, error
  const [message, setMessage] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
        navigate('/name');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!activeQuestion) {
        setStatus('no-active');
        return;
    }

    // Check if user already submitted for this question
    const checkSubmission = async () => {
        const submitted = await SubmissionService.hasUserAnswered(activeQuestion.id, user);
        setHasSubmitted(submitted);
        setStatus(submitted ? 'submitted' : 'active');
    };

    checkSubmission();
  }, [activeQuestion, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    if (isExpired) {
        setStatus('error');
        setMessage('عذراً، انتهى وقت الإجابة على هذا السؤال.');
        return;
    }

    setStatus('submitting');
    
    try {
        await SubmissionService.submit({
            user,
            question: activeQuestion,
            answer
        });
        setStatus('submitted');
        setHasSubmitted(true);
        setMessage('تم استلام إجابتك بنجاح! بالتوفيق.');
    } catch (error) {
        setStatus('error');
        setMessage(error.message);
        // If error is duplicate, set status to submitted
        if (error.message.includes('مسبقاً')) {
            setTimeout(() => {
                setStatus('submitted');
                setHasSubmitted(true);
            }, 1500);
        } else {
             // Reset to active after error so they can try again if it's a diff error
             setTimeout(() => setStatus('active'), 2000);
        }
    }
  };

  if (!activeQuestion) {
    return (
        <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-primary/5 animate-fade-in my-12 backdrop-blur-sm">
            <div className="mb-6 opacity-80">
                <img src="/dal-logo.png" alt="Logo" className="h-20 mx-auto grayscale opacity-50" />
            </div>
            <h2 className="text-3xl font-bold text-primary-dark mb-4 tracking-tight">لا يوجد سؤال نشط حالياً</h2>
            <p className="text-lg text-primary/70 font-medium">ترقبوا السؤال القادم في الأوقات المعلنة للفوازير.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl animate-slide-up text-right">
        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 overflow-hidden border border-primary/10">
            <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/islamic-pattern.png')] mix-blend-overlay"></div>
                
                {/* Timer Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full mb-4 text-sm font-bold tracking-wider ${isExpired ? 'bg-red-500/20 text-red-100' : 'bg-white/20 text-yellow-300'}`}>
                    <span>{isExpired ? 'انتهى الوقت' : 'الوقت المتبقي'}</span>
                    <span className="font-mono text-lg" dir="ltr">{isExpired ? '00:00:00' : formattedTime}</span>
                </div>

                <h3 className="text-lg font-medium opacity-90 relative z-10 text-primary-light mb-2">سؤال اليوم</h3>
                <h1 className="text-2xl md:text-4xl font-bold leading-relaxed relative z-10 drop-shadow-md">
                    {activeQuestion.text}
                </h1>
            </div>

            <div className="p-8">
                {hasSubmitted ? (
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
                            <textarea
                                className="w-full p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-lg resize-none shadow-inner"
                                rows="4"
                                placeholder="اكتب الإجابة هنا..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={status === 'submitting'}
                            ></textarea>
                        </div>

                        {status === 'error' && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                                🚫 {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'submitting' || !answer.trim() || isExpired}
                            className={`w-full py-5 text-xl font-bold rounded-2xl transition-all duration-200 shadow-md 
                                ${status === 'submitting' || !answer.trim() || isExpired
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                    : 'bg-[#14532D] hover:bg-[#0F3D2E] text-white hover:-translate-y-1 hover:shadow-lg'}`}
                        >
                            {isExpired ? 'انتهى الوقت' : (status === 'submitting' ? 'جاري الإرسال...' : 'إرسال الإجابة')}
                        </button>
                    </form>
                )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <span>المشاركات مغلقة: {new Date(activeQuestion.endTime).toLocaleTimeString('ar-SA')}</span>
                <span>حظاً موفقاً!</span>
            </div>
        </div>
    </div>
  );
};

export default QuestionPage;
