# import os
from time import sleep
import decky_plugin
import logging
import os
from plugin_settings import set_all_tdp_profiles, get_saved_settings, get_tdp_profile, get_active_tdp_profile, set_setting as persist_setting
from cpu_utils import get_cpu_frequency_range, ryzenadj, set_cpu_boost, set_smt, set_cpu_governor, set_cpu_power_preferences, set_cpu_max_freq, set_cpu_min_freq
from gpu_utils import get_gpu_frequency_range, set_gpu_frequency
import asyncio


class Plugin:
    async def log_info(self, info):
        logging.info(info)

    async def get_settings(self):
        logging.info(f'get_setting')
        try:
            settings = get_saved_settings()
            try:
                gpu_min, gpu_max = get_gpu_frequency_range()
                cpu_min, cpu_max = get_cpu_frequency_range()
                if (gpu_min and gpu_max):
                    settings['minGpuFrequency'] = gpu_min
                    settings['maxGpuFrequency'] = gpu_max
                if (cpu_min and cpu_max):   
                    settings['minCpuFrequency'] = cpu_min
                    settings['maxCpuFrequency'] = cpu_max

            except Exception as e:
                logging.error(f"get_settings failed to get GPU clocks {e}")

            return settings
        except Exception as e:
            logging.error(f"get_settings failed to get settings {e}")

    async def set_setting(self, name: str, value):
        logging.info(f'set_setting')
        try:
            return persist_setting(name, value)
        except Exception as e:
            logging.error(f"error failed to set_setting {name}={value} {e}")

    async def poll_tdp(self, currentGameId: str):
        logging.info(f'poll_tdp')
        return True
        
    async def poll_tdp_task(self):
        logging.info(f"first_poll_tdp {self.app}")
        while True:
            logging.info(f"scheduled_poll_tdp {self.app}")
            self.set_tdp(self.app)
            await asyncio.sleep(30)

        return True

    async def set_app(self, app_in: str = "default"):
        decky_plugin.logger.info(f"Getting self.app as {self.app}")
        self.app = app_in
        return True

    def set_tdp(app):
        decky_plugin.logger.info(f"set_tdp for {app}")
        settings = get_saved_settings()
        default_tdp_profile = get_tdp_profile('default')
        default_smt = default_tdp_profile.get('smt', True)
        default_cpu_boost = default_tdp_profile.get('cpuBoost', True)
        default_tdp = default_tdp_profile.get('tdp', 12)
        default_gov = default_tdp_profile.get('cpuGov', 'POWERSAVE')
        default_pow_pref = default_tdp_profile.get('cpuEpp', 'POWER')
        default_max_freq = default_tdp_profile.get('maxCpuFrequency', 5000)
        default_min_freq = default_tdp_profile.get('minCpuFrequency', 400)
        default_gpu_mode = default_tdp_profile.get('gpuMode', 'AUTO')
        
        

        if settings.get('enableTdpProfiles'):
            tdp_profile = get_tdp_profile(app)
            cpu_boost = tdp_profile.get('cpuBoost', default_cpu_boost)
            game_tdp = tdp_profile.get('tdp', default_tdp)
            game_smt = tdp_profile.get('smt', default_smt)
            game_gov = tdp_profile.get('cpuGov', default_gov).lower()
            game_pow_pref = tdp_profile.get('cpuEpp', default_pow_pref).lower()
            game_max_freq = tdp_profile.get(
                'maxCpuFrequency', default_max_freq)
            game_min_freq = tdp_profile.get(
                'minCpuFrequency', default_min_freq)
            game_gpu_mode = tdp_profile.get('gpuMode', default_gpu_mode)

            set_cpu_boost(cpu_boost)
            set_smt(game_smt)
            ryzenadj(game_tdp)
            set_cpu_governor(game_gov)
            set_cpu_power_preferences(game_pow_pref)
            set_cpu_max_freq(game_max_freq)
            set_cpu_min_freq(game_min_freq)
        else:
            set_smt(default_smt)
            set_cpu_boost(default_cpu_boost)
            ryzenadj(default_tdp)
            set_cpu_governor(default_gov)
            set_cpu_power_preferences(default_pow_pref)
            set_cpu_max_freq(default_max_freq)
            set_cpu_min_freq(default_min_freq)
        
        set_gpu_frequency(app)

        return True

    async def save_tdp(self, tdpProfiles, currentGameId):
        logging.info(f"save_tdp for {currentGameId}")
        try:
            self.app = currentGameId
            set_all_tdp_profiles(tdpProfiles)
            self.set_tdp(self.app)
            return True
        except Exception as e:
            logging.error(e)

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello World!")
        try:
            self.app = 'default'
            loop = asyncio.get_event_loop()
            self._pool_task = loop.create_task(Plugin.poll_tdp_task(self))
            decky_plugin.logger.info("Started loop {self._pool_task}")
        except Exception as e:
            decky_plugin.logger.error(e)


    # Function called first during the unload process, utilize this to handle your plugin being removed

    async def _unload(self):
        decky_plugin.logger.info("Goodbye World!")
        pass

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky_plugin.logger.info("Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-template/template.log` will be migrated to `decky_plugin.DECKY_PLUGIN_LOG_DIR/template.log`
        decky_plugin.migrate_logs(os.path.join(decky_plugin.DECKY_USER_HOME,
                                               ".config", "decky-template", "template.log"))
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/template.json`
        # - `~/.config/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/`
        decky_plugin.migrate_settings(
            os.path.join(decky_plugin.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".config", "decky-template"))
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        # - `~/.local/share/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        decky_plugin.migrate_runtime(
            os.path.join(decky_plugin.DECKY_HOME, "template"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".local", "share", "decky-template"))
