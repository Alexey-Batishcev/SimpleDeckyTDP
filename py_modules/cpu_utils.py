from lib2to3.pgen2.token import BACKQUOTE
import os
import subprocess
import shutil
from unittest import result
#import decky_plugin
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
CPU_AV_FREQ_PATH='/sys/devices/system/cpu/cpu*/cpufreq/scaling_available_frequencies'
SCHEDUTIL_RATE_LIMIT='/sys/devices/system/cpu/cpufreq/schedutil/rate_limit_us'
ONDEMAND_IGNORE_NICE_LOAD='/sys/devices/system/cpu/cpufreq/ondemand/ignore_nice_load'#0
ONDEMAND_IO_IS_BUSY='/sys/devices/system/cpu/cpufreq/ondemand/io_is_busy'#0 -> 1
ONDEMAND_POWERSAVE_BIAS='/sys/devices/system/cpu/cpufreq/ondemand/powersave_bias'#0
ONDEMAND_SAMPLING_DOWN_FACTOR='/sys/devices/system/cpu/cpufreq/ondemand/sampling_down_factor'#5 -> 1
ONDEMAND_SAMPLING_RATE='/sys/devices/system/cpu/cpufreq/ondemand/sampling_rate'#2000
ONDEMAND_UP_THRESHOLD='/sys/devices/system/cpu/cpufreq/ondemand/up_threshold'#63 -> 35%

governor_mapper = {'POWERSAVE':'powersave', 'BALANCE':'ondemand', 'PERFORMANCE':'performance'}

def get_cpu_frequency_range_for_acpi():
    logging.debug(f"get_cpu_frequency_range_for_acpi")
    try:
        fmin = 0
        fmax = 10000000
        paths = glob.glob(CPU_AV_FREQ_PATH)
        #logging.debug(f'get_cpu_frequency_range_for_acpi {paths}')
        for path in paths:
            try:
                if os.path.exists(path):
                    #pstate = 'active' if enabled else 'passive'
                
                    logging.debug(f'open {path}')
                    with open(path, 'r') as f:
                        s = f.read()
                        logging.debug(f"get_cpu_frequency_range_line {s}")
                        f.close()
                freq = s.strip().split(' ')
                fmin = max(fmin, int(freq[-1]))
                fmax = min(fmax, int(freq[0]))
            except:
                continue
        logging.debug(f"get_cpu_frequency_range {fmin} - {fmax}")
        return int(0.001*fmin), int(0.001*fmax)
    except Exception as e:
        logging.error(e)
        return None


def get_cpu_frequency_range_for_epp():
    logging.debug(f"get_cpu_frequency_range_for_epp")
    try:
        fmin = 0
        fmax = 10000000
        for file in [CPU_INFO_MAX_FREQ_PATH, CPU_INFO_MIN_FREQ_PATH]:
            paths = glob.glob(file)
            #logging.debug(f'get_cpu_frequency_range_for_epp {paths}')
            for path in paths:
                try:
                    if os.path.exists(path):
                    #pstate = 'active' if enabled else 'passive'
                        with open(path, 'r') as f:
                            s = f.readline()
                            f.close()
                    if "min_freq" in path:
                        fmin = max(fmin,int(s))
                    elif "max_freq" in path:
                        fmax = min(fmax, int(s))
                except:
                    continue
        logging.debug(f"get_cpu_frequency_range {fmin} - {fmax}")
        return int(0.001*fmin), int(0.001*fmax)
    except Exception as e:
        logging.error(e)
        return None

def get_cpu_frequency_range():
    epp, _ = get_epp_status()
    if epp:
        return get_cpu_frequency_range_for_epp()
    else:
         return get_cpu_frequency_range_for_acpi()

def get_epp_status():
    result = os.path.exists(AMD_PSTATE_PATH)
    state = None
    logging.debug(f"get_epp_status {result}")
    if result:
        #pstate = 'active' if enabled else 'passive'
        with open(AMD_PSTATE_PATH, 'r') as f:
            state = f.readline()
            f.close()
    return result, state  

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
        slow_tdp = int(tdp*1000)
        fast_tdp = int(1.2*tdp*1000)

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
    logging.info(f'set_cpu_governor: {governor}')
    _gov = governor_mapper[governor]
    commands = ['cpupower', 'frequency-set', '--governor', f"{_gov}"]
    logging.info(f'cpupower command: {commands}')
    results = subprocess.run(commands, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    returncode, stdout = results.returncode, results.stdout
    logging.info(f'cpupower result: {returncode} {stdout}')

    if _gov == governor_mapper['BALANCE']:
        #set_value_in_file(SCHEDUTIL_RATE_LIMIT, 500)
        set_value_in_file(ONDEMAND_IO_IS_BUSY, 1)
        set_value_in_file(ONDEMAND_UP_THRESHOLD, 35)
        set_value_in_file(ONDEMAND_SAMPLING_DOWN_FACTOR, 1)
    elif (_gov is governor_mapper['BALANCE']) and get_epp_status():
        set_value_in_file(AMD_EPP_POW_PATH, 'BALANCE_PERFORMANCE')

   
    #result = set_value_in_file(AMD_EPP_GOV_PATH, governor)

def set_cpu_power_preferences(power_pref = 'power'):
    logging.info(f'set_cpu_power_preferences: {power_pref}')
    #result = set_value_in_file(AMD_EPP_POW_PATH, power_pref)

def set_cpu_max_freq(fmax = 5000):
    commands = ['cpupower', 'frequency-set', '--max', f"{fmax*1000}"]
    logging.info(f'cpupower command: {commands}')
    results = subprocess.run(commands, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    returncode, stdout = results.returncode, results.stdout
    logging.info(f'cpupower result: {returncode} {stdout}')
    #result = set_value_in_file(CPU_FREQ_MAX_PATH, fmax*1000)

def set_cpu_min_freq(fmin = 400):
    commands = ['cpupower', 'frequency-set', '--min', f"{fmin*1000}"]
    logging.info(f'cpupower command: {commands}')
    results = subprocess.run(commands, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    returncode, stdout = results.returncode, results.stdout
    logging.info(f'cpupower result: {returncode} {stdout}')
   
    #result = set_value_in_file(CPU_FREQ_MIN_PATH, fmin*1000)

def set_cpu_boost(enabled = True):
    #pstate = 'active' if enabled else 'passive'
    #result = set_value_in_file(AMD_PSTATE_PATH, pstate)
    boost = 1 if enabled else 0
    result = set_value_in_file(BOOST_PATH, boost)       
    return result

def set_smt(enabled = True):
    status = 'on' if enabled else 'off'
    result = set_value_in_file(AMD_SMT_PATH, status)       
    return result
