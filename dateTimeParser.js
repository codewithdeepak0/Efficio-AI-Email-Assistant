const chrono = require("chrono-node");

function parseDateTime(text) {
  const results = chrono.parse(text);
  if (results.length > 0) {
    const startDate = results[0].start.date();
    let endDate;

    if (results[0].end) {
      endDate = results[0].end.date();
    } else {
      // If no end time is specified, assume the meeting is 1 hour long
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    // Ensure the dates are in the future
    const now = new Date();
    if (startDate < now) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      endDate = new Date(
        tomorrow.getTime() + (endDate.getTime() - startDate.getTime())
      );
      startDate.setTime(tomorrow.getTime());
    }

    return { startDateTime: startDate, endDateTime: endDate };
  }
  return null;
}

module.exports = { parseDateTime };
