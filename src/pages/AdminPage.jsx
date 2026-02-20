import React, { useState, useEffect, useMemo } from 'react';
import { QuestionService } from '../services/questionService';
import { SubmissionService } from '../services/submissionService';
import { GameSettingsService } from '../services/gameSettingsService';
import { calculateWinner, formatDate } from '../utils/winnerUtils';
import { triggerConfetti } from '../utils/confettiUtils';

const AdminPage = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', correctAnswer: '', startTime: '', endTime: '' });
    const [showWinner, setShowWinner] = useState(false);
    const [winnerToggleLoading, setWinnerToggleLoading] = useState(false);
    
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const auth = sessionStorage.getItem('dal_admin_auth');
        if (auth === 'true') setIsAuthenticated(true);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'dal123') {
            setIsAuthenticated(true);
            sessionStorage.setItem('dal_admin_auth', 'true');
            setAuthError('');
        } else {
            setAuthError('كلمة المرور غير صحيحة');
        }
    };
    
    // Refresh data
    const refreshData = async () => {
        try {
            const loadedQuestions = await QuestionService.getAll();
            setQuestions(loadedQuestions);
            
            // Auto-select active questionnaire
            const now = new Date();
            const active = loadedQuestions.find(q => {
               const start = new Date(q.startTime);
               const end = new Date(q.endTime);
               return now >= start && now <= end;
            });

            if (active) {
                setSelectedQuestionId(active.id);
            } else if (loadedQuestions.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(loadedQuestions[0].id);
            }

            // Fetch game settings
            const settings = await GameSettingsService.getSettings();
            setShowWinner(settings.showWinner);
        } catch (error) {
            console.error("Failed to load questions:", error);
        }
    };

    // Initial Load
    useEffect(() => {
        refreshData();
    }, []);

    // Fetch submissions when selected question changes
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (selectedQuestionId) {
                try {
                    const loadedSubmissions = await SubmissionService.getByQuestionId(selectedQuestionId);
                    setSubmissions(loadedSubmissions);
                } catch (error) {
                    console.error("Failed to load submissions:", error);
                }
            } else {
                setSubmissions([]);
            }
        };
        fetchSubmissions();
    }, [selectedQuestionId]);

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        
        try {
            // Strictly use ISO string from local input (browser handles local -> UTC conversion)
            const questionData = {
                ...newQuestion,
                startTime: new Date(newQuestion.startTime).toISOString(),
                endTime: new Date(newQuestion.endTime).toISOString()
            };
            
            await QuestionService.add(questionData);
            
            // Auto-reset show_winner for the new question
            await GameSettingsService.setCurrentQuestion(null); // Will be set when question ends
            setShowWinner(false);
            
            setNewQuestion({ text: '', correctAnswer: '', startTime: '', endTime: '' });
            await refreshData();
            alert('تم إضافة السؤال بنجاح');
        } catch (error) {
            alert(error.message);
        }
    };

    const activeQuestion = questions.find(q => q.id === selectedQuestionId);

    // Derived stats
    const totalParticipants = submissions.length;
    
    // Logic: Winner is only calculated if current time >= endTime
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isQuestionActive = activeQuestion ? new Date(activeQuestion.endTime) > currentTime : false;
    
    // Only calculate winner if question is NOT active (expired)
    const winner = useMemo(() => {
        if (!activeQuestion || isQuestionActive) return null;
        return calculateWinner(submissions);
    }, [submissions, activeQuestion, isQuestionActive]);

    // Trigger confetti when winner is revealed
    useEffect(() => {
        if (winner) {
            triggerConfetti();
        }
    }, [winner]);


    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-fade-in p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-primary/5 border border-primary/10 w-full max-w-md text-center backdrop-blur-sm">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                        🔒
                    </div>
                    <h2 className="text-2xl font-bold text-primary-dark mb-2">تسجيل دخول المسؤول</h2>
                    <p className="text-gray-500 mb-6 text-sm">يرجى إدخال كلمة المرور للمتابعة</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="كلمة المرور"
                            className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center text-lg"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        {authError && <p className="text-red-500 text-sm font-bold bg-red-50 py-2 rounded-lg">{authError}</p>}
                        <button 
                            type="submit" 
                            className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20"
                        >
                            دخول
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl animate-fade-in pb-16 px-4">
            <div className="flex justify-between items-center border-b border-primary/10 pb-6 mb-10">
                <h1 className="text-5xl font-extrabold text-white drop-shadow-lg tracking-tight shadow-black/10">لوحة التحكم</h1>
                <button 
                    onClick={() => {
                        setIsAuthenticated(false);
                        sessionStorage.removeItem('dal_admin_auth');
                    }}
                    className="text-red-100 hover:text-white font-bold text-sm bg-red-500/20 px-6 py-3 rounded-xl hover:bg-red-500/40 transition border border-red-500/20 backdrop-blur-sm"
                >
                    تسجيل الخروج
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* 1. Add Question Form */}
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-primary/5 border border-primary/10 h-fit sticky top-6">
                    <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">+</span>
                         إضافة سؤال
                    </h2>
                    <form onSubmit={handleAddQuestion} className="space-y-5">
                        
                        {/* Question Type Selector */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">نوع السؤال</label>
                            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewQuestion(prev => ({ ...prev, type: 'text', options: null, correctAnswer: '' }));
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newQuestion.type === 'text' || !newQuestion.type ? 'bg-white shadow-sm text-primary border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    نصي
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewQuestion(prev => ({ ...prev, type: 'multiple_choice', options: ['', ''], correctAnswer: '' }));
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newQuestion.type === 'multiple_choice' ? 'bg-white shadow-sm text-primary border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    خيارات متعددة
                                </button>
                            </div>
                        </div>

                        <textarea
                            placeholder="نص السؤال"
                            className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            value={newQuestion.text}
                            onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                            required
                        />

                        {/* Rendering based on Type */}
                        {(newQuestion.type === 'multiple_choice') ? (
                            <div className="space-y-3 animate-fade-in">
                                <label className="block text-sm font-bold text-gray-700">الخيارات</label>
                                {newQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`الخيار ${idx + 1}`}
                                            className="flex-1 p-3 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                                            value={opt}
                                            onChange={e => {
                                                const newOptions = [...newQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setNewQuestion({ ...newQuestion, options: newOptions });
                                            }}
                                            required
                                        />
                                        {newQuestion.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newOptions = newQuestion.options.filter((_, i) => i !== idx);
                                                    setNewQuestion(prev => ({
                                                        ...prev,
                                                        options: newOptions,
                                                        correctAnswer: prev.correctAnswer === opt ? '' : prev.correctAnswer
                                                    }));
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setNewQuestion(prev => ({ ...prev, options: [...prev.options, ''] }))}
                                    className="text-sm text-primary font-bold hover:underline px-2"
                                >
                                    + إضافة خيار آخر
                                </button>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الإجابة الصحيحة</label>
                                    <select
                                        className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium bg-white"
                                        value={newQuestion.correctAnswer}
                                        onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                                        required
                                    >
                                        <option value="" disabled>اختر الإجابة الصحيحة</option>
                                        {newQuestion.options.filter(o => o.trim().length > 0).map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <input
                                type="text"
                                placeholder="الإجابة الصحيحة"
                                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                value={newQuestion.correctAnswer}
                                onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                                required
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">وقت البدء</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-primary transition-colors text-sm"
                                    value={newQuestion.startTime}
                                    onChange={e => setNewQuestion({...newQuestion, startTime: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">وقت الانتهاء</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-primary transition-colors text-sm"
                                    value={newQuestion.endTime}
                                    onChange={e => setNewQuestion({...newQuestion, endTime: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#14532D] hover:bg-[#0F3D2E] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={newQuestion.type === 'multiple_choice' && (newQuestion.options.length < 2 || !newQuestion.correctAnswer)}
                        >
                            حفظ السؤال
                        </button>
                    </form>
                </div>

                {/* 2. Questions List & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Question Selector */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700">السؤال المختار:</span>
                            <select 
                                className="p-2 border rounded-lg bg-gray-50 max-w-xs"
                                value={selectedQuestionId || ''}
                                onChange={(e) => setSelectedQuestionId(e.target.value)}
                            >
                                {questions.map(q => (
                                    <option key={q.id} value={q.id}>{q.text.substring(0, 50)}...</option>
                                ))}
                            </select>
                         </div>
                         <div className="flex items-center gap-3">
                             {/* Winner Board Toggle */}
                             {!isQuestionActive && winner && (
                                 <button
                                     onClick={async () => {
                                         setWinnerToggleLoading(true);
                                         try {
                                             // Set current_question_id so user side knows which question this winner is for
                                             if (!showWinner) {
                                                 await GameSettingsService.setCurrentQuestion(selectedQuestionId);
                                             }
                                             const newValue = await GameSettingsService.toggleShowWinner(showWinner);
                                             setShowWinner(newValue);
                                         } catch (e) {
                                             console.error('Error toggling winner:', e);
                                         } finally {
                                             setWinnerToggleLoading(false);
                                         }
                                     }}
                                     disabled={winnerToggleLoading}
                                     className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                         showWinner
                                             ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                             : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                     } ${winnerToggleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                     {winnerToggleLoading ? '...' : showWinner ? 'إخفاء لوحة الفائز' : 'عرض لوحة الفائز'}
                                 </button>
                             )}
                             <button onClick={refreshData} className="text-primary hover:text-primary-dark font-medium text-sm underline">تحديث البيانات ⟳</button>
                         </div>
                    </div>

                    {selectedQuestionId && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
                                <h4 className="text-blue-800 font-bold mb-2">المشاركين</h4>
                                <p className="text-4xl font-extrabold text-blue-600">{totalParticipants}</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
                                <h4 className="text-green-800 font-bold mb-2">الإجابات الصحيحة</h4>
                                <p className="text-4xl font-extrabold text-green-600">{submissions.filter(s => s.isCorrect).length}</p>
                            </div>
                            
                            {/* Winner Card */}
                            <div className={`p-8 rounded-3xl border-2 text-center transition-all duration-500 shadow-lg ${winner ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8860B] border-[#FCD34D] text-white shadow-yellow-900/20' : 'bg-white border-gray-100'}`}>
                                <h4 className={`${winner ? 'text-white/90' : 'text-gray-400'} text-sm font-bold uppercase tracking-widest mb-4`}>
                                    فائز اليوم
                                </h4>
                                {winner ? (
                                    <div className="animate-slide-up flex flex-col items-center">
                                        <div className="text-5xl mb-3 drop-shadow-md filter">
                                            🏆
                                        </div>
                                        <p className="text-3xl font-extrabold text-white drop-shadow-sm mb-1">{winner.name}</p>
                                        <div className="bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm mt-2">
                                            <p className="text-xs text-white/80 font-mono tracking-wider">{formatDate(winner.submittedAt)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center min-h-[100px]">
                                        {isQuestionActive ? (
                                            <>
                                                <span className="text-2xl mb-2">⏳</span>
                                                <p className="text-primary font-bold">السؤال لا يزال نشطاً</p>
                                                <p className="text-xs text-gray-400 mt-1">سيتم إعلان الفائز بعد انتهاء الوقت</p>
                                                
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('هل أنت متأكد من إنهاء الفعالية الآن؟ سيتم إغلاق باب الإجابات فوراً.')) {
                                                            try {
                                                                await QuestionService.forceEnd(activeQuestion.id);
                                                                await refreshData();
                                                            } catch (e) {
                                                                alert(e.message);
                                                            }
                                                        }
                                                    }}
                                                    className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                                                >
                                                    إنهاء السؤال الآن
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic">بانتظار الإجابات...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Participants Table */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right bg-white">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="p-5 text-sm font-bold text-primary-dark">الاسم</th>
                                        <th className="p-5 text-sm font-bold text-primary-dark">الإجابة</th>
                                        <th className="p-5 text-sm font-bold text-primary-dark">الحالة</th>
                                        <th className="p-5 text-sm font-bold text-primary-dark">التوقيت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400 font-medium">لا توجد مشاركات لهذا السؤال</td>
                                        </tr>
                                    ) : (
                                        submissions.sort((a,b) => new Date(a.submittedAt) - new Date(b.submittedAt)).map((sub) => (
                                            <tr key={sub.id} className={`hover:bg-gray-50/80 transition-colors ${winner && winner.id === sub.id ? 'bg-amber-50/60' : ''}`}>
                                                <td className="p-5 font-bold text-gray-800">
                                                    {sub.name}
                                                    {winner && winner.id === sub.id && <span className="mr-3 text-xs bg-accent text-white px-2.5 py-1 rounded-full shadow-sm">👑 فائز</span>}
                                                </td>
                                                <td className="p-5 text-gray-600 font-medium">{sub.answer}</td>
                                                <td className="p-5">
                                                    {isQuestionActive ? (
                                                        <span className="text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold">مخفي 🔒</span>
                                                    ) : (
                                                        sub.isCorrect ? 
                                                            <span className="text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-xs font-bold">صحيحة ✅</span> 
                                                            : <span className="text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-bold">خاطئة ❌</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-gray-400 text-sm font-mono" dir="ltr">
                                                    {new Date(sub.submittedAt).toLocaleTimeString('en-US')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
