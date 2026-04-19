const STORAGE_KEY = "monit-bebek-dashboard-v1";
const TASK_STORAGE_KEY = "monit-bebek-tasks-v1";
const HISTORY_LIMIT = 8;
const HATCH_DURATION = 28;

const metricConfig = [
  {
    key: "temperature",
    label: "Suhu Kandang",
    unit: "deg C",
    safeMin: 24,
    safeMax: 30,
    min: 10,
    max: 45,
    recommendation:
      "Aktifkan pemanas saat terlalu dingin atau ventilasi saat terlalu panas.",
  },
  {
    key: "humidity",
    label: "Kelembapan",
    unit: "%",
    safeMin: 55,
    safeMax: 75,
    min: 20,
    max: 100,
    recommendation:
      "Atur sirkulasi udara dan cek kondisi litter agar kelembapan tetap stabil.",
  },
  {
    key: "ammonia",
    label: "Amonia",
    unit: "ppm",
    safeMin: 0,
    safeMax: 10,
    min: 0,
    max: 50,
    recommendation:
      "Bersihkan kotoran, tambah ventilasi, dan evaluasi kepadatan kandang.",
  },
  {
    key: "water",
    label: "Air Minum",
    unit: "%",
    safeMin: 60,
    safeMax: 100,
    min: 0,
    max: 100,
    recommendation:
      "Isi ulang tangki atau cek jalur distribusi bila cadangan air menipis.",
  },
  {
    key: "feed",
    label: "Stok Pakan",
    unit: "%",
    safeMin: 45,
    safeMax: 100,
    min: 0,
    max: 100,
    recommendation:
      "Jadwalkan refill hopper agar pakan tidak habis di tengah siklus makan.",
  },
  {
    key: "light",
    label: "Cahaya",
    unit: "lux",
    safeMin: 150,
    safeMax: 450,
    min: 0,
    max: 2000,
    recommendation:
      "Sesuaikan lampu kandang agar ritme makan dan produksi telur tetap terjaga.",
  },
];

const deviceConfig = [
  {
    key: "fan",
    label: "Ventilasi",
    description: "Membuang udara panas dan gas dari dalam kandang.",
  },
  {
    key: "heater",
    label: "Pemanas",
    description: "Menjaga suhu stabil saat malam atau hujan.",
  },
  {
    key: "waterPump",
    label: "Pompa Air",
    description: "Mengalirkan cadangan air minum ke nipple drinker.",
  },
  {
    key: "feeder",
    label: "Dispenser Pakan",
    description: "Melepas pakan sesuai jadwal atau saat stok rendah.",
  },
];

const hatchDeviceConfig = [
  {
    key: "incubatorHeater",
    label: "Pemanas Inkubator",
    description: "Menjaga suhu telur tetap stabil selama masa inkubasi.",
  },
  {
    key: "eggTurner",
    label: "Pemutar Telur",
    description: "Membalik telur otomatis sampai fase lockdown.",
  },
  {
    key: "humidifier",
    label: "Humidifier",
    description: "Menambah kelembapan saat telur mendekati waktu menetas.",
  },
  {
    key: "brooderLamp",
    label: "Lampu Brooder",
    description: "Sumber panas utama untuk bibit pada minggu awal.",
  },
  {
    key: "brooderFan",
    label: "Sirkulasi Brooder",
    description: "Membantu menjaga udara tetap segar di ruang bibit.",
  },
];

const defaultTasks = [
  "Cek kondisi litter dan area basah di dekat tempat minum.",
  "Pastikan jalur air tidak tersumbat.",
  "Periksa perilaku makan dan minum bebek.",
  "Catat bebek yang tampak lemah atau menyendiri.",
  "Bersihkan area pakan yang tercecer.",
  "Konfirmasi pintu kandang dan pagar aman.",
  "Sortir telur retak dan kotor sebelum masuk batch inkubasi.",
  "Lakukan candling pada telur fertile sesuai jadwal.",
  "Hentikan pembalikan telur saat memasuki fase lockdown.",
  "Pindahkan bibit yang baru menetas ke brooder yang hangat dan kering.",
  "Pantau pakan starter dan air minum bibit minimal dua kali sehari.",
];

const safePreset = {
  duckCount: 120,
  mode: "auto",
  sensors: {
    temperature: 27.4,
    humidity: 68,
    ammonia: 7.2,
    water: 81,
    feed: 74,
    light: 280,
  },
  devices: {
    fan: true,
    heater: false,
    waterPump: true,
    feeder: true,
  },
  production: {
    eggsCollectedToday: 46,
    incubationEggs: 38,
    fertileRate: 87,
    incubationDay: 18,
    incubatorTemp: 37.5,
    incubatorHumidity: 59,
    hatchedCount: 0,
    ducklingsAlive: 0,
    ducklingAge: 0,
    brooderTemp: 33.5,
    brooderHumidity: 66,
    starterFeed: 92,
    ducklingWater: 88,
  },
  hatchDevices: {
    incubatorHeater: true,
    eggTurner: true,
    humidifier: false,
    brooderLamp: false,
    brooderFan: false,
  },
  history: [],
};

const state = loadState();
const tasksState = loadTasks();

const metricsGrid = document.getElementById("metricsGrid");
const deviceGrid = document.getElementById("deviceGrid");
const alertList = document.getElementById("alertList");
const historyTableBody = document.getElementById("historyTableBody");
const overallStatus = document.getElementById("overallStatus");
const alertCount = document.getElementById("alertCount");
const duckCount = document.getElementById("duckCount");
const lastUpdated = document.getElementById("lastUpdated");
const coopMode = document.getElementById("coopMode");
const sensorForm = document.getElementById("sensorForm");
const productionForm = document.getElementById("productionForm");
const simulateBtn = document.getElementById("simulateBtn");
const resetBtn = document.getElementById("resetBtn");
const advanceDayBtn = document.getElementById("advanceDayBtn");
const taskList = document.getElementById("taskList");
const lifecycleGrid = document.getElementById("lifecycleGrid");
const phaseStrip = document.getElementById("phaseStrip");
const careGrid = document.getElementById("careGrid");
const hatchControlGrid = document.getElementById("hatchControlGrid");

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      sensors: { ...safePreset.sensors, ...parsed.sensors },
      devices: { ...safePreset.devices, ...parsed.devices },
      production: { ...safePreset.production, ...parsed.production },
      hatchDevices: { ...safePreset.hatchDevices, ...parsed.hatchDevices },
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return createInitialState();
  }
}

function createInitialState() {
  const initial = structuredClone(safePreset);
  initial.history = [createHistoryEntry(initial.sensors)];
  return initial;
}

function loadTasks() {
  const defaults = defaultTasks.map((label, index) => ({
    id: `task-${index + 1}`,
    label,
    done: false,
  }));

  const raw = localStorage.getItem(TASK_STORAGE_KEY);

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("invalid tasks");
    }

    return defaults.map((task) => {
      const match = parsed.find((item) => item.id === task.id || item.label === task.label);
      return match ? { ...task, done: Boolean(match.done) } : task;
    });
  } catch {
    return defaults;
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistTasks() {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasksState));
}

function getMetricStatus(metric, value) {
  if (value < metric.safeMin || value > metric.safeMax) {
    const nearLow = metric.safeMin - value;
    const nearHigh = value - metric.safeMax;
    const deviation = Math.max(nearLow, nearHigh);

    if (deviation > (metric.max - metric.min) * 0.12) {
      return "danger";
    }

    return "warn";
  }

  return "ok";
}

function getStatusLabel(status) {
  if (status === "danger") return "Kritis";
  if (status === "warn") return "Waspada";
  return "Aman";
}

function getStatusClass(status) {
  if (status === "danger") return "danger";
  if (status === "warn") return "warn";
  return "ok";
}

function formatMetricValue(metric, value) {
  const fractionDigits =
    metric.key === "temperature" || metric.key === "ammonia" ? 1 : 0;
  return `${Number(value).toFixed(fractionDigits)} ${metric.unit}`;
}

function getBrooderTempRange(age) {
  if (age <= 7) return [32, 34];
  if (age <= 14) return [29, 31];
  if (age <= 21) return [26, 28];
  return [24, 26];
}

function getIncubatorHumidityRange(day) {
  if (day >= 25) {
    return [68, 75];
  }

  return [55, 65];
}

function estimateFertileEggs() {
  return Math.round(
    state.production.incubationEggs * (state.production.fertileRate / 100)
  );
}

function getRemainingHatchDays() {
  return Math.max(HATCH_DURATION - state.production.incubationDay, 0);
}

function getExpectedHatchDate() {
  const date = new Date();
  date.setDate(date.getDate() + getRemainingHatchDays());
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function getHatchRate() {
  const fertileEggs = estimateFertileEggs();
  if (!fertileEggs) {
    return 0;
  }

  return Math.round((state.production.hatchedCount / fertileEggs) * 100);
}

function getSurvivalRate() {
  if (!state.production.hatchedCount) {
    return 0;
  }

  return Math.round(
    (state.production.ducklingsAlive / state.production.hatchedCount) * 100
  );
}

function getLifecyclePhase() {
  if (state.production.ducklingsAlive > 0) {
    return "bibit";
  }

  if (state.production.hatchedCount > 0) {
    return "menetas";
  }

  if (state.production.incubationDay >= 25) {
    return "lockdown";
  }

  if (state.production.incubationDay >= 1) {
    return "inkubasi";
  }

  return "telur";
}

function getPhaseData() {
  const phase = getLifecyclePhase();

  return [
    {
      key: "telur",
      label: "1. Telur",
      detail: `${state.production.eggsCollectedToday} butir terkumpul hari ini.`,
      status:
        phase === "telur"
          ? "current"
          : state.production.incubationDay > 0 ||
              state.production.hatchedCount > 0 ||
              state.production.ducklingsAlive > 0
            ? "complete"
            : "pending",
    },
    {
      key: "inkubasi",
      label: "2. Inkubasi",
      detail: `Hari ke-${state.production.incubationDay} dari ${HATCH_DURATION} hari.`,
      status:
        phase === "inkubasi"
          ? "current"
          : state.production.incubationDay >= 25 ||
              state.production.hatchedCount > 0 ||
              state.production.ducklingsAlive > 0
            ? "complete"
            : "pending",
    },
    {
      key: "lockdown",
      label: "3. Lockdown",
      detail: "Hari 25-28, telur tidak lagi dibalik.",
      status:
        phase === "lockdown"
          ? "current"
          : state.production.hatchedCount > 0 || state.production.ducklingsAlive > 0
            ? "complete"
            : "pending",
    },
    {
      key: "menetas",
      label: "4. Menetas",
      detail: `${state.production.hatchedCount} anak bebek sudah keluar dari cangkang.`,
      status:
        phase === "menetas"
          ? "current"
          : state.production.ducklingsAlive > 0
            ? "complete"
            : "pending",
    },
    {
      key: "bibit",
      label: "5. Perawatan Bibit",
      detail: `${state.production.ducklingsAlive} bibit dipantau di brooder.`,
      status: phase === "bibit" ? "current" : "pending",
    },
  ];
}

function normalizeProduction() {
  state.production.eggsCollectedToday = clamp(
    state.production.eggsCollectedToday,
    0,
    500
  );
  state.production.incubationEggs = clamp(state.production.incubationEggs, 0, 500);
  state.production.fertileRate = clamp(state.production.fertileRate, 0, 100);
  state.production.incubationDay = clamp(state.production.incubationDay, 0, 35);
  state.production.incubatorTemp = clamp(state.production.incubatorTemp, 30, 40);
  state.production.incubatorHumidity = clamp(
    state.production.incubatorHumidity,
    20,
    100
  );
  state.production.hatchedCount = clamp(
    state.production.hatchedCount,
    0,
    state.production.incubationEggs
  );
  state.production.ducklingsAlive = clamp(
    state.production.ducklingsAlive,
    0,
    state.production.hatchedCount
  );
  state.production.ducklingAge = clamp(state.production.ducklingAge, 0, 30);
  state.production.brooderTemp = clamp(state.production.brooderTemp, 20, 40);
  state.production.brooderHumidity = clamp(
    state.production.brooderHumidity,
    20,
    100
  );
  state.production.starterFeed = clamp(state.production.starterFeed, 0, 100);
  state.production.ducklingWater = clamp(state.production.ducklingWater, 0, 100);
}

function createLifecycleAlerts() {
  const alerts = [];
  const brooderRange = getBrooderTempRange(state.production.ducklingAge);
  const humidityRange = getIncubatorHumidityRange(state.production.incubationDay);
  const fertileEggs = estimateFertileEggs();

  if (
    state.production.incubationEggs > 0 &&
    (state.production.incubatorTemp < 37.2 || state.production.incubatorTemp > 37.8)
  ) {
    alerts.push({
      level:
        state.production.incubatorTemp < 36.8 || state.production.incubatorTemp > 38.2
          ? "danger"
          : "warn",
      title: "Suhu inkubator di luar target",
      message:
        `Saat ini ${state.production.incubatorTemp.toFixed(1)} deg C. Jaga di 37.2-37.8 deg C agar embrio berkembang stabil.`,
    });
  }

  if (
    state.production.incubationEggs > 0 &&
    (state.production.incubatorHumidity < humidityRange[0] ||
      state.production.incubatorHumidity > humidityRange[1])
  ) {
    alerts.push({
      level:
        state.production.incubatorHumidity < humidityRange[0] - 5 ||
        state.production.incubatorHumidity > humidityRange[1] + 5
          ? "danger"
          : "warn",
      title: "Kelembapan inkubator perlu disesuaikan",
      message:
        `Saat ini ${Math.round(state.production.incubatorHumidity)} persen. Target fase ini ${humidityRange[0]}-${humidityRange[1]} persen.`,
    });
  }

  if (state.production.incubationDay >= 25 && state.hatchDevices.eggTurner) {
    alerts.push({
      level: "warn",
      title: "Fase lockdown aktif",
      message:
        "Hentikan pembalikan telur pada hari 25 ke atas agar posisi menetas tidak terganggu.",
    });
  }

  if (
    state.production.hatchedCount > 0 &&
    (state.production.brooderTemp < brooderRange[0] ||
      state.production.brooderTemp > brooderRange[1])
  ) {
    alerts.push({
      level:
        state.production.brooderTemp < brooderRange[0] - 1.5 ||
        state.production.brooderTemp > brooderRange[1] + 1.5
          ? "danger"
          : "warn",
      title: "Suhu brooder tidak sesuai umur bibit",
      message:
        `Bibit umur ${state.production.ducklingAge} hari butuh ${brooderRange[0]}-${brooderRange[1]} deg C. Saat ini ${state.production.brooderTemp.toFixed(1)} deg C.`,
    });
  }

  if (
    state.production.hatchedCount > 0 &&
    (state.production.brooderHumidity < 60 || state.production.brooderHumidity > 70)
  ) {
    alerts.push({
      level: "warn",
      title: "Kelembapan brooder kurang ideal",
      message:
        `Kelembapan brooder ${Math.round(state.production.brooderHumidity)} persen. Jaga sekitar 60-70 persen agar bibit tetap nyaman.`,
    });
  }

  if (state.production.hatchedCount > 0 && state.production.starterFeed < 60) {
    alerts.push({
      level: state.production.starterFeed < 35 ? "danger" : "warn",
      title: "Pakan starter bibit menipis",
      message:
        `Sisa pakan starter ${Math.round(state.production.starterFeed)} persen. Segera isi ulang agar pertumbuhan bibit tidak terganggu.`,
    });
  }

  if (state.production.hatchedCount > 0 && state.production.ducklingWater < 70) {
    alerts.push({
      level: state.production.ducklingWater < 45 ? "danger" : "warn",
      title: "Air minum bibit rendah",
      message:
        `Cadangan air bibit ${Math.round(state.production.ducklingWater)} persen. Pastikan tempat minum selalu tersedia.`,
    });
  }

  if (
    state.production.incubationDay >= HATCH_DURATION &&
    fertileEggs > 0 &&
    getHatchRate() < 65
  ) {
    alerts.push({
      level: "warn",
      title: "Persentase hatch rendah",
      message:
        `Baru ${getHatchRate()} persen telur fertile yang menetas. Periksa sanitasi telur, suhu inkubasi, dan jadwal candling.`,
    });
  }

  if (
    state.production.ducklingsAlive > 0 &&
    state.production.hatchedCount > 0 &&
    getSurvivalRate() < 92
  ) {
    alerts.push({
      level: getSurvivalRate() < 85 ? "danger" : "warn",
      title: "Survival bibit menurun",
      message:
        `Tingkat hidup bibit saat ini ${getSurvivalRate()} persen. Evaluasi brooder, akses minum, dan kepadatan bibit.`,
    });
  }

  return alerts;
}

function createAlerts() {
  const alerts = [];

  metricConfig.forEach((metric) => {
    const value = state.sensors[metric.key];
    const status = getMetricStatus(metric, value);

    if (status === "ok") {
      return;
    }

    const direction = value < metric.safeMin ? "terlalu rendah" : "terlalu tinggi";
    alerts.push({
      level: status,
      title: `${metric.label} ${direction}`,
      message: `${formatMetricValue(metric, value)} terdeteksi. ${metric.recommendation}`,
    });
  });

  alerts.push(...createLifecycleAlerts());

  if (!alerts.length) {
    alerts.push({
      level: "ok",
      title: "Kondisi kandang stabil",
      message:
        "Seluruh parameter masih dalam rentang aman. Lanjutkan pemantauan rutin dan checklist operator.",
    });
  }

  return alerts.sort((left, right) => {
    const priority = { danger: 0, warn: 1, ok: 2 };
    return priority[left.level] - priority[right.level];
  });
}

function getOverallStatus(alerts) {
  if (alerts.some((alert) => alert.level === "danger")) {
    return { label: "Perlu tindakan segera", className: "danger" };
  }

  if (alerts.some((alert) => alert.level === "warn")) {
    return { label: "Perlu perhatian", className: "warn" };
  }

  return { label: "Stabil", className: "ok" };
}

function updateAutomaticDevices() {
  if (state.mode !== "auto") {
    return;
  }

  const { temperature, ammonia, water, feed, light } = state.sensors;
  const brooderRange = getBrooderTempRange(state.production.ducklingAge);
  const humidityRange = getIncubatorHumidityRange(state.production.incubationDay);
  state.devices.fan = temperature > 29 || ammonia > 9;
  state.devices.heater = temperature < 24;
  state.devices.waterPump = water < 70;
  state.devices.feeder = feed < 50 || light < 170;
  state.hatchDevices.incubatorHeater = state.production.incubatorTemp < 37.4;
  state.hatchDevices.eggTurner =
    state.production.incubationEggs > 0 &&
    state.production.incubationDay > 0 &&
    state.production.incubationDay < 25;
  state.hatchDevices.humidifier =
    state.production.incubationEggs > 0 &&
    state.production.incubatorHumidity < humidityRange[0];
  state.hatchDevices.brooderLamp =
    state.production.hatchedCount > 0 &&
    state.production.brooderTemp < brooderRange[1];
  state.hatchDevices.brooderFan =
    state.production.hatchedCount > 0 &&
    (state.production.brooderTemp > brooderRange[1] ||
      state.production.brooderHumidity > 70);
}

function createHistoryEntry(sensors) {
  const alerts = metricConfig
    .map((metric) => getMetricStatus(metric, sensors[metric.key]))
    .filter((status) => status !== "ok");

  const status = alerts.includes("danger")
    ? "Kritis"
    : alerts.includes("warn")
      ? "Waspada"
      : "Aman";

  return {
    timestamp: new Date().toISOString(),
    sensors: { ...sensors },
    status,
  };
}

function appendHistory() {
  state.history = [createHistoryEntry(state.sensors), ...state.history].slice(
    0,
    HISTORY_LIMIT
  );
}

function setFormValues() {
  metricConfig.forEach((metric) => {
    const field = sensorForm.elements[metric.key];
    if (field) {
      field.value = state.sensors[metric.key];
    }
  });
}

function setProductionFormValues() {
  Object.entries(state.production).forEach(([key, value]) => {
    const field = productionForm.elements[key];
    if (field) {
      field.value = value;
    }
  });
}

function renderMetrics() {
  metricsGrid.innerHTML = "";
  const template = document.getElementById("metricTemplate");

  metricConfig.forEach((metric) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const value = state.sensors[metric.key];
    const status = getMetricStatus(metric, value);
    const percentage = ((value - metric.min) / (metric.max - metric.min)) * 100;

    node.querySelector(".metric-name").textContent = metric.label;
    node.querySelector(".metric-value").textContent = formatMetricValue(metric, value);

    const badge = node.querySelector(".metric-badge");
    badge.textContent = getStatusLabel(status);
    badge.classList.add(`badge-${getStatusClass(status)}`);

    node.querySelector(".metric-range").textContent =
      `Rentang aman ${metric.safeMin}-${metric.safeMax} ${metric.unit}`;

    const fill = node.querySelector(".meter-fill");
    fill.style.width = `${Math.max(0, Math.min(percentage, 100))}%`;
    if (status === "danger") {
      fill.style.background = "linear-gradient(90deg, #c9523c, #f0b48c)";
    } else if (status === "warn") {
      fill.style.background = "linear-gradient(90deg, #c98e1a, #efd28d)";
    } else {
      fill.style.background = "linear-gradient(90deg, #2f6f6a, #7eb98d)";
    }

    metricsGrid.appendChild(node);
  });
}

function renderDevices() {
  deviceGrid.innerHTML = "";
  const template = document.getElementById("deviceTemplate");

  deviceConfig.forEach((device) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const isOn = Boolean(state.devices[device.key]);
    const toggle = node.querySelector(".device-toggle");

    node.querySelector(".device-name").textContent = device.label;
    node.querySelector(".device-description").textContent = device.description;
    toggle.textContent = isOn ? "Aktif" : "Nonaktif";
    toggle.classList.toggle("is-on", isOn);
    toggle.disabled = state.mode !== "manual";

    if (state.mode !== "manual") {
      node.classList.add("is-disabled");
    }

    toggle.addEventListener("click", () => {
      if (state.mode !== "manual") {
        return;
      }

      state.devices[device.key] = !state.devices[device.key];
      persistState();
      render();
    });

    deviceGrid.appendChild(node);
  });
}

function renderHatchDevices() {
  hatchControlGrid.innerHTML = "";
  const template = document.getElementById("deviceTemplate");

  hatchDeviceConfig.forEach((device) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const isOn = Boolean(state.hatchDevices[device.key]);
    const toggle = node.querySelector(".device-toggle");

    node.querySelector(".device-name").textContent = device.label;
    node.querySelector(".device-description").textContent = device.description;
    toggle.textContent = isOn ? "Aktif" : "Nonaktif";
    toggle.classList.toggle("is-on", isOn);
    toggle.disabled = state.mode !== "manual";

    if (state.mode !== "manual") {
      node.classList.add("is-disabled");
    }

    toggle.addEventListener("click", () => {
      if (state.mode !== "manual") {
        return;
      }

      state.hatchDevices[device.key] = !state.hatchDevices[device.key];
      persistState();
      render();
    });

    hatchControlGrid.appendChild(node);
  });
}

function renderLifecycleSummary() {
  const fertileEggs = estimateFertileEggs();
  const cards = [
    {
      label: "Telur Hari Ini",
      value: `${state.production.eggsCollectedToday} butir`,
      note: "Hasil pengumpulan dari kandang indukan pada hari ini.",
      status: "ok",
      statusText: "Normal",
    },
    {
      label: "Batch Aktif",
      value: `${state.production.incubationEggs} butir`,
      note: `${fertileEggs} butir diperkirakan fertile.`,
      status: "ok",
      statusText: state.production.incubationEggs > 0 ? "Aktif" : "Kosong",
    },
    {
      label: "Estimasi Menetas",
      value: getExpectedHatchDate(),
      note: `${getRemainingHatchDays()} hari tersisa menuju hatch.`,
      status: getRemainingHatchDays() <= 3 ? "warn" : "ok",
      statusText: getRemainingHatchDays() <= 3 ? "Dekat" : "Terjadwal",
    },
    {
      label: "Bibit Hidup",
      value: `${state.production.ducklingsAlive} ekor`,
      note: `Survival ${getSurvivalRate()} persen dari ${state.production.hatchedCount} hatch.`,
      status:
        state.production.ducklingsAlive > 0 && getSurvivalRate() < 92 ? "warn" : "ok",
      statusText:
        state.production.ducklingsAlive > 0 ? "Dipantau" : "Belum Ada",
    },
  ];

  lifecycleGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="lifecycle-card">
          <span class="lifecycle-label">${card.label}</span>
          <strong>${card.value}</strong>
          <p>${card.note}</p>
          <span class="status-pill badge-${card.status}">${card.statusText}</span>
        </article>
      `
    )
    .join("");
}

function renderPhaseStrip() {
  const phases = getPhaseData();

  phaseStrip.innerHTML = phases
    .map((phase) => {
      const badgeLabel =
        phase.status === "complete"
          ? "Selesai"
          : phase.status === "current"
            ? "Aktif"
            : "Menunggu";

      return `
        <article class="phase-card is-${phase.status}">
          <span class="phase-step">${phase.label}</span>
          <strong>${badgeLabel}</strong>
          <p>${phase.detail}</p>
        </article>
      `;
    })
    .join("");
}

function renderCareGrid() {
  const brooderRange = getBrooderTempRange(state.production.ducklingAge);
  const humidityRange = getIncubatorHumidityRange(state.production.incubationDay);
  const cards = [
    {
      label: "Setpoint Inkubator",
      value: `${state.production.incubatorTemp.toFixed(1)} deg C`,
      note: `Kelembapan ${Math.round(state.production.incubatorHumidity)} persen, target fase ${humidityRange[0]}-${humidityRange[1]} persen.`,
      emphasis:
        state.production.incubationDay >= 25
          ? "Lockdown aktif, telur tidak dibalik."
          : "Pembalikan telur tetap berjalan.",
    },
    {
      label: "Target Brooder",
      value: `${state.production.brooderTemp.toFixed(1)} deg C`,
      note: `Bibit umur ${state.production.ducklingAge} hari butuh ${brooderRange[0]}-${brooderRange[1]} deg C.`,
      emphasis: `Kelembapan brooder saat ini ${Math.round(
        state.production.brooderHumidity
      )} persen.`,
    },
    {
      label: "Pakan dan Air Bibit",
      value: `${Math.round(state.production.starterFeed)}% / ${Math.round(
        state.production.ducklingWater
      )}%`,
      note: `Starter feed ${Math.round(
        state.production.starterFeed
      )} persen dan air minum ${Math.round(state.production.ducklingWater)} persen.`,
      emphasis: `Hatch rate ${getHatchRate()} persen, survival ${getSurvivalRate()} persen.`,
    },
  ];

  careGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="care-card">
          <span class="care-label">${card.label}</span>
          <strong>${card.value}</strong>
          <p>${card.note}</p>
          <em>${card.emphasis}</em>
        </article>
      `
    )
    .join("");
}

function renderAlerts(alerts) {
  alertList.innerHTML = "";
  const template = document.getElementById("alertTemplate");

  alerts.forEach((alert) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const levelNode = node.querySelector(".alert-level");

    levelNode.textContent = getStatusLabel(alert.level);
    levelNode.classList.add(`alert-${getStatusClass(alert.level)}`);
    node.querySelector(".alert-title").textContent = alert.title;
    node.querySelector(".alert-message").textContent = alert.message;

    alertList.appendChild(node);
  });
}

function renderHistory() {
  historyTableBody.innerHTML = "";

  state.history.forEach((entry) => {
    const row = document.createElement("tr");
    const time = new Date(entry.timestamp);
    const formattedTime = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(time);

    const statusClass =
      entry.status === "Kritis"
        ? "badge-danger"
        : entry.status === "Waspada"
          ? "badge-warn"
          : "badge-ok";

    row.innerHTML = `
      <td data-label="Waktu">${formattedTime}</td>
      <td data-label="Suhu">${entry.sensors.temperature.toFixed(1)} &deg;C</td>
      <td data-label="Kelembapan">${Math.round(entry.sensors.humidity)} %</td>
      <td data-label="Amonia">${entry.sensors.ammonia.toFixed(1)} ppm</td>
      <td data-label="Air">${Math.round(entry.sensors.water)} %</td>
      <td data-label="Pakan">${Math.round(entry.sensors.feed)} %</td>
      <td data-label="Cahaya">${Math.round(entry.sensors.light)} lux</td>
      <td data-label="Status"><span class="status-pill ${statusClass}">${entry.status}</span></td>
    `;

    historyTableBody.appendChild(row);
  });
}

function renderTasks() {
  taskList.innerHTML = "";
  const template = document.getElementById("taskTemplate");

  tasksState.forEach((task) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector("input");

    checkbox.checked = task.done;
    node.classList.toggle("done", task.done);
    node.querySelector(".task-label").textContent = task.label;

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      persistTasks();
      renderTasks();
    });

    taskList.appendChild(node);
  });
}

function renderSummary(alerts) {
  const overall = getOverallStatus(alerts);
  const activeAlerts = alerts.filter((alert) => alert.level !== "ok").length;

  overallStatus.textContent = overall.label;
  overallStatus.className = `status-pill badge-${overall.className}`;
  alertCount.textContent = `${activeAlerts}`;
  duckCount.textContent = `${state.duckCount} ekor`;
  coopMode.textContent = state.mode === "manual" ? "Manual" : "Otomatis";
  lastUpdated.textContent = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(state.history[0]?.timestamp ?? Date.now()));
}

function renderModeButtons() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function render() {
  normalizeProduction();
  updateAutomaticDevices();
  const alerts = createAlerts();

  renderMetrics();
  renderDevices();
  renderLifecycleSummary();
  renderPhaseStrip();
  renderCareGrid();
  renderHatchDevices();
  renderAlerts(alerts);
  renderHistory();
  renderTasks();
  renderSummary(alerts);
  renderModeButtons();
  setFormValues();
  setProductionFormValues();
  persistState();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateSensors(nextSensors) {
  metricConfig.forEach((metric) => {
    const rawValue = nextSensors[metric.key];
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      state.sensors[metric.key] = clamp(rawValue, metric.min, metric.max);
    }
  });

  appendHistory();
  render();
}

function updateProduction(nextProduction) {
  Object.keys(state.production).forEach((key) => {
    const rawValue = nextProduction[key];
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      state.production[key] = rawValue;
    }
  });

  normalizeProduction();
  render();
}

function simulateReading() {
  const nextSensors = {};

  metricConfig.forEach((metric) => {
    const current = state.sensors[metric.key];
    const variation = (Math.random() - 0.5) * (metric.max - metric.min) * 0.08;
    nextSensors[metric.key] = clamp(current + variation, metric.min, metric.max);
  });

  updateSensors(nextSensors);
}

function advanceLifecycleDay() {
  const fertileEggs = estimateFertileEggs();
  const remainingToHatch = Math.max(fertileEggs - state.production.hatchedCount, 0);

  state.production.eggsCollectedToday = clamp(
    state.production.eggsCollectedToday + Math.round((Math.random() - 0.35) * 6),
    0,
    500
  );

  if (state.production.incubationEggs > 0 && state.production.incubationDay < 35) {
    state.production.incubationDay += 1;
  }

  if (state.production.incubationDay >= 25) {
    state.production.incubatorHumidity = clamp(
      state.production.incubatorHumidity + 4,
      20,
      100
    );
  }

  if (state.production.incubationDay >= 27 && remainingToHatch > 0) {
    const newHatch = Math.min(
      remainingToHatch,
      Math.max(1, Math.round(remainingToHatch * 0.35))
    );
    state.production.hatchedCount += newHatch;
    if (!state.production.ducklingsAlive) {
      state.production.ducklingsAlive = state.production.hatchedCount;
    } else {
      state.production.ducklingsAlive = clamp(
        state.production.ducklingsAlive + newHatch,
        0,
        state.production.hatchedCount
      );
    }
  }

  if (state.production.hatchedCount > 0) {
    state.production.ducklingAge = clamp(state.production.ducklingAge + 1, 0, 30);
    state.production.starterFeed = clamp(state.production.starterFeed - 6, 0, 100);
    state.production.ducklingWater = clamp(state.production.ducklingWater - 7, 0, 100);
  }

  normalizeProduction();
  render();
}

sensorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(sensorForm);
  const nextSensors = {};

  metricConfig.forEach((metric) => {
    const rawValue = Number(formData.get(metric.key));
    nextSensors[metric.key] = Number.isFinite(rawValue)
      ? rawValue
      : state.sensors[metric.key];
  });

  updateSensors(nextSensors);
});

productionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(productionForm);
  const nextProduction = {};

  Object.keys(state.production).forEach((key) => {
    const rawValue = Number(formData.get(key));
    nextProduction[key] = Number.isFinite(rawValue)
      ? rawValue
      : state.production[key];
  });

  updateProduction(nextProduction);
});

simulateBtn.addEventListener("click", () => {
  simulateReading();
});

advanceDayBtn.addEventListener("click", () => {
  advanceLifecycleDay();
});

resetBtn.addEventListener("click", () => {
  state.mode = "auto";
  state.devices = structuredClone(safePreset.devices);
  state.production = structuredClone(safePreset.production);
  state.hatchDevices = structuredClone(safePreset.hatchDevices);
  updateSensors(structuredClone(safePreset.sensors));
});

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    updateAutomaticDevices();
    persistState();
    render();
  });
});

if (!state.history.length) {
  appendHistory();
}

render();
