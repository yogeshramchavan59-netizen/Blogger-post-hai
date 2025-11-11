const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const CLIENT_ID = "707933033445-t180k6ir38ulp8kc5gmg9q6ej2gvei7t.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const BLOG_ID = "7622125566585454468";
const REDIRECT_URI = "https://yourappname.onrender.com/auth/google/callback"; // Render URL बाद में बदलना

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "tokens.json");

function saveTokens(tokens) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
}

function loadTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH));
  }
  return null;
}

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/blogger"],
  });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  saveTokens(tokens);
  res.send("✅ Authorization successful! You can close this tab now.");
});

app.post("/create-post", async (req, res) => {
  const tokens = loadTokens();
  if (!tokens) return res.status(401).send("Not authorized yet.");
  oauth2Client.setCredentials(tokens);

  const blogger = google.blogger({ version: "v3", auth: oauth2Client });
  const { title, content } = req.body;

  try {
    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      requestBody: { title, content },
    });
    res.json({ success: true, link: response.data.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(10000, () => console.log("✅ Server started on port 10000"));
