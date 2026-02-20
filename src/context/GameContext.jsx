import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import { SubmissionService } from '../services/submissionService';
import { SessionService } from '../services/sessionService';
import { GameSettingsService } from '../services/gameSettingsService';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWinner, setShowWinner] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);

  // Session management
  const [sessionId, setSessionId] = useState(null);
  const heartbeatRef = useRef(null);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = StorageService.get('dal_user');
    const savedSessionId = StorageService.get('dal_session_id');
    if (savedUser) {
      setUser(savedUser);
    }
    if (savedSessionId) {
      setSessionId(savedSessionId);
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

    // Check game settings
    const checkSettings = async () => {
      try {
        const settings = await GameSettingsService.getSettings();
        setShowWinner(settings.showWinner);
        setCurrentQuestionId(settings.currentQuestionId);
      } catch (error) {
        console.error("Failed to check game settings:", error);
      }
    };

    checkActiveQuestion();
    checkSettings();
    const questionInterval = setInterval(checkActiveQuestion, 60000);
    const settingsInterval = setInterval(checkSettings, 10000); // Poll settings every 10s

    setLoading(false);
    return () => {
      clearInterval(questionInterval);
      clearInterval(settingsInterval);
    };
  }, []);

  // --- HEARTBEAT MANAGEMENT ---
  // Start heartbeat when sessionId is set, stop when cleared
  useEffect(() => {
    if (!sessionId) {
      // Clear any existing heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    // Send initial heartbeat
    SessionService.sendHeartbeat(sessionId);

    // Start interval (every 15 seconds)
    heartbeatRef.current = setInterval(() => {
      SessionService.sendHeartbeat(sessionId);
    }, 15000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [sessionId]);

  // --- CLEANUP ON PAGE UNLOAD ---
  useEffect(() => {
    const handleUnload = () => {
      if (sessionId) {
        // Use sendBeacon for reliable cleanup on tab close
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const url = `${supabaseUrl}/rest/v1/active_sessions?session_id=eq.${sessionId}`;
          fetch(url, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            keepalive: true,
          }).catch(() => {}); // Fail silently, session will expire in 30s anyway
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId]);

  const login = useCallback((name, newSessionId) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    setUser(trimmedName);
    setSessionId(newSessionId);
    StorageService.set('dal_user', trimmedName);
    StorageService.set('dal_session_id', newSessionId);
  }, []);

  const logout = useCallback(async () => {
    // End session in DB
    if (sessionId) {
      await SessionService.endSession(sessionId);
    }
    // Clear heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setUser(null);
    setSessionId(null);
    StorageService.remove('dal_user');
    StorageService.remove('dal_session_id');
  }, [sessionId]);

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
      loading,
      showWinner,
      currentQuestionId,
      sessionId,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
