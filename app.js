const fs = require("fs");
const path = require("path");
const express = require("express");

// --------------------
// FILE LOGGING SETUP
// --------------------
const LOG_DIR = "logs";
const LOG_FILE = path.join(LOG_DIR, "whatsapp_logs.txt");

function saveToTextFile(msg) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
  }

  const line =
    `[${new Date().toISOString()}] ` +
    `FROM=${msg.from} | ` +
    `MESSAGE="${msg.text?.body}"\n`;

  fs.appendFileSync(LOG_FILE, line, "utf8");
}

// --------------------
// EXPRESS APP
// --------------------
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// --------------------
// WEBHOOK VERIFY (GET)
// --------------------
app.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// --------------------
// WEBHOOK RECEIVE (POST)
// --------------------
app.post("/", (req, res) => {
  try {
    const msg =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!msg || msg.type !== "text") {
      return res.sendStatus(200);
    }

    // SAVE MESSAGE TO TEXT FILE ✅
    saveToTextFile(msg);

    console.log("Saved WhatsApp message to text file");
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// --------------------
// DOWNLOAD LOG FILE
// --------------------
app.get("/download-logs", (req, res) => {
  const logPath = path.join(__dirname, "logs", "whatsapp_logs.txt");

  if (!fs.existsSync(logPath)) {
    return res.status(404).send("Log file not found");
  }

  res.download(logPath, "whatsapp_logs.txt");
});


// --------------------
// START SERVER
// --------------------
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
