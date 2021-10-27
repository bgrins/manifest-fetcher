// This should run after running get-urls.js

const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const MANIFEST_JSON_RESULTS = new Map();

(async () => {
  const OUTPUT_PAGES = fs
    .readFileSync("output.csv", "utf8")
    .trim()
    .split("\n")
    .filter((page) => page.split(",")[1]);

  console.log(`${OUTPUT_PAGES.length} manifests`);

  for (let page of OUTPUT_PAGES) {
    console.log("Processing ", page, page.split(",")[1]);
    try {
      let result = await fetch(page.split(",")[1]);
      let json = await result.json();
      MANIFEST_JSON_RESULTS.set(page.split(",")[0], json);
    } catch (e) {
      console.error("Error", e);
    }
  }

  for (let [key, val] of MANIFEST_JSON_RESULTS.entries()) {
    console.log(key, val);
  }
  fs.writeFileSync(
    `output-manifest-content.json`,
    JSON.stringify(Object.fromEntries(MANIFEST_JSON_RESULTS), null, 2)
  );
})();
