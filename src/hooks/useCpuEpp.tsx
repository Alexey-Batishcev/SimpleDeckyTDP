import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCpuEppSelector, setCpuEpp } from "../redux-modules/settingsSlice";

const useCpuEpp = () => {
  const { activeGameId, cpuEpp } = useSelector(getCpuEppSelector);
  const dispatch = useDispatch();

  const setMode = useCallback((mode) => {
    return dispatch(setCpuEpp(mode));
  }, []);

  return { activeGameId, cpuEpp, setCpuEpp: setMode };
};

export default useCpuEpp;
