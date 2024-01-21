import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { get, merge, set } from "lodash";
import {
  DEFAULT_POLL_RATE,
  DEFAULT_START_TDP,
  extractCurrentGameId,
} from "../utils/constants";
import { RootState } from "./store";
import { GpuModes, CpuGovernors, CpuEpp } from "../backend/utils";

type Partial<T> = {
  [P in keyof T]?: T[P];
};

export interface TdpRangeState {
  minTdp: number;
  maxTdp: number;
}

export type TdpProfile = {
  tdp: number;
  cpuBoost: boolean;
  smt: boolean;
  minGpuFrequency?: number;
  maxGpuFrequency?: number;
  fixedGpuFrequency?: number;
  gpuMode: GpuModes;
  cpuGov: CpuGovernors;
  cpuEpp: CpuEpp;
  minCpuFrequency?: number;
  maxCpuFrequency?: number;
};

export type TdpProfiles = {
  [key: string]: TdpProfile;
};

export interface PollState {
  pollEnabled: boolean;
  pollRate: number;
  disableBackgroundPolling: boolean;
}

export interface SettingsState extends TdpRangeState, PollState {
  initialLoad: boolean;
  tdpProfiles: TdpProfiles;
  previousGameId: string | undefined;
  currentGameId: string;
  gameDisplayNames: { [key: string]: string };
  enableTdpProfiles: boolean;
  minGpuFrequency?: number;
  maxGpuFrequency?: number;
  minCpuFrequency?: number;
  maxCpuFrequency?: number;
}

export type InitialStateType = Partial<SettingsState>;

const initialState: SettingsState = {
  previousGameId: undefined,
  currentGameId: "default",
  gameDisplayNames: {
    default: "default",
  },
  minTdp: 3,
  maxTdp: 15,
  initialLoad: true,
  enableTdpProfiles: false,
  tdpProfiles: {
    default: {
      tdp: DEFAULT_START_TDP,
      cpuBoost: true,
      smt: true,
      gpuMode: GpuModes.AUTO,
      cpuGov : CpuGovernors.POWERSAVE,
      cpuEpp : CpuEpp.POWER,
      minGpuFrequency: undefined,
      maxGpuFrequency: undefined,
      fixedGpuFrequency: undefined,
      minCpuFrequency: undefined,
      maxCpuFrequency: undefined,
      
    },
  },
  pollEnabled: false,
  pollRate: DEFAULT_POLL_RATE, // milliseconds
  disableBackgroundPolling: false,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateMinTdp: (state, action: PayloadAction<number>) => {
      state.minTdp = action.payload;
    },
    updateMaxTdp: (state, action: PayloadAction<number>) => {
      state.maxTdp = action.payload;
    },
    updateInitialLoad: (state, action: PayloadAction<InitialStateType>) => {
      const { minGpuFrequency, maxGpuFrequency } = action.payload;
      const { minCpuFrequency, maxCpuFrequency } = action.payload;
      state.initialLoad = false;
      state.minTdp = action.payload.minTdp || 3;
      state.maxTdp = action.payload.maxTdp || 15;
      state.pollEnabled = action.payload.pollEnabled || false;
      state.enableTdpProfiles = action.payload.enableTdpProfiles || false;
      state.disableBackgroundPolling =
        action.payload.disableBackgroundPolling || false;
      state.pollRate = action.payload.pollRate || 5000;
      if (action.payload.tdpProfiles) {
        merge(state.tdpProfiles, action.payload.tdpProfiles);
      }
      state.minGpuFrequency = minGpuFrequency;
      state.maxGpuFrequency = maxGpuFrequency;
      state.minCpuFrequency = minCpuFrequency;
      state.maxCpuFrequency = maxCpuFrequency;
      
      // set default min/max gpu frequency if not set
      if (!state.tdpProfiles.default.minCpuFrequency && minCpuFrequency) {
        state.tdpProfiles.default.minCpuFrequency = minCpuFrequency;
      }
      if (!state.tdpProfiles.default.maxCpuFrequency && maxCpuFrequency) {
        state.tdpProfiles.default.maxCpuFrequency = maxCpuFrequency;
      }

      if (!state.tdpProfiles.default.minGpuFrequency && minGpuFrequency) {
        state.tdpProfiles.default.minGpuFrequency = minGpuFrequency;
      }
      if (!state.tdpProfiles.default.maxGpuFrequency && maxGpuFrequency) {
        state.tdpProfiles.default.maxGpuFrequency = maxGpuFrequency;
      }
      
      if (
        !state.tdpProfiles.default.fixedGpuFrequency &&
        minGpuFrequency &&
        maxGpuFrequency
      ) {
        state.tdpProfiles.default.fixedGpuFrequency = Math.floor(
          (minGpuFrequency + maxGpuFrequency) / 2
        );
      }
      state.currentGameId = extractCurrentGameId();
    },
    updateTdpProfiles: (state, action: PayloadAction<TdpProfiles>) => {
      merge(state.tdpProfiles, action.payload);
    },
    updatePollRate: (state, action: PayloadAction<number>) => {
      state.pollRate = action.payload;
    },
    setCpuBoost: (state, action: PayloadAction<boolean>) => {
      const cpuBoost = action.payload;
      const { currentGameId, enableTdpProfiles } = state;

      if (enableTdpProfiles) {
        set(state.tdpProfiles, `${currentGameId}.cpuBoost`, cpuBoost);
      } else {
        set(state.tdpProfiles, `default.cpuBoost`, cpuBoost);
      }
    },
    setCpuFrequency: (
      state,
      action: PayloadAction<{ min?: number; max?: number }>
    ) => {
      const { min, max } = action.payload;

      const { currentGameId, enableTdpProfiles } = state;

      if (min) {
        // set min value
        if (enableTdpProfiles) {
          state.tdpProfiles[currentGameId].minCpuFrequency = min;
        } else {
          state.tdpProfiles.default.minCpuFrequency = min;
        }
      }
      if (max) {
        // set max value
        if (enableTdpProfiles) {
          state.tdpProfiles[currentGameId].maxCpuFrequency = max;
        } else {
          state.tdpProfiles.default.maxCpuFrequency = max;
        }
      }
    },
    setGpuFrequency: (
      state,
      action: PayloadAction<{ min?: number; max?: number }>
    ) => {
      const { min, max } = action.payload;

      const { currentGameId, enableTdpProfiles } = state;

      if (min) {
        // set min value
        if (enableTdpProfiles) {
          state.tdpProfiles[currentGameId].minGpuFrequency = min;
        } else {
          state.tdpProfiles.default.minGpuFrequency = min;
        }
      }
      if (max) {
        // set max value
        if (enableTdpProfiles) {
          state.tdpProfiles[currentGameId].maxGpuFrequency = max;
        } else {
          state.tdpProfiles.default.maxGpuFrequency = max;
        }
      }
    },
    setFixedGpuFrequency: (state, action: PayloadAction<number>) => {
      const fixedFreq = action.payload;

      const { currentGameId, enableTdpProfiles } = state;

      if (enableTdpProfiles) {
        state.tdpProfiles[currentGameId].fixedGpuFrequency = fixedFreq;
      } else {
        state.tdpProfiles.default.fixedGpuFrequency = fixedFreq;
      }
    },
    setGpuMode: (state, action: PayloadAction<GpuModes>) => {
      const newGpuMode = action.payload;
      const { currentGameId, enableTdpProfiles } = state;

      if (enableTdpProfiles) {
        set(state.tdpProfiles, `${currentGameId}.gpuMode`, newGpuMode);
        // for users on older version of plugin, gpu freq might not be populated. Populate it here
        if (!state.tdpProfiles[currentGameId].minGpuFrequency) {
          state.tdpProfiles[currentGameId].minGpuFrequency =
            state.tdpProfiles.default.minGpuFrequency;
        }
        if (!state.tdpProfiles[currentGameId].maxGpuFrequency) {
          state.tdpProfiles[currentGameId].maxGpuFrequency =
            state.tdpProfiles.default.maxGpuFrequency;
        }
        if (!state.tdpProfiles[currentGameId].fixedGpuFrequency) {
          state.tdpProfiles[currentGameId].fixedGpuFrequency =
            state.tdpProfiles.default.fixedGpuFrequency;
        }
      } else {
        set(state.tdpProfiles, `default.gpuMode`, newGpuMode);
      }
    },
    setCpuGov: (state, action: PayloadAction<CpuGovernors>) => {
      const newCpuGov = action.payload;
      const { currentGameId, enableTdpProfiles } = state;
      if (enableTdpProfiles) {
        set(state.tdpProfiles, `${currentGameId}.cpuGov`, newCpuGov);
      } else {
        set(state.tdpProfiles, `default.cpuGov`, newCpuGov);
      }
     },
    setCpuEpp: (state, action: PayloadAction<CpuEpp>) => {
      const newCpuEpp = action.payload;
      const { currentGameId, enableTdpProfiles } = state;
      if (enableTdpProfiles) {
        set(state.tdpProfiles, `${currentGameId}.cpuEpp`, newCpuEpp);
      } else {
        set(state.tdpProfiles, `default.cpuEpp`, newCpuEpp);
      }
    },
    setSmt: (state, action: PayloadAction<boolean>) => {
      const smt = action.payload;
      const { currentGameId, enableTdpProfiles } = state;

      if (enableTdpProfiles) {
        set(state.tdpProfiles, `${currentGameId}.smt`, smt);
      } else {
        set(state.tdpProfiles, `default.smt`, smt);
      }
    },
    setDisableBackgroundPolling: (state, action: PayloadAction<boolean>) => {
      const enabled = action.payload;
      state.disableBackgroundPolling = enabled;
    },
    setEnableTdpProfiles: (state, action: PayloadAction<boolean>) => {
      state.enableTdpProfiles = action.payload;
    },
    setPolling: (state, action: PayloadAction<boolean>) => {
      state.pollEnabled = action.payload;
    },
    setCurrentGameInfo: (
      state,
      action: PayloadAction<{ id: string; displayName: string }>
    ) => {
      const { id, displayName } = action.payload;
      state.previousGameId = state.currentGameId;
      state.currentGameId = id;
      state.gameDisplayNames[id] = displayName;
      // bootstrap initial TDP profile if it doesn't exist
      if (!state.tdpProfiles[id]) {
        const defaultTdpProfile = state.tdpProfiles.default;
        state.tdpProfiles[id] = defaultTdpProfile;
      }
    },
  },
});

export const allStateSelector = (state: any) => state;
export const initialLoadSelector = (state: any) => state.settings.initialLoad;

// tdp range selectors
export const minTdpSelector = (state: any) => state.settings.minTdp;
export const maxTdpSelector = (state: any) => state.settings.maxTdp;
export const tdpRangeSelector = (state: any) => [
  state.settings.minTdp,
  state.settings.maxTdp,
];

// tdp profile selectors
export const defaultTdpSelector = (state: any) =>
  state.settings.tdpProfiles.default.tdp;

// poll rate selectors
export const pollRateSelector = (state: any) => state.settings.pollRate;
export const pollEnabledSelector = (state: any) => state.settings.pollEnabled;
export const disableBackgroundPollingSelector = (state: RootState) =>
  state.settings.disableBackgroundPolling;

// enableTdpProfiles selectors
export const tdpProfilesEnabled = (state: any) =>
  state.settings.enableTdpProfiles;

export const activeGameIdSelector = (state: RootState) => {
  const { settings } = state;
  const activeGameId = state.settings.currentGameId;

  if (settings.enableTdpProfiles) {
    return activeGameId;
  } else {
    return "default";
  }
};

export const activeTdpProfileSelector = (state: RootState) => {
  const { settings } = state;
  const activeGameId = state.settings.currentGameId;

  if (settings.enableTdpProfiles) {
    const tdpProfile = settings.tdpProfiles[activeGameId];
    return { activeGameId, tdpProfile };
  } else {
    // tdp from default profile
    return {
      activeGameId: "default",
      tdpProfile: settings.tdpProfiles.default,
    };
  }
};

export const getCurrentCpuBoostSelector = (state: RootState) => {
  const { tdpProfile: activeTdpProfile } = activeTdpProfileSelector(state);

  return Boolean(activeTdpProfile.cpuBoost);
};

export const getCurrentSmtSelector = (state: RootState) => {
  const { tdpProfile: activeTdpProfile } = activeTdpProfileSelector(state);

  return Boolean(activeTdpProfile.smt);
};

export const getCurrentTdpInfoSelector = (state: RootState) => {
  const { settings } = state;
  const { activeGameId, tdpProfile: activeTdpProfile } =
    activeTdpProfileSelector(state);
  const tdp = activeTdpProfile.tdp;

  if (settings.enableTdpProfiles) {
    // tdp from game tdp profile
    const displayName = get(settings, `gameDisplayNames.${activeGameId}`, "");
    return { id: activeGameId, tdp, displayName };
  } else {
    // tdp from default profile
    return { id: "default", tdp, displayName: "Default" };
  }
};

// GPU selectors

export const getCurrentGpuFrequencySelector = (state: RootState) => {
  const activeGameId = activeGameIdSelector(state);

  return {
    currentMin: state.settings.tdpProfiles[activeGameId].minGpuFrequency,
    currentMax: state.settings.tdpProfiles[activeGameId].maxGpuFrequency,
  };
};

export const getCurrentCpuFrequencySelector = (state: RootState) => {
  const activeGameId = activeGameIdSelector(state);

  return {
    currentMin: state.settings.tdpProfiles[activeGameId].minCpuFrequency,
    currentMax: state.settings.tdpProfiles[activeGameId].maxCpuFrequency,
  };
};

export const getCurrentFixedGpuFrequencySelector = (state: RootState) => {
  const activeGameId = activeGameIdSelector(state);

  return state.settings.tdpProfiles[activeGameId].fixedGpuFrequency;
};

export const getGpuFrequencyRangeSelector = (state: RootState) => {
  return {
    min: state.settings.minGpuFrequency,
    max: state.settings.maxGpuFrequency,
  };
};

export const getCpuFrequencyRangeSelector = (state: RootState) => {
  return {
    min: state.settings.minCpuFrequency,
    max: state.settings.maxCpuFrequency,
  };
};

export const getGpuModeSelector = (state: RootState) => {
  const {
    activeGameId,
    tdpProfile: { gpuMode },
  } = activeTdpProfileSelector(state);

  return { activeGameId, gpuMode };
};

export const getCpuGovSelector = (state: RootState) => {
  const {
    activeGameId,
    tdpProfile: { cpuGov },
  } = activeTdpProfileSelector(state);

  return { activeGameId, cpuGov };
};

export const getCpuEppSelector = (state: RootState) => {
  const {
    activeGameId,
    tdpProfile: { cpuEpp },
  } = activeTdpProfileSelector(state);

  return { activeGameId, cpuEpp };
};

// Action creators are generated for each case reducer function
export const {
  updateMinTdp,
  updateMaxTdp,
  updateInitialLoad,
  updateTdpProfiles,
  updatePollRate,
  setPolling,
  setCurrentGameInfo,
  setEnableTdpProfiles,
  setCpuBoost,
  setSmt,
  setGpuMode,
  setCpuGov,
  setCpuEpp,
  setGpuFrequency,
  setCpuFrequency,
  setFixedGpuFrequency,
  setDisableBackgroundPolling,
} = settingsSlice.actions;

export default settingsSlice.reducer;
