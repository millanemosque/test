/* Shared config + helpers for the Mill Lane Prayer Times app */
const MOSQUE = {
  name: "Mill Lane Muslim Association",
  short: "Mill Lane",
  address: "United Reformed Church Hall, Mill Lane, Chadwell Heath, Dagenham RM6 6RS",
  phone: "07540 749546",
  phoneIntl: "+447540749546",
  maps: "https://www.google.com/maps/search/?api=1&query=United+Reformed+Church+Hall+Mill+Lane+RM6+6RS",
  website: "https://mill-lane-muslim-association.org.uk/",
  whatsapp: "https://chat.whatsapp.com/D3EC4iomnb6LnL73duIt0t",
  charity: "1204287",
  bank: { name: "Lloyds Bank", account: "Mill Lane Muslim Association", sort: "30-96-26", number: "75851960" },
  lat: 51.5735, lon: 0.1262          // Mill Lane, Chadwell Heath
};

const PRAYERS = [
  { key: "zuhr", label: "Zuhr", fridayLabel: "Jumu'ah" },
  { key: "asar", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" }
];

const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* Sunset (local Date) using the standard sunrise equation, accurate to ~1 min */
function sunset(dateObj, lat = MOSQUE.lat, lon = MOSQUE.lon) {
  const r = Math.PI / 180;
  const jd0 = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) / 864e5 + 2440587.5;
  const n = Math.ceil(jd0 - 2451545 + 0.0008);
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * r) + 0.02 * Math.sin(2 * M * r) + 0.0003 * Math.sin(3 * M * r);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * r) - 0.0069 * Math.sin(2 * L * r);
  const dec = Math.asin(Math.sin(L * r) * Math.sin(23.4397 * r));
  const cosW = (Math.sin(-0.833 * r) - Math.sin(lat * r) * Math.sin(dec)) / (Math.cos(lat * r) * Math.cos(dec));
  const w = Math.acos(cosW) / r;
  return new Date((Jt + w / 360 - 2440587.5) * 864e5);
}

/* "12:30 & 13:00" -> ["12:30","13:00"]; "sunset"/"After Sunset" -> sunset time */
function prayerTimes(day, key) {
  const raw = (day[key] || "").trim();
  if (!raw) return [];
  if (key === "maghrib" && /sunset/i.test(raw)) {
    const s = sunset(parseISO(day.date));
    s.setSeconds(0, 0); s.setMinutes(s.getMinutes() + 1);   // round up
    return [{ text: fmtTime(s), sunset: true }];
  }
  return (raw.match(/\d{1,2}[:.]\d{2}/g) || []).map(t => ({ text: t.replace(".", ":").padStart(5, "0") }));
}

function atTime(dateStr, hhmm) {
  const d = parseISO(dateStr); const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0); return d;
}

const dayName = s => parseISO(s).toLocaleDateString("en-GB", { weekday: "long" });
const isFriday = s => parseISO(s).getDay() === 5;
