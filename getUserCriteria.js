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
