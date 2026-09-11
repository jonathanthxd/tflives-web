// Offline-only Next font responses for local build validation. Never loaded by
// the application; set NEXT_FONT_GOOGLE_MOCKED_RESPONSES to this file manually.
const css = (family, file) => `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: 100 900;
  src: url(${file}.woff2) format('woff2');
}`;

module.exports = {
  "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap": css("Inter", "inter-offline"),
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap": css("Space Grotesk", "space-grotesk-offline"),
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap": css("JetBrains Mono", "jetbrains-mono-offline"),
};
