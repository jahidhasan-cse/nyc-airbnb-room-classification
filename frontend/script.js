
/* 1. Settings */

// Address of the FastAPI server.
// - Page served by FastAPI or deployed online: same address, so no prefix is needed.
// - index.html opened straight from disk (file://): talk to the local server on port 8000.
const API_URL = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";

// How long to wait for a prediction before giving up.
const REQUEST_TIMEOUT_MS = 20000;


/* 2. Data */

// predict_proba returns probabilities in the order of model.classes_.
// For this model that order is alphabetical, which matches the list below.
const ROOM_TYPES = [
  { label: "Entire home/apt", key: "entire",  letter: "E" },
  { label: "Private room",    key: "private", letter: "P" },
  { label: "Shared room",     key: "shared",  letter: "S" },
];

// Every neighbourhood the model knows, grouped by borough.
// The spelling matches the model's training data exactly.
const NEIGHBOURHOODS = {
  "Bronx": [
    "Allerton", "Baychester", "Belmont", "Bronxdale", "Castle Hill", "City Island",
    "Claremont Village", "Clason Point", "Co-op City", "Concourse", "Concourse Village",
    "East Morrisania", "Eastchester", "Edenwald", "Fieldston", "Fordham", "Highbridge",
    "Hunts Point", "Kingsbridge", "Longwood", "Melrose", "Morris Heights", "Morris Park",
    "Morrisania", "Mott Haven", "Mount Eden", "Mount Hope", "North Riverdale", "Norwood",
    "Olinville", "Parkchester", "Pelham Bay", "Pelham Gardens", "Port Morris", "Riverdale",
    "Schuylerville", "Soundview", "Spuyten Duyvil", "Throgs Neck", "Tremont", "Unionport",
    "University Heights", "Van Nest", "Wakefield", "West Farms", "Westchester Square",
    "Williamsbridge", "Woodlawn",
  ],
  "Brooklyn": [
    "Bath Beach", "Bay Ridge", "Bedford-Stuyvesant", "Bensonhurst", "Bergen Beach", "Boerum Hill",
    "Borough Park", "Brighton Beach", "Brooklyn Heights", "Brownsville", "Bushwick", "Canarsie",
    "Carroll Gardens", "Clinton Hill", "Cobble Hill", "Columbia St", "Coney Island",
    "Crown Heights", "Cypress Hills", "DUMBO", "Downtown Brooklyn", "Dyker Heights",
    "East Flatbush", "East New York", "Flatbush", "Flatlands", "Fort Greene", "Fort Hamilton",
    "Gowanus", "Gravesend", "Greenpoint", "Kensington", "Manhattan Beach", "Midwood", "Mill Basin",
    "Navy Yard", "Park Slope", "Prospect Heights", "Prospect-Lefferts Gardens", "Red Hook",
    "Sea Gate", "Sheepshead Bay", "South Slope", "Sunset Park", "Vinegar Hill", "Williamsburg",
    "Windsor Terrace",
  ],
  "Manhattan": [
    "Battery Park City", "Chelsea", "Chinatown", "Civic Center", "East Harlem", "East Village",
    "Financial District", "Flatiron District", "Gramercy", "Greenwich Village", "Harlem",
    "Hell's Kitchen", "Inwood", "Kips Bay", "Little Italy", "Lower East Side", "Marble Hill",
    "Midtown", "Morningside Heights", "Murray Hill", "NoHo", "Nolita", "Roosevelt Island", "SoHo",
    "Stuyvesant Town", "Theater District", "Tribeca", "Two Bridges", "Upper East Side",
    "Upper West Side", "Washington Heights", "West Village",
  ],
  "Queens": [
    "Arverne", "Astoria", "Bay Terrace", "Bayside", "Bayswater", "Belle Harbor", "Bellerose",
    "Breezy Point", "Briarwood", "Cambria Heights", "College Point", "Corona", "Ditmars Steinway",
    "Douglaston", "East Elmhurst", "Edgemere", "Elmhurst", "Far Rockaway", "Flushing",
    "Forest Hills", "Fresh Meadows", "Glendale", "Hollis", "Holliswood", "Howard Beach",
    "Jackson Heights", "Jamaica", "Jamaica Estates", "Jamaica Hills", "Kew Gardens",
    "Kew Gardens Hills", "Laurelton", "Little Neck", "Long Island City", "Maspeth",
    "Middle Village", "Neponsit", "Ozone Park", "Queens Village", "Rego Park", "Richmond Hill",
    "Ridgewood", "Rockaway Beach", "Rosedale", "South Ozone Park", "Springfield Gardens",
    "St. Albans", "Sunnyside", "Whitestone", "Woodhaven", "Woodside",
  ],
  "Staten Island": [
    "Arden Heights", "Arrochar", "Bay Terrace, Staten Island", "Bull's Head", "Castleton Corners",
    "Clifton", "Concord", "Dongan Hills", "Eltingville", "Emerson Hill", "Graniteville",
    "Grant City", "Great Kills", "Grymes Hill", "Howland Hook", "Huguenot", "Mariners Harbor",
    "Midland Beach", "New Brighton", "New Dorp", "New Dorp Beach", "New Springville", "Oakwood",
    "Port Richmond", "Prince's Bay", "Randall Manor", "Rosebank", "Rossville", "Shore Acres",
    "Silver Lake", "South Beach", "St. George", "Stapleton", "Todt Hill", "Tompkinsville",
    "Tottenville", "West Brighton", "Westerleigh", "Willowbrook",
  ],
};

const BOROUGH_CENTERS = {
  "Bronx":         [40.8448, -73.8648],
  "Brooklyn":      [40.6501, -73.9496],
  "Manhattan":     [40.7831, -73.9712],
  "Queens":        [40.7282, -73.7949],
  "Staten Island": [40.5795, -74.1502],
};

// Rough outline of the five boroughs, used to warn about pins placed elsewhere.
const NYC_BOUNDS = { south: 40.45, north: 40.95, west: -74.3, east: -73.65 };

// Starting values: a typical listing from the training data.
const DEFAULTS = {
  neighbourhood_group: "Brooklyn",
  neighbourhood: "Williamsburg",
  latitude: 40.7081,
  longitude: -73.9571,
  price: 106,
  minimum_nights: 3,
  number_of_reviews: 5,
  reviews_per_month: 0.37,
  calculated_host_listings_count: 1,
  availability_365: 45,
};

// One-click examples. Each one fills the form and runs a prediction.
const PRESETS = [
  {
    name: "SoHo loft",
    values: {
      neighbourhood_group: "Manhattan", neighbourhood: "SoHo",
      latitude: 40.7233, longitude: -74.003,
      price: 320, minimum_nights: 4, number_of_reviews: 30, reviews_per_month: 0.8,
      calculated_host_listings_count: 1, availability_365: 150,
    },
  },
  {
    name: "Bushwick room",
    values: {
      neighbourhood_group: "Brooklyn", neighbourhood: "Bushwick",
      latitude: 40.6944, longitude: -73.9213,
      price: 65, minimum_nights: 2, number_of_reviews: 18, reviews_per_month: 0.9,
      calculated_host_listings_count: 1, availability_365: 200,
    },
  },
  {
    name: "Hostel bed",
    values: {
      neighbourhood_group: "Manhattan", neighbourhood: "Hell's Kitchen",
      latitude: 40.7638, longitude: -73.9918,
      price: 40, minimum_nights: 1, number_of_reviews: 10, reviews_per_month: 3,
      calculated_host_listings_count: 5, availability_365: 365,
    },
  },
];

// Numeric fields that have a slider next to them.
const SLIDER_FIELDS = [
  "price",
  "minimum_nights",
  "availability_365",
  "number_of_reviews",
  "reviews_per_month",
  "calculated_host_listings_count",
];

// The three steps on phones and tablets, and which fields belong to each.
const STEPS = [
  { title: "Location",         fields: ["neighbourhood", "latitude", "longitude"] },
  { title: "Price and stay",   fields: ["price", "minimum_nights", "availability_365"] },
  { title: "Reviews and host", fields: ["number_of_reviews", "reviews_per_month", "calculated_host_listings_count"] },
];

// Validation rules. These mirror the limits in schemas.py, so the server
// never has to reject something the form let through.
const RULES = {
  latitude:  { min: -90,  max: 90,  message: "Latitude must be between -90 and 90." },
  longitude: { min: -180, max: 180, message: "Longitude must be between -180 and 180." },
  price:     { min: 0, exclusiveMin: true, message: "Enter a price above $0." },
  minimum_nights: { int: true, min: 1, max: 365, message: "Enter a whole number of nights from 1 to 365." },
  availability_365: { int: true, min: 0, max: 365, message: "Enter a whole number of days from 0 to 365." },
  number_of_reviews: { int: true, min: 0, message: "Enter a whole number, 0 or higher." },
  reviews_per_month: { min: 0, message: "Enter 0 or higher." },
  calculated_host_listings_count: { int: true, min: 0, message: "Enter a whole number, 0 or higher." },
};

const FIELD_LABELS = {
  neighbourhood_group: "Borough",
  neighbourhood: "Neighbourhood",
  latitude: "Latitude",
  longitude: "Longitude",
  price: "Price per night",
  minimum_nights: "Minimum stay",
  availability_365: "Days available a year",
  number_of_reviews: "Total reviews",
  reviews_per_month: "Reviews per month",
  calculated_host_listings_count: "Listings by this host",
};


/* 3. Small helpers */

const app = document.getElementById("app");
const form = document.getElementById("predictForm");
const neighbourhoodSelect = document.getElementById("neighbourhood");
const latInput = document.getElementById("latitude");
const lngInput = document.getElementById("longitude");
const coordNote = document.getElementById("coordNote");
const predictBtn = document.getElementById("predictBtn");
const sign = document.getElementById("sign");
const rowEls = Array.from(document.querySelectorAll("#rows .row"));

const COORD_HINT = "Click the map or drag the pin to set the exact spot.";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// True on phones and tablets, where the form is split into steps.
const stepsQuery = window.matchMedia
  ? window.matchMedia("(max-width: 1099px)")
  : { matches: false, addEventListener() {} };
const usesSteps = () => stepsQuery.matches;

// Trim coordinates to 5 decimals (about 1 metre) without trailing zeros.
const roundCoord = (n) => String(Math.round(n * 1e5) / 1e5);

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatPercent(p) {
  const pct = Math.round(p * 100);
  return p > 0 && pct < 1 ? "<1%" : pct + "%";
}


/* 4. Sliders and number fields */

function paintRange(range) {
  const min = Number(range.min);
  const max = Number(range.max);
  const share = (Number(range.value) - min) / (max - min);
  range.style.setProperty("--p", clamp(share, 0, 1));
}

function getRange(input) {
  const field = input.closest(".slider-field");
  return field ? field.querySelector('input[type="range"]') : null;
}

// Put a value in a number field and move its slider to match.
function setNumber(name, value) {
  const input = form.elements[name];
  input.value = value;

  const range = getRange(input);
  if (range) {
    range.value = clamp(Number(value), Number(range.min), Number(range.max));
    paintRange(range);
  }
}

function setupSliders() {
  document.querySelectorAll(".slider-field").forEach((field) => {
    const number = field.querySelector('input[type="number"]');
    const range = field.querySelector('input[type="range"]');
    paintRange(range);

    // Dragging the slider updates the number.
    range.addEventListener("input", () => {
      number.value = range.value;
      paintRange(range);
      clearError(number.name);
      onNumberChange(number.name);
    });

    // Typing a number moves the slider (it stops at its ends).
    number.addEventListener("input", () => {
      const typed = parseFloat(number.value);
      if (!Number.isNaN(typed)) {
        range.value = clamp(typed, Number(range.min), Number(range.max));
        paintRange(range);
      }
      clearError(number.name);
      onNumberChange(number.name);
    });
  });
}

function onNumberChange(name) {
  if (name === "availability_365") updateAvailabilityHint();
}

function updateAvailabilityHint() {
  const hint = document.getElementById("hint-availability_365");
  const days = parseInt(form.elements.availability_365.value, 10);

  if (Number.isNaN(days) || days < 0 || days > 365) {
    hint.textContent = "Enter a number of days between 0 and 365.";
  } else if (days === 0) {
    hint.textContent = "Not open for booking at all.";
  } else if (days === 365) {
    hint.textContent = "Open every day of the year.";
  } else {
    const share = Math.round((days / 365) * 100);
    hint.textContent = `Open ${days} ${days === 1 ? "day" : "days"} a year, about ${share}% of the year.`;
  }
}


/* 5. Location */

let map = null;
let marker = null;

function populateNeighbourhoods(borough, selected = "") {
  neighbourhoodSelect.innerHTML = "";

  const placeholder = new Option("Choose a neighbourhood", "");
  placeholder.disabled = true;
  neighbourhoodSelect.add(placeholder);

  (NEIGHBOURHOODS[borough] || []).forEach((name) => {
    neighbourhoodSelect.add(new Option(name, name));
  });

  neighbourhoodSelect.value = selected;
  if (!selected) placeholder.selected = true;
}

function setupLocationInputs() {
  form.querySelectorAll('input[name="neighbourhood_group"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      populateNeighbourhoods(radio.value);
      const [lat, lng] = BOROUGH_CENTERS[radio.value];
      setCoords(lat, lng, { view: true, zoom: 11 });
      clearError("neighbourhood");
    });
  });

  neighbourhoodSelect.addEventListener("change", () => clearError("neighbourhood"));

  // Typing coordinates moves the pin.
  [latInput, lngInput].forEach((input) => {
    input.addEventListener("input", () => {
      clearError(input.name);
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lngInput.value);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        moveMarker(lat, lng, { panIfHidden: true });
      }
      updateCoordNote();
    });
  });
}

function isInsideNYC(lat, lng) {
  return lat >= NYC_BOUNDS.south && lat <= NYC_BOUNDS.north &&
         lng >= NYC_BOUNDS.west && lng <= NYC_BOUNDS.east;
}

function updateCoordNote() {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const outside = Number.isFinite(lat) && Number.isFinite(lng) && !isInsideNYC(lat, lng);

  coordNote.classList.toggle("is-warning", outside);
  coordNote.textContent = outside
    ? "This spot is outside New York City. The model only learned from NYC listings, so the result may be unreliable."
    : COORD_HINT;
}

// Update the coordinate fields, the pin and (optionally) the map view.
function setCoords(lat, lng, { view = false, zoom } = {}) {
  latInput.value = roundCoord(lat);
  lngInput.value = roundCoord(lng);
  clearError("latitude");
  clearError("longitude");
  moveMarker(lat, lng, { view, zoom });
  updateCoordNote();
}

function moveMarker(lat, lng, { view = false, zoom, panIfHidden = false } = {}) {
  if (!map) return;

  if (!marker) {
    marker = L.marker([lat, lng], {
      draggable: true,
      title: "Listing location. Drag to move.",
      icon: L.divIcon({
        className: "pin",
        html: "<span></span>",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(map);

    marker.on("dragend", () => {
      const point = marker.getLatLng();
      setCoords(point.lat, point.lng);
    });
  } else {
    marker.setLatLng([lat, lng]);
  }

  if (view) {
    map.setView([lat, lng], zoom || map.getZoom(), { animate: !prefersReducedMotion() });
  } else if (panIfHidden && !map.getBounds().contains([lat, lng])) {
    map.panTo([lat, lng]);
  }
}

// The map needs to re-measure itself after its container was hidden or resized.
function refreshMap() {
  if (map) requestAnimationFrame(() => map.invalidateSize());
}

function initMap() {
  const mapEl = document.getElementById("map");

  // Leaflet comes from a CDN. Without it, the coordinate fields still work.
  if (!window.L) {
    mapEl.classList.add("is-unavailable");
    mapEl.textContent = "The map could not load. Type the latitude and longitude below instead.";
    return;
  }

  map = L.map(mapEl, {
    minZoom: 10,
    maxZoom: 18,
    scrollWheelZoom: false, // keeps the page scrollable while the pointer is over the map
    maxBounds: [[NYC_BOUNDS.south - 0.05, NYC_BOUNDS.west - 0.05], [NYC_BOUNDS.north + 0.05, NYC_BOUNDS.east + 0.05]],
    maxBoundsViscosity: 0.8,
  }).setView([DEFAULTS.latitude, DEFAULTS.longitude], 12);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  // Mouse-wheel zoom only while the map has focus.
  map.on("focus", () => map.scrollWheelZoom.enable());
  map.on("blur", () => map.scrollWheelZoom.disable());

  map.on("click", (event) => setCoords(event.latlng.lat, event.latlng.lng));

  window.addEventListener("load", refreshMap);
  window.addEventListener("resize", refreshMap);
}


/* 6. Validation */

function setError(name, message) {
  const el = document.getElementById("error-" + name);
  const input = form.elements[name];
  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
  const wrap = document.getElementById("wrap-" + name);
  if (wrap) wrap.classList.add("is-invalid");
  if (input && input.setAttribute) input.setAttribute("aria-invalid", "true");
}

function clearError(name) {
  const el = document.getElementById("error-" + name);
  if (el) el.hidden = true;
  const wrap = document.getElementById("wrap-" + name);
  if (wrap) wrap.classList.remove("is-invalid");
  const input = form.elements[name];
  if (input && input.removeAttribute) input.removeAttribute("aria-invalid");
}

function clearAllErrors() {
  Object.keys(FIELD_LABELS).forEach(clearError);
}

// Reads the form and returns { payload, errors }.
// The payload matches the Features model in schemas.py.
function collectPayload() {
  const payload = {};
  const errors = [];

  payload.neighbourhood_group = form.elements.neighbourhood_group.value;

  payload.neighbourhood = neighbourhoodSelect.value;
  if (!payload.neighbourhood) {
    errors.push({ name: "neighbourhood", message: `Choose a neighbourhood in ${payload.neighbourhood_group}.` });
  }

  Object.entries(RULES).forEach(([name, rule]) => {
    const raw = form.elements[name].value.trim();
    const value = Number(raw);

    if (raw === "" || !Number.isFinite(value)) {
      errors.push({ name, message: "Enter a value." });
      return;
    }

    const tooLow = rule.exclusiveMin ? value <= rule.min : value < rule.min;
    const tooHigh = rule.max !== undefined && value > rule.max;
    const notWhole = rule.int && !Number.isInteger(value);

    if (tooLow || tooHigh || notWhole) {
      errors.push({ name, message: rule.message });
      return;
    }
    payload[name] = value;
  });

  return { payload, errors };
}

const stepOfField = (name) => STEPS.findIndex((step) => step.fields.includes(name)) + 1;

function showFieldErrors(errors) {
  errors.forEach(({ name, message }) => setError(name, message));
  const first = form.elements[errors[0].name];
  if (first && first.focus) first.focus();
}


/* 7. Steps (phones and tablets) */

let currentStep = 1;

const stepLabel = document.getElementById("stepLabel");
const progressBars = Array.from(document.querySelectorAll(".progress span"));

// view is "step1", "step2", "step3" or "result".
// On desktop everything is visible and the CSS ignores this value.
function setView(view, { focusHeading = false } = {}) {
  app.dataset.view = view;

  if (view.startsWith("step")) {
    currentStep = Number(view.slice(4));
    stepLabel.textContent = `Step ${currentStep} of ${STEPS.length}`;
    progressBars.forEach((bar, i) => {
      bar.classList.toggle("is-done", i < currentStep - 1);
      bar.classList.toggle("is-current", i === currentStep - 1);
    });
  }

  if (view === "step1") refreshMap();

  if (focusHeading && usesSteps()) {
    const heading = view === "result"
      ? document.getElementById("signTitle")
      : document.querySelector(`.step[data-step="${currentStep}"] h2`);
    if (heading) heading.focus({ preventScroll: true });
  }
}

// Checks only the fields on the current step.
function stepIsValid(step) {
  clearAllErrors();
  const { errors } = collectPayload();
  const mine = errors.filter((error) => STEPS[step - 1].fields.includes(error.name));
  if (mine.length) showFieldErrors(mine);
  return mine.length === 0;
}

function goNext() {
  if (!stepIsValid(currentStep)) return;
  setView("step" + Math.min(currentStep + 1, STEPS.length), { focusHeading: true });
}

function goBack() {
  setView("step" + Math.max(currentStep - 1, 1), { focusHeading: true });
}


/* 8. Result sign */

function setSignState(state) {
  sign.dataset.state = state;
}

function resetRows() {
  rowEls.forEach((row) => {
    row.classList.remove("is-top");
    row.style.setProperty("--p", 0);
    row.querySelector(".pct").textContent = "";
  });
}

function showLoading() {
  resetRows();
  document.getElementById("rawBox").hidden = true;
  setSignState("loading");
}

function showIdle() {
  resetRows();
  document.getElementById("rawBox").hidden = true;
  setSignState("idle");
}

function showError({ title, message, hint = "" }) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  const hintEl = document.getElementById("errorHint");
  hintEl.textContent = hint;
  hintEl.hidden = !hint;
  setSignState("error");
}

// Turn the API response into an array of probabilities, one per room type.
function readProbabilities(data) {
  // { probabilities: { "Private room": 0.7, ... } } is matched by label.
  if (data.probabilities && typeof data.probabilities === "object") {
    const list = ROOM_TYPES.map((type) => Number(data.probabilities[type.label]));
    if (list.every(Number.isFinite)) return list;
  }
  // { probability: [p0, p1, p2] } follows model.classes_ order.
  if (Array.isArray(data.probability) && data.probability.length === ROOM_TYPES.length) {
    return data.probability.map(Number);
  }
  return null;
}

function showResult(data, payload) {
  const probs = readProbabilities(data);
  let topIndex = ROOM_TYPES.findIndex((type) => type.label === data.predicted_room_type);

  if (topIndex === -1 && probs) topIndex = probs.indexOf(Math.max(...probs));
  if (topIndex === -1) {
    showError({
      title: "The server sent an unexpected answer",
      message: "The response did not include a room type this page recognises.",
      hint: "Check that the API returns predicted_room_type and probability.",
    });
    return;
  }

  const top = ROOM_TYPES[topIndex];

  // Headline
  const bullet = document.getElementById("resultBullet");
  bullet.dataset.type = top.key;
  bullet.textContent = top.letter;
  document.getElementById("resultName").textContent = top.label;
  document.getElementById("resultConfidence").textContent =
    probs ? `${formatPercent(probs[topIndex])} confident` : "";

  // One-line recap of what was predicted
  const nights = payload.minimum_nights;
  document.getElementById("resultRecap").textContent =
    `${payload.neighbourhood}, ${payload.neighbourhood_group}: ${formatPrice(payload.price)} a night, ` +
    `${nights} ${nights === 1 ? "night" : "nights"} minimum.`;

  // Close call warning
  const note = document.getElementById("resultNote");
  note.hidden = true;
  if (probs) {
    const ranked = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
    if (ranked[0].p - ranked[1].p < 0.15) {
      const second = ROOM_TYPES[ranked[1].i];
      note.textContent = `Close call: ${second.label} is nearly as likely (${formatPercent(ranked[1].p)}).`;
      note.hidden = false;
    }
  }

  // Rows: percentages now, bar widths on the next frame so they animate
  rowEls.forEach((row, i) => {
    row.classList.toggle("is-top", i === topIndex);
    row.querySelector(".pct").textContent = probs ? formatPercent(probs[i]) : "";
  });

  setSignState("result");

  if (probs) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rowEls.forEach((row, i) => row.style.setProperty("--p", probs[i]));
    }));
  }
}

function showRaw(payload, responseBody) {
  document.getElementById("rawOutput").textContent =
    `POST ${API_URL}/predict\n\n` +
    JSON.stringify(payload, null, 2) +
    "\n\nResponse\n\n" +
    JSON.stringify(responseBody, null, 2);
  document.getElementById("rawBox").hidden = false;
}


/* 9. Talking to the API */

class ApiError extends Error {
  constructor(status, body) {
    super("API error " + status);
    this.status = status;
    this.body = body;
  }
}

const apiStatus = document.getElementById("apiStatus");
const apiStatusText = document.getElementById("apiStatusText");

function setApiStatus(state) {
  const text = {
    checking: "Checking server",
    online: "Server connected",
    offline: "Server offline. Retry",
  };
  apiStatus.dataset.state = state;
  apiStatusText.textContent = text[state];
}

async function checkApi() {
  setApiStatus("checking");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(API_URL + "/health", { signal: controller.signal });
    setApiStatus(response.ok ? "online" : "offline");
  } catch {
    setApiStatus("offline");
  } finally {
    clearTimeout(timer);
  }
}

let requestId = 0; // lets us ignore an answer that arrives after Reset

function setBusy(busy) {
  predictBtn.disabled = busy;
  predictBtn.querySelector(".btn-label").textContent = busy ? "Predicting" : "Predict room type";
}

// FastAPI sends validation problems as { detail: [{ loc: [...], msg: "..." }] }.
function handleValidationError(body) {
  const items = body && Array.isArray(body.detail) ? body.detail : [];
  const lines = [];

  items.forEach((item) => {
    const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
    const label = FIELD_LABELS[field] || field || "Input";
    lines.push(`${label}: ${item.msg}`);
    if (FIELD_LABELS[field]) setError(field, item.msg);
  });

  showError({
    title: "The server rejected some values",
    message: lines.length ? lines.join(". ") + "." : "Check the highlighted fields and try again.",
    hint: "Choose Edit listing to fix them.",
  });
}

async function predict() {
  clearAllErrors();
  const { payload, errors } = collectPayload();

  if (errors.length) {
    // On phones, jump to the step that has the first problem.
    if (usesSteps()) setView("step" + stepOfField(errors[0].name));
    showFieldErrors(errors);
    return;
  }

  const thisRequest = ++requestId;
  setBusy(true);
  showLoading();
  if (usesSteps()) setView("result", { focusHeading: true });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_URL + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);
    if (thisRequest !== requestId) return; // form was reset while waiting

    if (!response.ok) throw new ApiError(response.status, body);

    setApiStatus("online");
    showResult(body, payload);
    showRaw(payload, body);
  } catch (error) {
    if (thisRequest !== requestId) return;

    if (error instanceof ApiError && error.status === 422) {
      handleValidationError(error.body);
    } else if (error instanceof ApiError) {
      showError({
        title: "The server ran into a problem",
        message: `It answered with status ${error.status} instead of a prediction.`,
        hint: "Check the terminal where the API is running for the error message.",
      });
    } else if (error.name === "AbortError") {
      setApiStatus("offline");
      showError({
        title: "The server took too long",
        message: "No answer came back in time.",
        hint: "Make sure the API is running, then try again.",
      });
    } else {
      setApiStatus("offline");
      showError({
        title: "Can't reach the prediction server",
        message: `Nothing answered at ${API_URL || "this address"}.`,
        hint: "Start the API with: uvicorn app.main:app --reload. If it runs somewhere else, update API_URL at the top of script.js.",
      });
    }
  } finally {
    clearTimeout(timer);
    if (thisRequest === requestId) setBusy(false);
  }
}


/* 10. Start-up */

function applyValues(values) {
  const radio = form.querySelector(`input[name="neighbourhood_group"][value="${values.neighbourhood_group}"]`);
  if (radio) radio.checked = true;

  populateNeighbourhoods(values.neighbourhood_group, values.neighbourhood);
  setCoords(values.latitude, values.longitude, { view: true, zoom: 13 });
  SLIDER_FIELDS.forEach((name) => setNumber(name, values[name]));
  updateAvailabilityHint();
  clearAllErrors();
}

// The example chips appear in the header (desktop) and on step 1 (phones).
function renderPresets() {
  ["presetsTop", "presetsStep"].forEach((id) => {
    const list = document.getElementById(id);
    PRESETS.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.textContent = preset.name;
      button.addEventListener("click", () => {
        applyValues(preset.values);
        predict();
      });
      list.appendChild(button);
    });
  });
}

function resetForm() {
  requestId++;            // ignore any request still in flight
  setBusy(false);
  applyValues(DEFAULTS);
  showIdle();
  setView("step1", { focusHeading: true });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  // Pressing Enter on an early step moves on instead of predicting.
  if (usesSteps() && currentStep < STEPS.length) goNext();
  else predict();
});

document.getElementById("nextBtn").addEventListener("click", goNext);
document.getElementById("backBtn").addEventListener("click", goBack);
document.getElementById("resetBtn").addEventListener("click", resetForm);
document.getElementById("restartBtn").addEventListener("click", resetForm);
document.getElementById("editBtn").addEventListener("click", () => {
  setView("step" + STEPS.length, { focusHeading: true });
});
apiStatus.addEventListener("click", checkApi);

// Switching between the phone layout and the desktop layout (rotating a tablet, resizing a window).
stepsQuery.addEventListener("change", refreshMap);

setupSliders();
setupLocationInputs();
initMap();
renderPresets();
applyValues(DEFAULTS);
setView("step1");
checkApi();