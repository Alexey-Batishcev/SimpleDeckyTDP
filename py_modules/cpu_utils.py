import os
import subprocess
import shutil
from unittest import result
import decky_plugin
import logging
import plugin_settings
from devices import legion_go
import glob
from plugin_settings import set_value_in_file 

RYZENADJ_PATH = shutil.which('ryzenadj')
BOOST_PATH="/sys/devices/system/cpu/cpufreq/boost"
AMD_PSTATE_PATH="/sys/devices/system/cpu/amd_pstate/status"
AMD_SMT_PATH="/sys/devices/system/cpu/smt/control"
AMD_EPP_GOV_PATH="/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor"
AMD_EPP_POW_PATH="/sys/devices/system/cpu/cpu*/cpufreq/energy_performance_preference"
AMD_AVAIL_EPP_GOV_PATH="/sys/devices/system/cpu/cpu*/cpufreq/scaling_available_governors"
AMD_AVAIL_EPP_POW_PATH="/sys/devices/system/cpu/cpu*/cpufreq/energy_performance_available_preferences"
CPU_FREQ_MAX_PATH='/sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq'
CPU_FREQ_MIN_PATH='/sys/devices/system/cpu/cpu0/cpufreq/scaling_min_freq'
CPU_INFO_MAX_FREQ_PATH='/sys/devices/system/cpu/cpu*/cpufreq/cpuinfo_max_freq'
CPU_INFO_MIN_FREQ_PATH='/sys/devices/system/cpu/cpu*/cpufreq/cpuinfo_min_freq'

def modprobe_acpi_call():
    os.system("modprobe acpi_call")
    result = subprocess.run(["modprobe", "acpi_call"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.stderr:
        logging.error(f"modprobe_acpi_call error: {result.stderr}")
        return False
    return True

def ryzenadj(tdp: int):
    settings = plugin_settings.get_saved_settings()
    try:
        if settings.get("overrideRyzenadj"):
            # use custom Tdp instead of ryzenadj
            commands = [settings.get("overrideRyzenadj"), tdp]
            results = subprocess.call(commands)
            return results

        if settings.get("enableLegionGoCustomTDP"):
            with open("/sys/devices/virtual/dmi/id/product_name", "r") as file:
                device_name = file.read().strip()
                file.close()

                # decky_plugin.logger.info(device_name)

                if device_name == "83E1" and modprobe_acpi_call():
                    # legion go
                    return legion_go.ryzenadj(tdp)

        stapm_tdp = int(tdp*1000)
        slow_tdp = int(1.05*tdp*1000)
        fast_tdp = int(1.1*tdp*1000)

        if RYZENADJ_PATH:
            commands = [RYZENADJ_PATH, '--stapm-limit', f"{stapm_tdp}", '--fast-limit', f"{fast_tdp}", '--slow-limit', f"{slow_tdp}"]
            logging.info(f'ryzen command: {commands}')
            results = subprocess.run(commands, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            returncode, stdout = results.returncode, results.stdout
            logging.info(f'ryzenadj result: {returncode} {stdout}')
            return results
    except Exception as e:
        logging.error(e)
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
'''

def set_cpu_governor(governor = 'powersave'):
    result = set_value_in_file(AMD_EPP_GOV_PATH, governor)
    return result

def set_cpu_power_preferences(power_pref = 'power'):
    result = set_value_in_file(AMD_EPP_POW_PATH, power_pref)

def set_cpu_max_freq(fmax = 5000):
    result = set_value_in_file(CPU_FREQ_MAX_PATH, fmax*1000)

def set_cpu_min_freq(fmin = 400):
    result = set_value_in_file(CPU_FREQ_MIN_PATH, fmin*1000)

def set_cpu_boost(enabled = True):
    pstate = 'active' if enabled else 'passive'
    result = set_value_in_file(AMD_PSTATE_PATH, pstate)
    boost = 1 if enabled else 0
    result = set_value_in_file(BOOST_PATH, boost)       
    return result

def set_smt(enabled = True):
    status = 'on' if enabled else 'off'
    result = set_value_in_file(AMD_SMT_PATH, status)       
    return result
