import React, { createContext, useState, useEffect, useContext } from 'react';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import { SubmissionService } from '../services/submissionService';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = StorageService.get('dal_user');
    if (savedUser) {
      setUser(savedUser);
    }
    
    // Check for active question
    const checkActiveQuestion = async () => {
        try {
            const question = await QuestionService.getActive();
            setActiveQuestion(question);
        } catch (error) {
            console.error("Failed to check active question:", error);
        }
    };

    checkActiveQuestion();
    const interval = setInterval(checkActiveQuestion, 60000); // Check every minute

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  const login = (name) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    setUser(trimmedName);
    StorageService.set('dal_user', trimmedName);
  };

  const logout = () => {
    setUser(null);
    StorageService.remove('dal_user');
  };

  const submitAnswer = async (answer) => {
    if (!user || !activeQuestion) return;

    try {
        const result = await SubmissionService.submit({
            user,
            question: activeQuestion,
            answer
        });
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
  };

  return (
    <GameContext.Provider value={{
      user,
      login,
      logout,
      activeQuestion,
      submitAnswer,
      loading
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
