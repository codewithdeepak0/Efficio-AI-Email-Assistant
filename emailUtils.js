const imaps = require("imap-simple");
const simpleParser = require("mailparser").simpleParser;
const { JSDOM } = require("jsdom");
const { decode } = require("html-entities");

async function connectToImap(config) {
  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");
    return connection;
  } catch (error) {
    throw new Error(`Failed to connect to IMAP: ${error.message}`);
  }
}

async function fetchEmails(connection, searchCriteria, fetchOptions) {
  try {
    return await connection.search(searchCriteria, fetchOptions);
  } catch (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

async function parseEmail(message) {
  const fullMessage = message.parts.find((part) => part.which === "");
  const parsedEmail = await simpleParser(fullMessage.body);

  let textContent = parsedEmail.text;
  let htmlContent = parsedEmail.html;

  let links = [];
  if (htmlContent) {
    const dom = new JSDOM(htmlContent);
    textContent = dom.window.document.body.textContent || textContent;

    links = [
      ...new Set(
        Array.from(dom.window.document.querySelectorAll("a")).map((a) => ({
          text: a.textContent.trim() || "Link",
          href: a.href.length > 50 ? `${a.href.substring(0, 47)}...` : a.href,
        }))
      ),
    ];
  }

  return {
    from: parsedEmail.from.text,
    to: parsedEmail.to.text,
    subject: parsedEmail.subject,
    date: parsedEmail.date,
    text: decode(textContent).trim(),
    attachments: parsedEmail.attachments.map((att) => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    })),
    links,
  };
}

module.exports = {
  connectToImap,
  fetchEmails,
  parseEmail,
};
