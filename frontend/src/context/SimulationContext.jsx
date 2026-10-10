import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { simulationApi } from '../services/api';

const SimulationContext = createContext();

export const DEMO_SCENARIO_STEPS = [
  { id: 1, title: 'Operator Creates Tour', description: 'Ooty & Nilgiris Discovery tour created with budget and destinations.' },
  { id: 2, title: 'Tourists Added', description: '16 tourists onboarded with preferences and languages.' },
  { id: 3, title: 'Preferences Collected', description: 'Paces, dietary needs, languages (Tamil, Hindi, etc.) analyzed.' },
  { id: 4, title: 'AI Adaptive Grouping', description: 'Micro-clusters formed with compatibility scores (Alpha, Beta, Gamma).' },
  { id: 5, title: 'Operator Approves Groups', description: 'Operator reviews compatibility and approves groups.' },
  { id: 6, title: 'Dynamic Itinerary Generated', description: 'Day 1 timeline established with weather-aware checkpoints.' },
  { id: 7, title: 'Tourists Share GPS Location', description: 'Live location telemetry streaming to operator live map.' },
  { id: 8, title: 'Operator Monitors Live Map', description: 'Real-time avatars and group clusters visible on Leaflet map.' },
  { id: 9, title: 'Weather Changes / Rain Spike', description: 'Sudden rain shower (75% probability) detected at Doddabetta Peak.' },
  { id: 10, title: 'Weather Agent Flags Risk', description: 'Precipitation threshold breached; outdoor risk flagged.' },
  { id: 11, title: 'Route Agent Evaluates Paths', description: 'Ghat road identified as slippery; detour evaluated.' },
  { id: 12, title: 'Itinerary Agent Adapts Schedule', description: 'Indoor Tea Museum & Chocolate Masterclass selected as fallback.' },
  { id: 13, title: 'Coordinator Agent Synthesizes', description: 'Gemini AI generates detailed rationale and recommendation.' },
  { id: 14, title: 'Operator Approves Recommendation', description: 'Timeline dynamically reordered across all screens.' },
  { id: 15, title: 'Tourist Uses Voice Assistant', description: 'Tourist asks "What is my next activity?" in their language.' },
  { id: 16, title: 'Tourist Encounters SOS', description: 'Tourist triggers SOS emergency alert with GPS coordinates.' },
  { id: 17, title: 'Emergency Triage & Expense Estimation', description: 'Distance, ETA (~6 min), and expense range (₹1.5k-₹3k) computed.' },
  { id: 18, title: 'Operator Resolves Emergency', description: 'Responder deployed and incident marked resolved.' }
];

export function SimulationProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const walkIntervalRef = useRef(null);

  // Auto walking GPS simulation timer
  useEffect(() => {
    if (isAutoWalking) {
      walkIntervalRef.current = setInterval(async () => {
        try {
          await simulationApi.gpsStep();
        } catch (e) {
          console.log('[Simulation] GPS Step err:', e.message);
        }
      }, 4000);
    } else {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    }
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [isAutoWalking]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const triggerGPSStep = async () => {
    setSimLoading(true);
    try {
      await simulationApi.gpsStep();
    } finally {
      setSimLoading(false);
    }
  };

  const triggerWeatherDisruption = async () => {
    setSimLoading(true);
    try {
      await simulationApi.weatherDisruption();
      setCurrentStep(9);
    } finally {
      setSimLoading(false);
    }
  };

  const triggerEmergencySOS = async () => {
    setSimLoading(true);
    try {
      await simulationApi.emergencySOS();
      setCurrentStep(16);
    } finally {
      setSimLoading(false);
    }
  };

  const resetSimulation = async () => {
    setSimLoading(true);
    try {
      await simulationApi.reset();
      setCurrentStep(1);
    } finally {
      setSimLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(DEMO_SCENARIO_STEPS.length, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <SimulationContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        isAutoWalking,
        setIsAutoWalking,
        triggerGPSStep,
        triggerWeatherDisruption,
        triggerEmergencySOS,
        resetSimulation,
        simLoading
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export const useSimulation = () => useContext(SimulationContext);
