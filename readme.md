# AI-Powered Email Assistant

## Project Overview

The *AI-Powered Email Assistant* is designed to help users manage their emails, schedule meetings, and communicate efficiently, all through a simple interface. It integrates with Google Calendar, provides automated meeting scheduling, fetches unread emails, and even allows WhatsApp integration to reply directly to emails. This tool helps you stay on top of your inbox and keep your schedule in check, all without constantly checking your email.

---

## Story

I once gave an interview with OpenXcell, and they told me, "If you're further selected, we will send you an email." I thought I could check my email later. However, I forgot to check it, missed the email, and ultimately lost the opportunity. 

This experience made me think about the problem many of us face: "Why do we keep missing important emails?"

That’s when the idea struck: What if we could manage everything, including email notifications and responses, directly through WhatsApp?

This is how the *AI-Powered Email Assistant* came into existence — a solution designed to keep you updated and on track by combining the power of emails and WhatsApp into one easy-to-use platform.

---

## Features

- *Fetch Unseen Emails*: Automatically retrieves and processes new, unread emails from your inbox.
- *Google Calendar Integration*: Creates events in your Google Calendar based on email content (like meetings and appointments).
- *Automated Meeting Scheduling*: Analyzes email content for meeting requests and automatically schedules them, including 24-hour and 1-hour reminders.
- *User-Specific Email Fetching*: Allows you to fetch emails based on specific criteria such as sender, subject, or date range.
- *AI-Powered WhatsApp Replies*: Reply to emails directly via WhatsApp using AI-generated responses.

---

## Key Components

- *emailManagement.js*: Core file handling email fetching, processing, and integration with other services.
- *twilio.js*: Manages WhatsApp integration for sending notifications and replies.
- *oauthHandler.js*: Handles OAuth authentication for Google services.
- *getUserCriteria.js*: Manages user input for specific email fetching criteria.
- *email-formatter.js*: Formats email content for better readability and processing.

---

## Project Demonstration

### Full Project Demonstration Video

See the *AI-Powered Email Assistant* in action by watching our full demonstration:

https://www.canva.com/design/DAGbIC1luMU/mKViAPDZUxEvHiC5c2AZvw/edit?utm_content=DAGbIC1luMU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

### WhatsApp Integration Tutorial

Learn how to integrate WhatsApp for seamless communication with the assistant:

https://www.canva.com/design/DAGbIOGLLm4/OAP3fgy-iwsqVr7MjOmI7g/edit?utm_content=DAGbIOGLLm4&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

---

## Setup and Installation

### 1. Clone the repository:

bash
git clone <repo-url>


### 2. Install dependencies:

bash
npm install


### 3. Set up environment variables:

Create a .env file in the root directory and add the required credentials:

- Email credentials
- Twilio credentials
- Google API credentials

For reference, check the .env.example file for the required variables.

### 4. Set up Google OAuth credentials:

- Follow the Google API documentation to create OAuth credentials for your project and update the oauthHandler.js file.

### 5. Configure Twilio for WhatsApp integration:

Set up your Twilio account and configure the WhatsApp API as per the official [Twilio guide](https://www.twilio.com/docs/whatsapp).

---

## Usage

To run the application:

bash
node emailManagement.js


The application will start monitoring your inbox, fetching unread emails, and performing the necessary actions based on the configured settings.

To use the WhatsApp integration:

1. Send the word hello to the WhatsApp number linked with your assistant.
2. You will receive a dropdown to choose from various email-related actions (e.g., replying, fetching emails).

---

## Dependencies

- *@google-cloud/local-auth*: For Google OAuth authentication.
- *@google/generative-ai*: For AI-powered features.
- *googleapis*: For interacting with Google APIs.
- *imap*: For fetching emails.
- *nodemailer*: For sending emails.
- *twilio*: For WhatsApp integration.

For a full list of dependencies, check the package.json file.

---

## Configuration

Ensure that all necessary environment variables are set in your .env file, including:

- Email credentials
- Twilio credentials
- Google API credentials

---

## Contributing

Contributions are welcome! To contribute to the project:

1. Fork the repository.
2. Create a new branch (git checkout -b feature/AmazingFeature).
3. Commit your changes (git commit -m 'Add some AmazingFeature').
4. Push the branch (git push origin feature/AmazingFeature).
5. Open a Pull Request.

---

## License

This project does not have a license.

---

## Acknowledgements

- *Google Cloud Platform* for OAuth and Calendar API.
- *Twilio* for WhatsApp integration.
- *OpenAI* for AI-powered features.

---


