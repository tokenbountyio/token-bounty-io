const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");

const storeCode = fs.readFileSync("./store.js", "utf-8");
const appCode = fs.readFileSync("./app.js", "utf-8");
const html = fs.readFileSync("./index.html", "utf-8");

const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console);

const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });

try {
    dom.window.eval(storeCode);
    console.log("✅ store.js executed successfully.");
} catch (e) {
    console.error("❌ Error executing store.js:", e.message);
}

try {
    dom.window.eval(appCode);
    console.log("✅ app.js executed successfully.");
} catch (e) {
    console.error("❌ Error executing app.js:", e.message);
}

const event = dom.window.document.createEvent("Event");
event.initEvent("DOMContentLoaded", true, true);
dom.window.document.dispatchEvent(event);

setTimeout(() => {
    console.log("⏳ Waiting 1s for async operations to complete...");
}, 1000);
