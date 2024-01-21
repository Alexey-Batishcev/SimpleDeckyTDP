// TDP Range Slider
import { SliderField } from "decky-frontend-lib";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentCpuFrequencySelector,
  getCpuFrequencyRangeSelector,
  setCpuFrequency,
} from "../../redux-modules/settingsSlice";

const useSetCpuFrequency = () => {
  const dispatch = useDispatch();

  const setCpuMinFreq = (min: number) => {
    return dispatch(setCpuFrequency({ min }));
  };
  const setCpuMaxFreq = (max: number) => {
    return dispatch(setCpuFrequency({ max }));
  };

  return { setCpuMinFreq, setCpuMaxFreq };
};

const CpuRangeSliders = () => {
  const { min, max } = useSelector(getCpuFrequencyRangeSelector);
  const { currentMin, currentMax } = useSelector(
    getCurrentCpuFrequencySelector
  );
  const { setCpuMinFreq, setCpuMaxFreq } = useSetCpuFrequency();

  if (!(min && max)) {
    return <span>Error: Missing CPU Information</span>;
  }

  return (
    <>
      <SliderField
        label={"Minimum Frequency Limit"}
        value={currentMin}
        step={50}
        description={`${currentMin} MHz`}
        min={min}
        max={currentMax}
        validValues="range"
        bottomSeparator="none"
        onChange={(newMin) => {
          return setCpuMinFreq(newMin);
        }}
      />
      <SliderField
        label={"Maximum Frequency Limit"}
        value={currentMax}
        step={50}
        description={`${currentMax} MHz`}
        min={currentMin}
        max={max}
        validValues="range"
        bottomSeparator="none"
        onChange={(newMax) => {
          return setCpuMaxFreq(newMax);
        }}
      />
    </>
  );
};

export default CpuRangeSliders;
