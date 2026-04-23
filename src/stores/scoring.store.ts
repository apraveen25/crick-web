'use client';

import { create } from 'zustand';
import type { LiveScore, BallType, WicketType } from '@/types/scoring.types';

interface ScoringState {
  liveScore: LiveScore | null;
  isLoading: boolean;
  selectedRuns: number | null;
  selectedBallType: BallType;
  isWicket: boolean;
  selectedWicketType: WicketType | null;
  setLiveScore: (score: LiveScore) => void;
  setSelectedRuns: (runs: number | null) => void;
  setSelectedBallType: (type: BallType) => void;
  setIsWicket: (isWicket: boolean) => void;
  setSelectedWicketType: (type: WicketType | null) => void;
  resetSelection: () => void;
  setLoading: (loading: boolean) => void;
}

export const useScoringStore = create<ScoringState>((set) => ({
  liveScore: null,
  isLoading: false,
  selectedRuns: null,
  selectedBallType: 'normal',
  isWicket: false,
  selectedWicketType: null,
  setLiveScore: (score) => set({ liveScore: score }),
  setSelectedRuns: (runs) => set({ selectedRuns: runs }),
  setSelectedBallType: (type) => set({ selectedBallType: type }),
  setIsWicket: (isWicket) => set({ isWicket }),
  setSelectedWicketType: (type) => set({ selectedWicketType: type }),
  resetSelection: () =>
    set({
      selectedRuns: null,
      selectedBallType: 'normal',
      isWicket: false,
      selectedWicketType: null,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
