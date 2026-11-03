const clusters = {
  fintech:  { name: 'Fintech platform',     color: '#ff5c7a', at: [-2.6, 0.5, 0.2] },
  ai:       { name: 'AI agents',            color: '#6fe3ff', at: [1.7, 1.5, -0.6] },
  hardware: { name: 'Hardware & vision',    color: '#ffd27a', at: [2.1, -1.4, 0.5] },
  records:  { name: 'Records & logistics',  color: '#c3a6ff', at: [-1.7, -1.7, -0.2] }
};

const projects = [
  { c: 'fintech',  n: 'Dialer App', s: ['Flutter', 'VoIP', 'REST API'], d: ['Cross-platform mobile alternative to VoIP for automated agent calling.', 'Monitored in real time through a backend API connected to Symphony, the main system.'], o: [-.7, .9, .3] },
  { c: 'fintech',  n: 'Symphony', s: ['Laravel', 'MySQL', 'REST API'], d: ['Lenderly’s core embedded system.', 'Unifies and automates workflows across multiple corporate departments.'], o: [.3, -.1, -.2] },
  { c: 'fintech',  n: 'Lending App / Portal', s: ['React', 'REST API'], d: ['Cross-platform customer portal enabling B2P and account self-service.'], o: [-.5, -.9, .5] },
  { c: 'ai',       n: 'Lea AI', s: ['AI / LLM', 'REST API', 'RAG'], d: ['AI-powered platform for automated credit investigation.', 'Customer chat support and 24/7 AI cold-calling for CRM outreach.'], o: [.4, .5, 0] },
  { c: 'ai',       n: 'Frank AI', s: ['AI / LLM', 'Multi-agent orchestration'], d: ['General-knowledge AI assistant trained on the business.', 'Automates workload across multiple internal agents.'], o: [-.4, -.5, .4] },
  { c: 'hardware', n: 'Seedling Monitoring & Crop Disease Detection', s: ['Flutter-Dart', 'SQLite', 'TensorFlow', 'Arduino C++'], d: ['Remotely controls hardware functions from the app.', 'Identifies crop disease with an image recognition algorithm.', 'Built with hardware sensors and Arduino Nano to monitor the plant’s environment.'], o: [.6, .6, -.3] },
  { c: 'hardware', n: 'AI Garbage Segregation', s: ['Python', 'OpenCV', 'TensorFlow', 'Raspberry Pi'], d: ['Computer vision-based system for automated garbage segregation.'], o: [-.2, -.2, .5] },
  { c: 'hardware', n: 'Water Tank Temperature Monitor', s: ['Flutter', 'Firebase', 'Python', 'Arduino C++'], d: ['Cross-platform app for real-time water tank temperature monitoring using Arduino-based sensors.'], o: [.3, -.9, -.2] },
  { c: 'records',  n: 'Blockchain Medical Documents', s: ['PHP', 'MySQL', 'Express JS', 'React'], d: ['Issues verifiable medical documents following the Digital Identifier (DID) standard.', 'Stores data on a blockchain-based database, with MIS and appointment systems for hospital workflow.'], o: [-.5, .5, .2] },
  { c: 'records',  n: 'Barcode Scanning App (WMS)', s: ['Flutter', 'Python'], d: ['Built in Flutter with a key action listener for external or internal scanner hardware.', 'Optionally uses the mobile camera as a barcode scanner.'], o: [.5, -.4, -.1] }
];


// per-project metadata used by the detail pages (facts only from the CV; add links / shots when you have them)
const meta = [
  { slug: 'dialer',               kind: 'Cross-platform mobile app', ctx: 'Connected to Symphony, the main system.' },
  { slug: 'symphony',             kind: 'Web system',                ctx: 'Lenderly\u2019s core system.' },
  { slug: 'lending-portal',       kind: 'Cross-platform web portal' },
  { slug: 'lea-ai',               kind: 'AI platform',               ctx: 'Built and scaled at Lenderly Finance Corporation (2025 \u2014 Present).' },
  { slug: 'frank-ai',             kind: 'AI assistant' },
  { slug: 'seedling-monitor',     kind: 'Mobile app + IoT + machine learning' },
  { slug: 'garbage-segregation',  kind: 'Computer vision + embedded' },
  { slug: 'water-tank-monitor',   kind: 'Cross-platform app + IoT' },
  { slug: 'blockchain-medical',   kind: 'Web app + blockchain' },
  { slug: 'barcode-wms',          kind: 'Cross-platform mobile app' }
];
projects.forEach((p, i) => Object.assign(p, meta[i]));
// Optional per project (see assets/projects/README.txt):
//   shots: ['assets/projects/<slug>/1.jpg', ...]   links: [{ label: 'Live demo', url: 'https://...' }]

// constellation edges: within a group, plus a few cross links
const pairs = [];
projects.forEach((p, i) => projects.forEach((q, j) => { if (j > i && p.c === q.c) pairs.push([i, j]); }));
pairs.push([1, 0], [3, 1], [4, 3], [3, 0], [6, 4], [9, 1], [8, 9], [7, 6]);
