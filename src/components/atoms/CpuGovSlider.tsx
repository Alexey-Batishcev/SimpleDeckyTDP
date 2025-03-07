import { FC } from "react";
import { SliderField, NotchLabel } from "decky-frontend-lib";
//import { capitalize } from "lodash";
import useCpuGov from "../../hooks/useCpuGov";
import { useCpuStatus } from "../../hooks/useCpuStatus";

enum Governor {
  POWERSAVE = 0,
  BALANCE = 1,
  PERFORMANCE = 2,
}

//conservative ondemand userspace powersave performance schedutil 

const CpuGovSlider: FC = () => {
  const { cpuGov, setCpuGov } = useCpuGov();

  const handleSliderChange = (value: number) => {
    // enum does reverse mapping, including value to key
    return setCpuGov(Governor[value]);
  };

  //const { cpuStatus } = useCpuStatus();
  
 
  var MODES: NotchLabel[] = Object.keys(Governor)
  .filter((key) => isNaN(Number(key)))
  .map((mode, idx) => {
    return { notchIndex: idx, label: mode, value: idx };
  });
  
  // known bug: typescript has incorrect type for reverse mapping from enums
  const sliderValue = Governor[cpuGov] as any;

  return (
    <>
      <SliderField
        label="CPU POWER"
        value={sliderValue || Governor.POWERSAVE}
        min={0}
        max={MODES.length - 1}
        step={1}
        notchCount={MODES.length}
        notchLabels={MODES}
        notchTicksVisible={true}
        showValue={false}
        bottomSeparator={"none"}
        onChange={handleSliderChange}
      />
    </>
  );
};

export default CpuGovSlider;
