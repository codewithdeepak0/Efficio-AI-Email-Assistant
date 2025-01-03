const fs = require('fs');

function formatEmail(email) {
  let output = `From: ${email.from}\n`;
  output += `To: ${email.to}\n`;
  output += `Subject: ${email.subject}\n`;
  output += `Date: ${email.date}\n\n`;
  output += `Body: ${email.body.substring(0, 100)}...\n\n`;
  
  if (email.attachments && email.attachments.length > 0) {
    output += 'Attachments:\n';
    email.attachments.forEach(attachment => {
      output += `- ${attachment.filename} (${attachment.contentType}, ${attachment.size} bytes)\n`;
    });
    output += '\n';
  } else {
    output += 'Attachments: None\n\n';
  }
  
  if (email.links && email.links.length > 0) {
    output += 'Links:\n';
    email.links.slice(0, 5).forEach(link => {
      if (link.text && link.href) {
        output += `- ${link.text.substring(0, 30)}: ${link.href.substring(0, 50)}...\n`;
      } else if (link.href) {
        output += `- ${link.href.substring(0, 50)}...\n`;
      }
    });
    if (email.links.length > 5) {
      output += `... and ${email.links.length - 5} more links\n`;
    }
  } else {
    output += 'Links: None\n';
  }
  
  return output;
}

// Simulating the formatted email data (replace this with actual data reading logic)
const formattedEmails = [
  {
    from: '"Instagram" <no-reply@mail.instagram.com>',
    to: 'khushalparmar1208@gmail.com',
    subject: 'An important update about your Instagram account settings',
    date: 'Thu Jan 02 2025 11:17:06 GMT+0530 (India Standard Time)',
    body: 'Hi .khushal_parmar,You recently changed your Instagram account from private to public. This means anyone will be able to see your photos and videos, and you won\'t have to approve new followers anym...',
    attachments: [],
    links: [
      { "text": "", "href": "https://www.instagram.com/_n/mainfeed?utm_campaign=template_platform&target_user_id=44719262742&click_source=header_icon&utm_source=instagram&utm_medium=email&ndid=62ab267a67af3Ha6979cc16H62ab2b13c7dc5Hb6&ts=62ab2b13d0b19" },
      { "text": "", "href": "https://www.instagram.com/n/user?username=.khushal_parmar_&utm_campaign=template_platform&target_user_id=44719262742&click_source=header_profile&utm_source=instagram&utm_medium=email&ndid=62ab267a67af3Ha6979cc16H62ab2b13c7dc5Hb6&ts=62ab2b13d0c01" },
      { "text": "khushalparmar1208@gmail.com", "href": "" },
      { "text": "unsubscribe.", "href": "https://instagram.com/emails/unsubscribe/support_email?user_id=44719262742&sig=AU-qLtb4aPcmJfmj&notification_type=182&ndid=62ab267a67af3Ha6979cc16H62ab2b13c7dc5Hb6" }
    ]
  },
  // ... other emails ...
];

let output = '';
formattedEmails.forEach((email, index) => {
  output += `Email ${index + 1}:\n`;
  output += formatEmail(email);
  output += '-'.repeat(50) + '\n\n';
});

// Write the formatted emails to a text file
fs.writeFileSync('concise_emails.txt', output);
console.log('Concise email format has been written to concise_emails.txt');
