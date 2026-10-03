/**
 * Home page copy: "Works with your MyChron files" + "Race Studio 3 vs N10" FAQ.
 * Keep in sync with the FAQPage JSON-LD in index.html (crawlers read that copy).
 */
export const WORKS_WITH_TITLE = 'Works with your MyChron files on Mac, iPhone and Android'

export const WORKS_WITH_BODY = [
  'Import .xrk, .xrz or Race Studio CSV exports right in the browser on Mac, iPhone, iPad or Android — no Windows needed.',
  'N10 shows lap times, sector and delta, GPS speed, RPM and exit RPM, then gives you a coaching note and a setup note.',
  'Sessions stay on your device.',
].join(' ')

export const FAQ_TITLE = 'Race Studio 3 vs N10'

export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: 'Is N10 a Race Studio 3 alternative?',
    a: 'For between-runs analysis on Mac and phone, yes. N10 reads your MyChron session in the browser and gives you lap times, delta, speed, RPM, a coaching note and a setup note before the next outing. Race Studio 3 remains the full Windows tool for deep analysis and logger configuration.',
  },
  {
    q: 'Does N10 work on Mac without Windows?',
    a: 'Yes. N10 runs in the browser on Mac, iPhone, iPad and Android — no Windows, Boot Camp or virtual machine needed. On iPhone or iPad, tap Share → Add to Home Screen to open it like an app. Your sessions stay on the device.',
  },
  {
    q: 'Which MyChron files does N10 read?',
    a: 'Native MyChron .xrk and .xrz files, and CSV files exported from Race Studio (lap, time, GPS speed, RPM, distance; sectors when present). Files are read on your device and sessions stay on the device.',
  },
  {
    q: 'What does N10 not do that Race Studio 3 does?',
    a: 'N10 is not full Race Studio 3 parity. It does not do water temp, EGT or CHT maps, TPS or brake pressure analysis, or full channel math. N10 focuses on laps, delta, speed, RPM and exit RPM, plus the coaching note and the setup note.',
  },
]
