const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const DEFAULT_PLACE = { name: "London", admin1: "England", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 };

const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  results: document.querySelector("#search-results"),
  status: document.querySelector("#status"),
  locationButton: document.querySelector("#location-button"),
  locationName: document.querySelector("#location-name"),
  locationMeta: document.querySelector("#location-meta"),
  todayLabel: document.querySelector("#today-label"),
  updatedLabel: document.querySelector("#updated-label"),
  currentCondition: document.querySelector("#current-condition"),
  currentIcon: document.querySelector("#current-icon"),
  currentTemperature: document.querySelector("#current-temperature"),
  feelsLike: document.querySelector("#feels-like"),
  todayHigh: document.querySelector("#today-high"),
  todayLow: document.querySelector("#today-low"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#wind-speed"),
  rainChance: document.querySelector("#rain-chance"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  hourlyList: document.querySelector("#hourly-list"),
  dailyList: document.querySelector("#daily-list"),
};

let requestId = 0;

const weatherDescriptions = [
  [[0], "Clear sky", "☀️"],
  [[1], "Mainly clear", "🌤️"],
  [[2], "Partly cloudy", "⛅"],
  [[3], "Overcast", "☁️"],
  [[45, 48], "Foggy", "🌫️"],
  [[51, 53, 55, 56, 57], "Drizzle", "🌦️"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "Rain", "🌧️"],
  [[71, 73, 75, 77, 85, 86], "Snow", "❄️"],
  [[95, 96, 99], "Thunderstorms", "⛈️"],
];

function weatherFor(code) {
  return weatherDescriptions.find(([codes]) => codes.includes(code))?.slice(1) ?? ["Variable conditions", "🌥️"];
}

function showStatus(message = "", kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status${kind ? ` ${kind}` : ""}`;
  elements.status.hidden = !message;
}

function formatHour(value) {
  const hour = Number(value.slice(11, 13));
  return `${hour % 12 || 12}${hour < 12 ? "AM" : "PM"}`;
}

function formatClock(value) {
  if (!value) return "—";
  const [hour, minute] = value.slice(11, 16).split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")}${hour < 12 ? "AM" : "PM"}`;
}

function formatDay(value, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(`${value}T12:00:00`));
}

function placeLabel(place) {
  return [place.admin1, place.country].filter((part) => part && part !== place.name).join(", ");
}

async function getJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}. Please try again.`);
  return response.json();
}

async function loadWeather(place) {
  const thisRequest = ++requestId;
  elements.locationName.textContent = place.name;
  elements.locationMeta.textContent = placeLabel(place) || "Local forecast";
  elements.updatedLabel.textContent = "";
  elements.hourlyList.replaceChildren();
  elements.dailyList.replaceChildren();
  showStatus("Fetching the latest forecast…");

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    forecast_days: "7",
    timezone: "auto",
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
  });

  try {
    const data = await getJson(`${API_BASE}?${params}`);
    if (thisRequest !== requestId) return;
    renderWeather(data);
    const updatedTime = formatClock(data.current.time);
    elements.updatedLabel.textContent = `Updated ${updatedTime} local time`;
    showStatus("");
  } catch (error) {
    if (thisRequest !== requestId || error.name === "AbortError") return;
    showStatus(error.message || "Could not load weather. Check your connection and try again.", "error");
  }
}

function renderWeather(data) {
  const current = data.current;
  const [condition, icon] = weatherFor(current.weather_code);
  elements.currentCondition.textContent = condition;
  elements.currentIcon.textContent = icon;
  elements.currentTemperature.textContent = Math.round(current.temperature_2m);
  elements.feelsLike.textContent = Math.round(current.apparent_temperature);
  elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.windSpeed.textContent = Math.round(current.wind_speed_10m);
  elements.todayHigh.textContent = Math.round(data.daily.temperature_2m_max[0]);
  elements.todayLow.textContent = Math.round(data.daily.temperature_2m_min[0]);
  elements.sunrise.textContent = formatClock(data.daily.sunrise[0]);
  elements.sunset.textContent = formatClock(data.daily.sunset[0]);
  elements.todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${data.daily.time[0]}T12:00:00`)).toUpperCase();

  const hourly = data.hourly;
  const currentHour = hourly.time.indexOf(current.time.slice(0, 13) + ":00");
  const start = currentHour >= 0 ? currentHour : Math.max(0, hourly.time.findIndex((time) => time >= current.time));
  const hourlyItems = [];
  for (let i = start; i < Math.min(start + 24, hourly.time.length); i += 3) {
    const [description, weatherIcon] = weatherFor(hourly.weather_code[i]);
    const item = document.createElement("article");
    item.className = "hour-item";
    const time = document.createElement("span");
    time.className = "hour-time";
    time.textContent = i === start ? "Now" : formatHour(hourly.time[i]);
    const icon = document.createElement("span");
    icon.className = "hour-icon";
    icon.setAttribute("aria-label", description);
    icon.textContent = weatherIcon;
    const temp = document.createElement("strong");
    temp.className = "hour-temp";
    temp.textContent = `${Math.round(hourly.temperature_2m[i])}°`;
    const rain = document.createElement("span");
    rain.className = "hour-rain";
    rain.textContent = `${hourly.precipitation_probability[i] ?? 0}% rain`;
    item.append(time, icon, temp, rain);
    hourlyItems.push(item);
  }
  elements.hourlyList.replaceChildren(...hourlyItems);

  const dailyItems = data.daily.time.map((date, index) => {
    const [description, weatherIcon] = weatherFor(data.daily.weather_code[index]);
    const row = document.createElement("div");
    row.className = "day-row";
    const day = document.createElement("strong");
    day.className = "day-name";
    day.textContent = formatDay(date, index);
    const icon = document.createElement("span");
    icon.className = "day-icon";
    icon.setAttribute("aria-label", description);
    icon.textContent = weatherIcon;
    const condition = document.createElement("span");
    condition.className = "day-condition";
    condition.textContent = description;
    const bar = document.createElement("span");
    bar.className = "temperature-range";
    bar.setAttribute("aria-hidden", "true");
    const low = document.createElement("span");
    low.className = "day-low";
    low.textContent = `${Math.round(data.daily.temperature_2m_min[index])}°`;
    const high = document.createElement("strong");
    high.className = "day-high";
    high.textContent = `${Math.round(data.daily.temperature_2m_max[index])}°`;
    row.append(day, icon, condition, bar, low, high);
    return row;
  });
  elements.dailyList.replaceChildren(...dailyItems);

  const nextHour = Math.max(0, hourly.time.findIndex((time) => time >= current.time));
  elements.rainChance.textContent = `${hourly.precipitation_probability[nextHour] ?? 0}%`;
}

function renderSearchResults(places) {
  elements.results.replaceChildren();
  for (const place of places) {
    const button = document.createElement("button");
    button.className = "result-option";
    button.type = "button";
    const title = document.createElement("strong");
    title.textContent = place.name;
    const detail = document.createElement("span");
    detail.textContent = placeLabel(place) || "Location";
    button.append(title, detail);
    button.addEventListener("click", () => {
      elements.results.hidden = true;
      elements.input.value = "";
      loadWeather(place);
    });
    elements.results.append(button);
  }
  elements.results.hidden = places.length === 0;
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();
  if (!query) return;
  elements.results.hidden = true;
  showStatus("Searching for that city…");
  try {
    const params = new URLSearchParams({ name: query, count: "5", language: "en", format: "json" });
    const data = await getJson(`${GEOCODING_BASE}?${params}`);
    const places = (data.results || []).map((item) => ({
      name: item.name,
      admin1: item.admin1,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
    if (!places.length) {
      showStatus(`No matching city found for “${query}”. Try another spelling.`, "error");
      return;
    }
    showStatus("");
    if (places.length === 1) {
      elements.input.value = "";
      loadWeather(places[0]);
    } else {
      renderSearchResults(places);
      elements.results.setAttribute("aria-label", `Search results for ${query}`);
    }
  } catch (error) {
    showStatus(error.message || "City search failed. Check your connection and try again.", "error");
  }
});

elements.locationButton.addEventListener("click", () => {
  elements.results.hidden = true;
  if (!navigator.geolocation) {
    showStatus("This browser does not support location access. Search for a city instead.", "error");
    return;
  }
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeather({ name: "Your location", latitude: coords.latitude, longitude: coords.longitude }),
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location access was denied. You can search for a city instead."
        : "Could not determine your location. You can search for a city instead.";
      showStatus(message, "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
});

document.addEventListener("click", (event) => {
  if (!elements.results.contains(event.target) && !elements.form.contains(event.target)) {
    elements.results.hidden = true;
  }
});

elements.todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
loadWeather(DEFAULT_PLACE);
