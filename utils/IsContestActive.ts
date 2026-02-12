export function isContestActive(startTime: Date, endTime: Date) {
  const currentTime = new Date().getTime();
  const contestStartTime = new Date(startTime).getTime();
  const contestEndTime = new Date(endTime).getTime();
  const isActive =
    currentTime > contestStartTime && currentTime < contestEndTime;

  return isActive;
}
