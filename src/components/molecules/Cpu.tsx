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
import { useCpuStatus } from "../../hooks/useCpuStatus";
import { CpuFeatureToggles } from "../atoms/CpuFeatureToggles";

const Cpu = () => {
  const { min, max } = useSelector(getCpuFrequencyRangeSelector);

  // hide GPU section if min/max not available
  if (!(min && max)) {
    return null;
  }

  const { cpuGov } = useCpuGov();
  //const { cpuEpp } = useCpuEpp();
  const { cpuStatus } = useCpuStatus();
  
  
  return (
    <PanelSection title="CPU">
      <PanelSectionRow>
        <CpuGovSlider />
      </PanelSectionRow>
      {cpuGov === CpuGovernors.POWERSAVE && cpuStatus && (
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
