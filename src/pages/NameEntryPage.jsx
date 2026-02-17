import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SubmissionService } from '../services/submissionService';

const NameEntryPage = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { user, login, activeQuestion } = useGame();
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
    
    // Check if name already submitted for the ACTIVE question
    if (activeQuestion) {
        const hasSubmit = await SubmissionService.hasUserAnswered(activeQuestion.id, name);
        if (hasSubmit) {
            setError('هذا الاسم شارك بالفعل في هذا السؤال. يرجى استخدام اسم آخر أو انتظار السؤال القادم.');
            return;
        }
    }

    login(name);
    navigate('/question');
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
            />
            {error && <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">⚠️ {error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-dark text-white text-lg font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5"
          >
            دخول المسابقة
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameEntryPage;
