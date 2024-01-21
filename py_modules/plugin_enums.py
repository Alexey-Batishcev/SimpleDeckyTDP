from enum import Enum

class GpuModes(Enum):
    LOW = "LOW"
    AUTO = "AUTO"
    RANGE = "RANGE"
    FIXED = "FIXED"

class GpuRange(Enum):
    MIN = "minGpuFrequency"
    MAX = "maxGpuFrequency"
    FIXED = "fixedGpuFrequency"