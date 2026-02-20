import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SubmissionService } from '../services/submissionService';
import { SessionService } from '../services/sessionService';

const NameEntryPage = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { user, login, activeQuestion, sessionId } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
        navigate('/question');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('الرجاء إدخال الاسم للمتابعة');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // 1. Check if name is active on another device
      const isActive = await SessionService.isNameActive(name, sessionId);
      if (isActive) {
        setError('هذا الاسم مستخدم حالياً على جهاز آخر');
        setIsChecking(false);
        return;
      }

      // 2. Check if name already submitted for the ACTIVE question
      if (activeQuestion) {
        const hasSubmit = await SubmissionService.hasUserAnswered(activeQuestion.id, name);
        if (hasSubmit) {
          setError('هذا الاسم شارك بالفعل في هذا السؤال. يرجى استخدام اسم آخر أو انتظار السؤال القادم.');
          setIsChecking(false);
          return;
        }
      }

      // 3. Generate session ID and register
      const newSessionId = crypto.randomUUID();
      await SessionService.registerSession(name, newSessionId);

      // 4. Login with session
      login(name, newSessionId);
      navigate('/question');
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-10 border border-primary/10 relative overflow-hidden backdrop-blur-sm">
        {/* Decorative header */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-light via-primary to-primary-dark"></div>

        <h2 className="text-3xl font-bold text-center text-primary-dark mb-8 tracking-tight">
          تسجيل الدخول
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <p className="text-gray-600 mb-8 leading-relaxed">
                مرحباً بك في مسابقة فوازير رمضان! <br/>
                الرجاء إدخال اسمك للبدء في المشاركة.
            </p>
            <input
              type="text"
              id="name"
              className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center text-lg placeholder:text-gray-400"
              placeholder="الاسم الثلاثي"
              value={name}
              onChange={(e) => {
                  setName(e.target.value);
                  setError('');
              }}
              disabled={isChecking}
            />
            {error && <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">⚠️ {error}</p>}
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className={`w-full py-4 px-6 text-white text-lg font-bold rounded-xl transition-all duration-300 transform
              ${isChecking 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5'
              }`}
          >
            {isChecking ? 'جاري التحقق...' : 'دخول المسابقة'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameEntryPage;
