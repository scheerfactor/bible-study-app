import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = await readFile(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const requiredSignals = [
  'id: "thru-the-bible"',
  'permissionStatus: "Copyrighted · free sharing allowed under TTB\'s published conditions"',
  "This material is not public domain.",
  "no fee is charged",
  'officialUrl: "https://ttb.org/resources/free-downloads"',
  'contactUrl: "https://ttb.org/about/contact-us"',
  'id: "way-of-life-literature"',
  "free ebooks may be given to others but may not be posted or distributed from other websites",
  'officialUrl: "https://www.wayoflife.org/sharing/"',
  'contactUrl: "mailto:support@wayoflife.org"',
  'id: "publisher-store-pilot"',
  "An official product link that sends the reader to your store.",
  "An authorized reseller arrangement with agreed pricing, inventory, fulfillment, returns, reporting, and payment terms.",
  "Nothing would be hosted, copied, sold, or described beyond the scope you approve.",
  "Review official policy",
  "Open official contact",
  'id: "ttb-first-contact"',
  'recipient: "info@ttb.org"',
  "keeping this material outside every paid feature",
  'id: "way-of-life-first-contact"',
  "Bible Times and Ancient Kingdoms",
  "Things Hard to Be Understood",
  "Way of Life Encyclopedia of the Bible and Christianity",
  'id: "bo-wagner-first-contact"',
  'recipient: "2knowhim@cbc-web.org"',
  "no book or media file would be copied, hosted, sold, narrated, or placed behind paid access",
  "Three exact messages, verified and waiting for founder review",
  "0 of 3 sent",
  "Copying a draft does not open an email or send a message.",
];

const missing = requiredSignals.filter((signal) => !source.includes(signal));
if (missing.length) {
  console.error(`Acquisition outreach contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Acquisition outreach contract passed: named partners, official contacts, free-use boundaries, authorized Store choices, and three unsent approval-ready messages are present.");
