import logging
import os
from settings import SettingsManager
import glob

try:
    LOG_LOCATION = f"/tmp/simpleTDP.log"
    logging.basicConfig(
        level=logging.DEBUG,
        filename=LOG_LOCATION,
        format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
        filemode='w',
        force=True)
except Exception as e:
    logging.error(f"exception|{e}")

settings_directory = os.environ["DECKY_PLUGIN_SETTINGS_DIR"]
settings_path = os.path.join(settings_directory, 'settings.json')
setting_file = SettingsManager(
    name="settings", settings_directory=settings_directory)
setting_file.read()


def deep_merge(origin, destination):
    logging.info(f'{origin} : {destination}')
    for k, v in origin.items():
        logging.info(f'{k}:{v}')
        if isinstance(v, dict):
            n = destination.setdefault(k, {})
            logging.info(f'{k}:{n}')
            deep_merge(v, n)
        else:
            destination[k] = v

    return destination


def get_saved_settings():
    setting_file.read()
    return setting_file.settings


def set_setting(name: str, value):
    return setting_file.setSetting(name, value)


def set_all_tdp_profiles(tdp_profiles):
    settings = get_saved_settings()

    if not settings.get('tdpProfiles'):
        settings['tdpProfiles'] = {}
    profiles = settings['tdpProfiles']
    deep_merge(tdp_profiles, profiles)

    setting_file.settings['tdpProfiles'] = profiles
    setting_file.commit()


def get_tdp_profile(gameId):
    settings = get_saved_settings()

    if not settings.get('tdpProfiles'):
        settings['tdpProfiles'] = {}
    profiles = settings['tdpProfiles']
    return profiles.get(gameId, {})


def get_active_tdp_profile(gameId):
    settings = get_saved_settings()

    if settings.get("enableTdpProfiles", False):
        return get_tdp_profile(gameId)
    else:
        return get_tdp_profile('default')

'''
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

    if settings.get('enableTdpProfiles'):
        tdp_profile = get_tdp_profile(app)
        cpu_boost = tdp_profile.get('cpuBoost', default_cpu_boost)
        game_tdp = tdp_profile.get('tdp', default_tdp)
        game_smt = tdp_profile.get('smt', default_smt)
        game_gov = tdp_profile.get('cpuGov', default_gov).lower()
        game_pow_pref = tdp_profile.get('cpuEpp', default_pow_pref).lower()
        game_max_freq = tdp_profile.get('maxCpuFrequency', default_max_freq)
        game_min_freq = tdp_profile.get('minCpuFrequency', default_min_freq)

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

    return True
'''

def set_value_in_file(file, value):
    logging.debug(f"set_value_in_file to {file} = {value}")
    try:      
        paths = glob.glob(file)
        #logging.debug(f'set_value_in_file {paths}')
        for path in paths:
            if os.path.exists(path):
                #pstate = 'active' if enabled else 'passive'
                with open(path, 'w') as f:
                    f.write(str(value))
                    f.close()
        return True
    except Exception as e:
        logging.error(e)
        return False