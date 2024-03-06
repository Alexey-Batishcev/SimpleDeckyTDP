import { useDispatch, useSelector } from "react-redux";
import {
  getCpuStatusSelector, setCpuStatus,
} from "../redux-modules/settingsSlice";
import { useCallback } from "react";

export const useCpuStatus = () => {
  const cpuStatus = useSelector(getCpuStatusSelector);
  const dispatch = useDispatch();

  const setter = useCallback((enabled: boolean) => {
    return dispatch(setCpuStatus(enabled));
  }, []);

  return { cpuStatus, setCpuStatus: setter };
};
