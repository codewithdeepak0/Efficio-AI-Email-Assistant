require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const readline = require("readline");
const {
  connectToImap,
  fetchEmails,
  parseEmail,
} = require("./utils/emailUtils");
const { parseDateTime } = require("./utils/dateTimeParser");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];
const TOKEN_PATH = path.join(process.cwd(), "config", "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "config", "credentials.json");

const twilioClient = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function addEventToCalendar(auth, eventDetails) {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: eventDetails.endDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    console.log("Event created:", res.data.htmlLink);
    return res.data.htmlLink;
  } catch (err) {
    console.error("Error creating event:", err);
    throw err;
  }
}

async function sendWhatsAppMessage(message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.USER_WHATSAPP_NUMBER,
    });
    console.log("WhatsApp message sent successfully");
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}

async function getUserCriteria() {
  console.log("\nSpecify your email fetching criteria:");
  const from = await askQuestion("From (leave blank for any): ");
  const subject = await askQuestion("Subject contains (leave blank for any): ");
  const since = await askQuestion(
    "Fetch emails since (YYYY-MM-DD, leave blank for last 24 hours): "
  );
  const maxEmails = await askQuestion(
    "Maximum number of emails to fetch (leave blank for all): "
  );

  return {
    from: from || undefined,
    subject: subject || undefined,
    since: since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000),
    maxEmails: maxEmails ? parseInt(maxEmails) : undefined,
  };
}

async function fetchTargetedEmails(criteria) {
  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 30000,
      connTimeout: 30000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  try {
    const connection = await connectToImap(config);

    let searchCriteria = ["ALL"];
    if (criteria.from) searchCriteria.push(["FROM", criteria.from]);
    if (criteria.subject) searchCriteria.push(["SUBJECT", criteria.subject]);
    searchCriteria.push(["SINCE", criteria.since.toISOString()]);

    const fetchOptions = { bodies: ["HEADER", "TEXT", ""], markSeen: false };
    const messages = await fetchEmails(
      connection,
      searchCriteria,
      fetchOptions
    );

    const messagesToProcess = criteria.maxEmails
      ? messages.slice(0, criteria.maxEmails)
      : messages;

    const processedEmails = await Promise.all(
      messagesToProcess.map(parseEmail)
    );

    connection.end();
    return processedEmails;
  } catch (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

async function displayEmails(emails) {
  emails.forEach((email, index) => {
    console.log(`
Email ${index + 1}:
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${email.date}
Body (preview): ${email.text.substring(0, 100)}${
      email.text.length > 100 ? "..." : ""
    }
Attachments: ${
      email.attachments.length > 0
        ? email.attachments.map((a) => `- ${a.filename}`).join(", ")
        : "None"
    }
Links: ${
      email.links.length > 0
        ? email.links.map((l) => `- ${l.text}: ${l.href}`).join("\n       ")
        : "None"
    }
`);
  });

  const emailIndex = await askQuestion(
    "\nEnter the email number to view full details, reply, or type 'exit' to quit: "
  );

  if (emailIndex.toLowerCase() === "exit") {
    console.log("Exiting...");
    rl.close();
    return;
  }

  const selectedEmail = emails[parseInt(emailIndex) - 1];

  if (selectedEmail) {
    console.log(`
Full Details:
From: ${selectedEmail.from}
To: ${selectedEmail.to}
Subject: ${selectedEmail.subject}
Date: ${selectedEmail.date}
Body:
${selectedEmail.text}

Attachments:
${
  selectedEmail.attachments.length > 0
    ? selectedEmail.attachments
        .map((a) => `${a.filename} (${a.contentType}, ${a.size} bytes)`)
        .join("\n")
    : "None"
}

Links:
${
  selectedEmail.links.length > 0
    ? selectedEmail.links.map((l) => `${l.text}: ${l.href}`).join("\n")
    : "None"
}
`);

    const action = await askQuestion(
      "Do you want to reply to this email? (yes/no): "
    );
    if (action.toLowerCase() === "yes") {
      await replyToEmail(selectedEmail);
    }
  } else {
    console.log("Invalid email number.");
  }
}

async function replyToEmail(email) {
  const replyBody = await askQuestion("\nEnter your reply: ");
  const htmlReply = await askQuestion("\nEnter your HTML reply (optional): ");

  const subject = `Re: ${email.subject}`;
  const toEmail = email.from;
  await sendReply(toEmail, subject, replyBody, htmlReply);
}

async function sendReply(toEmail, subject, replyBody, htmlReply) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject,
    text: replyBody,
    html: htmlReply ? htmlReply : undefined,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Reply sent: " + info.response);
  } catch (error) {
    console.error("Error sending reply: " + error.message);
  }
}

async function processEmails(auth) {
  try {
    const criteria = await getUserCriteria();
    const emails = await fetchTargetedEmails(criteria);
    console.log(`Total emails fetched: ${emails.length}`);

    let meetingsDetected = 0;
    let eventsCreated = 0;

    for (const email of emails) {
      console.log(`\nProcessing email:`);
      console.log(`From: ${email.from}`);
      console.log(`Subject: ${email.subject}`);

      const meetingKeywords = [
        "meeting",
        "conference",
        "call",
        "discussion",
        "appointment",
        "zoom",
        "google meet",
        "teams",
      ];
      const hasMeetingKeyword = meetingKeywords.some(
        (keyword) =>
          email.subject.toLowerCase().includes(keyword) ||
          email.text.toLowerCase().includes(keyword)
      );

      if (hasMeetingKeyword) {
        console.log("Meeting keyword detected in email");
        meetingsDetected++;

        const meetingDetails = parseDateTime(email.text);

        if (meetingDetails) {
          console.log("Meeting details extracted:", meetingDetails);

          const eventDetails = {
            summary: email.subject,
            description: email.text.substring(0, 500),
            startDateTime: meetingDetails.startDateTime,
            endDateTime: meetingDetails.endDateTime,
          };

          try {
            console.log("Adding event to calendar...");
            const eventLink = await addEventToCalendar(auth, eventDetails);
            console.log("Event added successfully:", eventLink);
            eventsCreated++;

            const message = `New meeting added to your calendar:
Subject: ${eventDetails.summary}
Time: ${eventDetails.startDateTime.toLocaleString()}
Event Link: ${eventLink}
Reminders set for 24 hours and 1 hour before the event.`;
            await sendWhatsAppMessage(message);
          } catch (error) {
            console.error("Failed to add event to calendar:", error);
          }
        } else {
          console.log(
            "Meeting detected, but could not extract date and time. Skipping calendar event creation."
          );
        }
      } else {
        console.log("No meeting keywords found in this email");
      }
    }

    console.log(`\nSummary:`);
    console.log(`Total emails processed: ${emails.length}`);
    console.log(`Meetings detected: ${meetingsDetected}`);
    console.log(`Events created: ${eventsCreated}`);

    await displayEmails(emails);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

async function main() {
  try {
    const auth = await authorize();
    await processEmails(auth);
  } catch (err) {
    console.error("\nError:", err.message);
  } finally {
    rl.close();
  }
}

main();
