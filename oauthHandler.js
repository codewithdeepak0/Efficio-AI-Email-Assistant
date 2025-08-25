const http = require("http");
const url = require("url");
const opn = require("open");
const destroyer = require("server-destroy");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  YOUR_CLIENT_ID,
  YOUR_CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    // Create an HTTP server to handle the callback
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf("/oauth2callback") > -1) {
            const qs = new url.URL(req.url, "http://localhost:3000")
              .searchParams;
            const code = qs.get("code");
            console.log(`Code is ${code}`);
            res.end("Authentication successful! Please return to the console.");
            server.destroy();
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.credentials = tokens;
            resolve(oauth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        // Open the browser to the authorize url to start the workflow
        const authorizeUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: "https://www.googleapis.com/auth/calendar.readonly",
        });
        opn(authorizeUrl, { wait: false }).then((cp) => cp.unref());
      });
    destroyer(server);
  });
}

module.exports = { getAuthenticatedClient };
