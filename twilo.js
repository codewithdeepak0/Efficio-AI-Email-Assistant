/*  This file will not work on local system
    This file is meant for twilo functions 
*/

require('dotenv').config();

const twilio = require('twilio');
const { google } = require('googleapis');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const chrono = require('chrono-node');

const { EMAIL_USER, EMAIL_PASSWORD, TWILIO_SID, TWILIO_AUTH_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

const client = new twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

exports.handler = async function (context, event, callback) {
  const twiml = new twilio.twiml.MessagingResponse();
  const userMessage = event.Body.trim().toLowerCase();

  if (userMessage === 'hello') {
    // Initial greeting and menu options
    twiml.message('Hello! Please choose an option by replying with the number:\n1. Fetch Unseen Mail\n2. Fetch Unseen Mail and Create Event\n3. Create Event\n4. Reply to Mail');
  } else if (['1', '2', '3', '4'].includes(userMessage)) {
    // Handle the user's choice
    await handleUserChoice(userMessage, twiml);
  } else {
    twiml.message('Invalid option. Please reply with "hello" to start or choose an option (1-4).');
  }

  callback(null, twiml);
};

async function handleUserChoice(choice, twiml) {
  switch (choice) {
    case '1':
      await fetchUnseenMail(twiml);
      break;
    case '2':
      await fetchUnseenMailAndCreateEvent(twiml);
      break;
    case '3':
      await createEvent(twiml);
      break;
    case '4':
      twiml.message('Replying to email... (This feature is not yet implemented)');
      break;
  }
}

async function fetchUnseenMail(twiml) {
  const imapConfig = {
    imap: {
      user: EMAIL_USER,
      password: EMAIL_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    }
  };

  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const criteria = ['UNSEEN'];
    const options = { bodies: '' };
    const emails = await connection.search(criteria, options);

    const formattedEmails = await Promise.all(emails.map(async (email) => {
      const fullMessage = email.parts.find(part => part.which === '');
      const parsedEmail = await simpleParser(fullMessage.body);

      let output = From: ${parsedEmail.from.text}\n;
      output += Subject: ${parsedEmail.subject}\n;
      output += Date: ${parsedEmail.date}\n;
      output += Body: ${parsedEmail.text.substring(0, 100)}...\n\n;

      return output;
    }));

    twiml.message(Unseen emails fetched:\n\n${formattedEmails.join('\n')});
  } catch (error) {
    console.error('Error fetching emails:', error);
    twiml.message('Error fetching emails.');
  }
}

async function fetchUnseenMailAndCreateEvent(twiml) {
  await fetchUnseenMail(twiml);
  await createEvent(twiml);
}

async function createEvent(twiml) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: 'New Event',
      location: 'Virtual',
      description: 'This is a sample event created via Twilio.',
      start: {
        dateTime: '2025-01-05T09:00:00-07:00',
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: '2025-01-05T10:00:00-07:00',
        timeZone: 'America/Los_Angeles',
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    console.log('Event created:', createdEvent.data.summary);
    twiml.message('Event created successfully!');
  } catch (error) {
    console.error('Error creating event:', error);
    twiml.message('Error creating event.');
  }
}

function parseDateTime(text) {
  const results = chrono.parse(text);
  if (results.length > 0) {
    const startDate = results[0].start.date();
    let endDate;

    if (results[0].end) {
      endDate = results[0].end.date();
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    const now = new Date();
    if (startDate < now) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      endDate = new Date(tomorrow.getTime() + (endDate.getTime() - startDate.getTime()));
      startDate.setTime(tomorrow.getTime());
    }

    return { startDateTime: startDate, endDateTime: endDate };
  }
  return null;
}

// For testing purposes
const mockEvent = { Body: 'hello' };
const mockContext = {};
const mockCallback = (err, result) => {
  if (err) console.error(err);
  else console.log(result.toString());
};

exports.handler(mockContext, mockEvent, mockCallback);