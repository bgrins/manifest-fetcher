const fs = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// How long before giving up:
const MAX_FETCH_TIME = 30000;

// Max 500
const NUM_TOP_PAGES = 500;

const MANIFEST_URL_RESULTS = new Map();

function getManifestURL(page, dom) {
  let document = dom.window.document;
  var elem = document.querySelector("link[rel~='manifest']");
  if (!elem || !elem.getAttribute("href")) {
    console.log(`no manifest for ${page}`);
  } else {
    var manifestURL = new dom.window.URL(elem.href, elem.baseURI);
    console.log(`found manifest for ${page}: ${manifestURL}`);
    return manifestURL.href;
  }
  return null;
}

(async () => {
  let numFetched = 0;
  const INPUT_PAGES = fs
    .readFileSync("input.csv", "utf8")
    .trim()
    .split("\n")
    .slice(1, NUM_TOP_PAGES)
    .map((line) => {
      return `https://${line.split(",")[1].replace(/['"]+/g, "")}`;
    });
  let promises = INPUT_PAGES.map(async (page) => {
    console.log("Fetching", page);
    MANIFEST_URL_RESULTS.set(page, null);

    let markup;
    let timedout = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      timedout = true;
    }, MAX_FETCH_TIME);
    try {
      let response = await fetch(page, { signal: controller.signal });
      markup = await response.text();
      console.log("Responding", page, ++numFetched);
      if (response.ok) {
        const dom = new JSDOM(markup, {
          url: page,
        });
        MANIFEST_URL_RESULTS.set(page, getManifestURL(page, dom));
      }
    } catch (e) {
      MANIFEST_URL_RESULTS.set(
        page,
        timedout ? "Error: timeout" : "Error: fetch"
      );
    } finally {
      clearTimeout(timeout);
    }
  });
  await Promise.all(promises);
  let output = [...MANIFEST_URL_RESULTS.entries()]
    .map(([page, manifest]) => {
      if (manifest && manifest.startsWith("Error")) {
        return `${page},,${manifest}`;
      } else {
        return `${page},${manifest || ""},`;
      }
    })
    .join("\n");
  fs.writeFileSync("output.csv", output);
})();
