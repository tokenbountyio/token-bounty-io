const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync("./index.html", "utf-8");
const storeCode = fs.readFileSync("./store.js", "utf-8");
const appCode = fs.readFileSync("./app.js", "utf-8");

const dom = new JSDOM(html, { runScripts: "outside-only" });

const window = dom.window;
const document = window.document;

// Mock fetch and API_BASE_URL context
window.fetch = async () => ({ json: async () => ({ success: true, projects: [] }) });
window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

try {
    dom.window.eval(storeCode);
    console.log("✅ store.js executed successfully.");
} catch(e) {
    console.log("❌ ERROR IN store.js:", e.message);
}

try {
    dom.window.eval(appCode);
    console.log("✅ app.js executed successfully.");
} catch(e) {
    console.log("❌ ERROR IN app.js:", e.message);
}

// Fire DOMContentLoaded
const event = document.createEvent("Event");
event.initEvent("DOMContentLoaded", true, true);
try {
    document.dispatchEvent(event);
    console.log("✅ DOMContentLoaded fired successfully.");
} catch(e) {
    console.log("❌ ERROR IN DOMContentLoaded:", e.message);
}

setTimeout(() => {
    // Try calling openRegisterModal directly
    try {
        dom.window.eval("openRegisterModal()");
        console.log("✅ openRegisterModal executed successfully.");
    } catch(e) {
        console.log("❌ ERROR IN openRegisterModal:", e.message, e.stack);
    }
}, 500);
