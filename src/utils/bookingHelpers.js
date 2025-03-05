import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";

// Build a range of half-hour slots (as objects with date and time) between start and end.
export function getTimeSlotsRange(startDate, startTime, endDate, endTime) {
  const slotsRange = [];
  const dailySlots = generateDailySlots();
  const dayCount = differenceInCalendarDays(endDate, startDate);
  for (let offset = 0; offset <= dayCount; offset++) {
    const currentDay = addDays(startDate, offset);
    const dateKey = format(currentDay, "yyyy-MM-dd");
    const isFirstDay = offset === 0;
    const isLastDay = offset === dayCount;
    const startMins = isFirstDay
      ? timeStringToMinutes(startTime)
      : timeStringToMinutes("8:00 AM");
    const endMins = isLastDay
      ? timeStringToMinutes(endTime)
      : timeStringToMinutes("21:00");
    dailySlots.forEach((slot) => {
      const slotMins = timeStringToMinutes(slot);
      if (slotMins >= startMins && slotMins < endMins) {
        slotsRange.push({ date: dateKey, time: slot });
      }
    });
  }
  return slotsRange;
}

export function timeStringToMinutes(timeStr) {
  if (timeStr === "---:--") return Infinity;
  const [time, period] = timeStr.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minutes;
}

export function generateDailySlots() {
  const slots = [];
  for (let hour = 8; hour <= 21; hour++) {
    const period = hour < 12 ? "AM" : "PM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    slots.push(`${h12}:00 ${period}`);
    if (hour < 21) {
      slots.push(`${h12}:30 ${period}`);
    }
  }
  return slots;
}

// Compute blocked times keyed by date.
export function computeBlockedTimesByDate(bookings) {
  const blockedTimesByDate = {};
  const dailySlots = generateDailySlots();

  bookings.forEach((booking) => {
    const bookingStartDate = startOfDay(new Date(booking.startDate));
    const bookingEndDate = startOfDay(new Date(booking.endDate));
    const dayCount = differenceInCalendarDays(bookingEndDate, bookingStartDate);

    for (let offset = 0; offset <= dayCount; offset++) {
      const currentDay = addDays(bookingStartDate, offset);
      const dateKey = format(currentDay, "yyyy-MM-dd");
      if (!blockedTimesByDate[dateKey]) {
        blockedTimesByDate[dateKey] = new Set();
      }

      // For the first day, use booking.startTime; for other days, assume "8:00 AM"
      const effectiveStart = offset === 0 ? booking.startTime : "8:00 AM";
      // For the last day, use booking.endTime; for intermediate days, assume "9:00 PM"
      const effectiveEnd = offset === dayCount ? booking.endTime : "9:00 PM";

      const bookingStartMins = timeStringToMinutes(effectiveStart);
      const bookingEndMins = timeStringToMinutes(effectiveEnd);
      const blockThreshold = bookingEndMins + 30; // add 30-minute buffer

      dailySlots.forEach((slot) => {
        const slotMins = timeStringToMinutes(slot);
        if (slotMins >= bookingStartMins && slotMins < blockThreshold) {
          blockedTimesByDate[dateKey].add(slot);
        }
      });
    }
  });
  return blockedTimesByDate;
}
