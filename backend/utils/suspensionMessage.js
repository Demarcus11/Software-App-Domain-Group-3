function getSuspensionMessage(suspensionEnds) {
  const currentTime = new Date();
  suspensionEnds = new Date(suspensionEnds);
  const timeDifference = suspensionEnds - currentTime;
  const minutesRemaining = Math.ceil(timeDifference / (60 * 1000));

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const relativeTimeMessage =
    minutesRemaining > 60
      ? rtf.format(Math.ceil(minutesRemaining / 60), "hours")
      : rtf.format(minutesRemaining, "minutes");

  return `Account is suspended, try again ${relativeTimeMessage}`;
}

export default getSuspensionMessage;
