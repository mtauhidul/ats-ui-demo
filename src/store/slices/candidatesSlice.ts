import type { Candidate } from "@/types";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { API_BASE_URL } from "@/config/api";

// Helper function to normalize candidate data (ensure id field exists)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeCandidate = (candidate: any): Candidate => {
  // Ensure id field exists (backend returns _id, we need id)
  if (!candidate.id && candidate._id) {
    candidate.id = candidate._id;
  }
  
  // Preserve assignedTo as populated object (don't convert to ID)
  // The backend populates it with { _id, firstName, lastName, email, avatar }
  // We keep it as-is so the UI can display the user's name
  if (candidate.assignedTo && typeof candidate.assignedTo === 'object') {
    // Ensure the nested user object also has an id field
    if (!candidate.assignedTo.id && candidate.assignedTo._id) {
      candidate.assignedTo.id = candidate.assignedTo._id;
    }
  }
  
  return candidate;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeCandidates = (candidates: any[]): Candidate[] => {
  return candidates.map(normalizeCandidate);
};

export interface CandidatesState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; // Timestamp when data was last fetched
  cacheValid: boolean; // Whether cache is still valid
}

const initialState: CandidatesState = {
  candidates: [],
  currentCandidate: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheValid: false,
};

// Cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds - candidates change frequently

// Helper to check if cache is still valid
const isCacheValid = (lastFetched: number | null): boolean => {
  if (!lastFetched) return false;
  return Date.now() - lastFetched < CACHE_DURATION;
};

// Async thunks
export const fetchCandidates = createAsyncThunk(
  "candidates/fetchAll",
  async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) throw new Error("Failed to fetch candidates");
    const result = await response.json();
    // Extract data from wrapped response and normalize
    const candidates = result.data?.candidates || result.data || result;
    const normalized = normalizeCandidates(candidates);
    return normalized;
  }
);

// Smart fetch - only fetches if cache is stale
export const fetchCandidatesIfNeeded = createAsyncThunk(
  "candidates/fetchIfNeeded",
  async (_, { getState, dispatch }) => {
    const state = getState() as { candidates: CandidatesState };
    const { lastFetched, cacheValid, candidates } = state.candidates;
    
    // If cache is valid and we have data, skip fetch
    if (cacheValid && isCacheValid(lastFetched) && candidates.length > 0) {
      return null;
    }
    
    // Cache is stale or invalid, fetch fresh data
    return dispatch(fetchCandidates()).then((result) => result.payload);
  }
);

export const fetchCandidateById = createAsyncThunk(
  "candidates/fetchById",
  async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/candidates/${id}`);
    if (!response.ok) throw new Error("Failed to fetch candidate");
    const result = await response.json();
    return normalizeCandidate(result.data || result);
  }
);

export const createCandidate = createAsyncThunk(
  "candidates/create",
  async (candidateData: Partial<Candidate>) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/candidates`, {
      method: "POST",
      body: JSON.stringify(candidateData),
    });
    if (!response.ok) throw new Error("Failed to create candidate");
    const result = await response.json();
    toast.success("Candidate created successfully");
    return normalizeCandidate(result.data || result);
  }
);

export const updateCandidate = createAsyncThunk(
  "candidates/update",
  async ({ id, data }: { id: string; data: Partial<Candidate> }) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update candidate");
    const result = await response.json();
    toast.success("Candidate updated successfully");
    return normalizeCandidate(result.data || result);
  }
);

export const deleteCandidate = createAsyncThunk(
  "candidates/delete",
  async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/candidates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.message || "Failed to delete candidate");
      throw new Error(error.message || "Failed to delete candidate");
    }
    toast.success("Candidate deleted successfully");
    return id;
  }
);

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    setCurrentCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.currentCandidate = action.payload;
    },
    // Invalidate cache - force refetch on next access
    invalidateCandidatesCache: (state) => {
      state.cacheValid = false;
      state.lastFetched = null;
      },
    // Optimistic update for candidate stage change
    updateCandidateStageOptimistic: (state, action: PayloadAction<{ candidateId: string; newStageId: string; newStageData?: { id: string; name: string; color: string; order: number } }>) => {
      const { candidateId, newStageId, newStageData } = action.payload;
      const index = state.candidates.findIndex((c) => c.id === candidateId);
      if (index !== -1) {
        state.candidates[index].currentPipelineStageId = newStageId;
        if (newStageData) {
          state.candidates[index].currentStage = newStageData;
        }
      }
      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate.currentPipelineStageId = newStageId;
        if (newStageData) {
          state.currentCandidate.currentStage = newStageData;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload;
        state.lastFetched = Date.now(); // Update cache timestamp
        state.cacheValid = true; // Mark cache as valid
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch candidates";
        state.cacheValid = false; // Invalidate on error
      })
      .addCase(fetchCandidatesIfNeeded.pending, (state) => {
        // Only show loading if we're actually fetching (not using cache)
        if (!state.cacheValid || !isCacheValid(state.lastFetched)) {
          state.isLoading = true;
        }
      })
      .addCase(fetchCandidatesIfNeeded.fulfilled, (state, action) => {
        state.isLoading = false;
        // Only update if we got fresh data (not null from cache)
        if (action.payload && Array.isArray(action.payload)) {
          state.candidates = action.payload;
          state.lastFetched = Date.now();
          state.cacheValid = true;
        }
      })
      .addCase(fetchCandidatesIfNeeded.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch candidates";
        state.cacheValid = false;
      })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.currentCandidate = action.payload;
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.candidates.unshift(action.payload);
        // Keep cache valid since we just added locally
        state.lastFetched = Date.now();
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        const index = state.candidates.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.candidates[index] = action.payload;
        }
        if (state.currentCandidate?.id === action.payload.id) {
          state.currentCandidate = action.payload;
        }
        // Keep cache valid since we just updated locally
        state.lastFetched = Date.now();
      })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.candidates = state.candidates.filter(
          (c) => c.id !== action.payload
        );
        if (state.currentCandidate?.id === action.payload) {
          state.currentCandidate = null;
        }
        // Keep cache valid since we just deleted locally
        state.lastFetched = Date.now();
      });
  },
});

export const { setCurrentCandidate, invalidateCandidatesCache, updateCandidateStageOptimistic } = candidatesSlice.actions;
export default candidatesSlice.reducer;
