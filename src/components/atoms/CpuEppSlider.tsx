import { FC } from "react";
import { SliderField, NotchLabel } from "decky-frontend-lib";
import { capitalize } from "lodash";
import useCpuEpp from "../../hooks/useCpuEpp";

enum Epp {
  POWER = 0,
  BALANCE_POWER = 1,
  BALANCE_PERFORMANCE = 2,
  PERFORMANCE = 3,
}

enum Alias {
  POWER = "pwr",
  BALANCE_POWER = "bal_pwr",
  BALANCE_PERFORMANCE = "bal_perf",
  PERFORMANCE = "perf",
}

const CpuEppSlider: FC = () => {
  const { cpuEpp, setCpuEpp } = useCpuEpp();

  const handleSliderChange = (value: number) => {
    // enum does reverse mapping, including value to key
    return setCpuEpp(Epp[value]);
  };

  const MODES: NotchLabel[] = Object.keys(Epp)
    .filter((key) => isNaN(Number(key)))
    .map((mode, idx) => {
      return { notchIndex: idx, label: Alias[idx], value: idx };
    });

  // known bug: typescript has incorrect type for reverse mapping from enums
  const sliderValue = Epp[cpuEpp] as any;

  return (
    <>
      <SliderField
        label="CPU Power Pref"
        value={sliderValue || Epp.POWER}
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

export default CpuEppSlider;
