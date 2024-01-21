import { definePlugin, ServerAPI, staticClasses } from "decky-frontend-lib";
import { FC, memo } from "react";
import { FaShip } from "react-icons/fa";
import TdpRange from "./components/molecules/TdpRange";
import { TdpSlider } from "./components/molecules/TdpSlider";
import { PollTdp } from "./components/molecules/PollTdp";
import { store } from "./redux-modules/store";
import { Provider } from "react-redux";
import { createServerApiHelpers, saveServerApi , setApp } from "./backend/utils";
import { TdpProfiles } from "./components/molecules/TdpProfiles";
import {
  currentGameInfoListener,
  suspendEventListener,
} from "./steamListeners";
import { updateInitialLoad } from "./redux-modules/settingsSlice";
import { useIsInitiallyLoading } from "./hooks/useInitialState";
import { cleanupAction } from "./redux-modules/extraActions";
import { CpuFeatureToggles } from "./components/atoms/CpuFeatureToggles";
import Gpu from "./components/molecules/Gpu";
import Cpu from "./components/molecules/Cpu";
//import CpuGovSlider from "./components/atoms/CpuGovSlider";
//import { extractCurrentGameId } from "./utils/constants";
import CpuEppSlider from "./components/atoms/CpuEppSlider";
import { extractCurrentGameId } from "./utils/constants";


const Content: FC<{ serverAPI?: ServerAPI }> = memo(({}) => {
  const loading = useIsInitiallyLoading();

  return (
    <>
      {!loading && (
        <>
          <TdpProfiles />
          <TdpSlider />
          <Cpu/>,
          <Gpu />
          <TdpRange />
        </>
      )}
    </>
  );
});

const ContentContainer: FC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  return (
    <Provider store={store}>
      <Content serverAPI={serverAPI} />
    </Provider>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  saveServerApi(serverApi);

  const { getSettings } = createServerApiHelpers(serverApi);

  //var app = Router.MainRunningApp?.display_name;
  //setApp(app);

  // fetch settings from backend, send into redux state
  getSettings().then((result) => {
    if (result.success) {
      const results = result.result || {};

      store.dispatch(
        updateInitialLoad({
          ...results,
        })
      );
    }
  });

  /*
  // info backend about current app
  
  const { setApp } = createServerApiHelpers(serverApi);
      
  setInterval(() => {
    var app_now = extractCurrentGameId();
    setApp(app_now);
//    app = app_now;
  }, 1000*10);
  */
  const onUnmount = currentGameInfoListener();
  const unregisterSuspendListener = suspendEventListener();

  return {
    title: <div className={staticClasses.Title}>SimpleDeckyTDP</div>,
    content: <ContentContainer serverAPI={serverApi} />,
    icon: <FaShip />,
    onDismount: () => {
      if (onUnmount) onUnmount();
      if (unregisterSuspendListener) unregisterSuspendListener();
      store.dispatch(cleanupAction());
    },
  };
});
