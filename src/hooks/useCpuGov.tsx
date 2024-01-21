import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCpuGovSelector, setCpuGov } from "../redux-modules/settingsSlice";

const useCpuGov = () => {
  const { activeGameId, cpuGov } = useSelector(getCpuGovSelector);
  const dispatch = useDispatch();

  const setMode = useCallback((mode) => {
    return dispatch(setCpuGov(mode));
  }, []);

  return { activeGameId, cpuGov, setCpuGov: setMode };
};

export default useCpuGov;
