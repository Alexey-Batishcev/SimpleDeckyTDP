import CpuRangeSliders from "../atoms/CpuRangeSliders";
import CpuGovSlider from "../atoms/CpuGovSlider";
import CpuEppSlider from "../atoms/CpuEppSlider";
import useCpuGov from "../../hooks/useCpuGov";
//import useCpuEpp from "../../hooks/useCpuEpp";
//import { CpuGovernors, CpuEpp } from "../../backend/utils";
import { PanelSection, PanelSectionRow } from "decky-frontend-lib";
import { useSelector } from "react-redux";
import { getCpuFrequencyRangeSelector } from "../../redux-modules/settingsSlice";
//import GpuFixedSlider from "../atoms/GpuFixedSlider";
import { CpuGovernors } from "../../backend/utils";

const Cpu = () => {
  const { min, max } = useSelector(getCpuFrequencyRangeSelector);

  // hide GPU section if min/max not available
  if (!(min && max)) {
    return null;
  }

  const { cpuGov } = useCpuGov();
  //const { cpuEpp } = useCpuEpp();
  
  return (
    <PanelSection title="CPU">
      <PanelSectionRow>
        <CpuGovSlider />
      </PanelSectionRow>
      {cpuGov === CpuGovernors.POWERSAVE && (
      <PanelSectionRow>
        <CpuEppSlider />
      </PanelSectionRow>
      )}
      <PanelSectionRow>
        <CpuRangeSliders />
      </PanelSectionRow>
    </PanelSection>
  );
};

export default Cpu;
