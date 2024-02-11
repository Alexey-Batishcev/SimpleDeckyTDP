import { ServerAPI } from "decky-frontend-lib";
import { TdpProfiles } from "../redux-modules/settingsSlice";

export enum GpuModes {
  LOW = "LOW",
  AUTO = "AUTO",
  RANGE = "RANGE",
  FIXED = "FIXED",
}

export enum CpuGovernors {
  POWERSAVE = "POWERSAVE",
  PERFORMANCE = "PERFORMANCE",
  CONSERVATIVE = "CONSERVATIVE",
  USERSPACE = "USERSPACE",
  ONDEMAND = "ONDEMAND",
  SCHEDUTIL = "SCHEDUTIL",

}

export enum CpuEpp {
  POWER = "POWER",
  BALANCE_POWER = "BALANCE_POWER",
  BALANCE_PERFORMANCE = "BALANCE_PERFORMANCE",
  PERFORMANCE = "PERFORMANCE",
}


export enum ServerAPIMethods {
  SET_SETTING = "set_setting",
  GET_SETTINGS = "get_settings",
  LOG_INFO = "log_info",
  SET_TDP = "set_tdp",
  SAVE_TDP = "save_tdp",
  POLL_TDP = "poll_tdp",
  SET_APP = "set_app",
}

export const createLogInfo = (serverAPI: ServerAPI) => async (info: any) => {
  await serverAPI.callPluginMethod(ServerAPIMethods.LOG_INFO, {
    info,
  });
};

export const createSetApp =
  (serverAPI: ServerAPI) =>
  async (app : string ) =>
    await serverAPI.callPluginMethod(ServerAPIMethods.SET_APP, {
      app,
    });

export const createSetSetting =
  (serverAPI: ServerAPI) =>
  async ({ fieldName, fieldValue }: { fieldName: string; fieldValue: any }) =>
    await serverAPI.callPluginMethod(ServerAPIMethods.SET_SETTING, {
      name: fieldName,
      value: fieldValue,
    });

export const createGetSettings = (serverAPI: ServerAPI) => async () => {
  return await serverAPI.callPluginMethod(ServerAPIMethods.GET_SETTINGS, {});
};

export const createSaveTdp =
  (serverAPI: ServerAPI) => async (gameId: string, tdp: number) => {
    const tdpProfiles = {
      [gameId]: {
        tdp,
      },
    };

    return await serverAPI.callPluginMethod(ServerAPIMethods.SAVE_TDP, {
      tdpProfiles,
      currentGameId: gameId,
    });
  };

export const createSaveTdpProfiles =
  (serverAPI: ServerAPI) =>
  async (tdpProfiles: TdpProfiles, currentGameId: string) => {
    return await serverAPI.callPluginMethod(ServerAPIMethods.SAVE_TDP, {
      tdpProfiles,
      currentGameId,
    });
  };

export const createPollTdp =
  (serverAPI: ServerAPI) => async (currentGameId: string) => {
    return await serverAPI.callPluginMethod(ServerAPIMethods.POLL_TDP, {
      currentGameId,
    });
  };

export const createServerApiHelpers = (serverAPI: ServerAPI) => {
  return {
    getSettings: createGetSettings(serverAPI),
    setSetting: createSetSetting(serverAPI),
    logInfo: createLogInfo(serverAPI),
    saveTdp: createSaveTdp(serverAPI),
    setPollTdp: createPollTdp(serverAPI),
    saveTdpProfiles: createSaveTdpProfiles(serverAPI),
    setApp: createSetApp(serverAPI),
  };
};

let serverApi: undefined | ServerAPI;

export const saveServerApi = (s: ServerAPI) => {
  serverApi = s;
};

export const getServerApi = () => {
  return serverApi;
};

export const getLogInfo = () => {
  if (serverApi) {
    const logInfo = createLogInfo(serverApi);
    return logInfo;
  } else {
    return () => {};
  }
};
