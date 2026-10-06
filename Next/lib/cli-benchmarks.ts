export const cliBenchmarks = {
  date: "6 October 2026",
  measuredRuns: 60,
  warmups: 5,
  rows: [
    { command: "--help", js: 197.916, npm: 29.302, native: 2.113 },
    { command: "--version", js: 192.82, npm: 29.397, native: 2.032 },
    {
      command: "list",
      detail: "200 files",
      js: 230.002,
      npm: 32.734,
      native: 5.471,
    },
  ],
};
