import React, { useState, useEffect } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import { isToday } from "date-fns";

// Generate an array of times in 30-minute increments
function generateTimes() {
  const times = [];
  const startHour = 6; // e.g., 6:00 AM
  const endHour = 24; // e.g., midnight
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const minStr = minute === 0 ? "00" : "30";
      times.push(`${h12}:${minStr} ${ampm}`);
    }
  }
  return times;
}

const ALL_TIMES = generateTimes();

// Returns the index of the next available 30‑minute slot based on the current time.
// For example, if now is exactly 11:00 or 11:10, it returns the index for "11:30 AM".
function getNearestValidTimeIndex() {
  const now = new Date();
  const minutes = now.getMinutes();
  const addMinutes = minutes % 30 === 0 ? 30 : 30 - (minutes % 30);
  const rounded = new Date(now.getTime() + addMinutes * 60000);
  const hour = rounded.getHours();
  const minute = rounded.getMinutes();
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const minStr = minute === 0 ? "00" : "30";
  const formatted = `${h12}:${minStr} ${ampm}`;
  const index = ALL_TIMES.indexOf(formatted);
  return index !== -1 ? index : 0;
}

export default function TimeSlider({ value, onChange, selectedDate }) {
  const isDateToday = selectedDate && isToday(selectedDate);
  // When today is selected, force active time to be the nearest valid slot.
  const nearestIndex = isDateToday ? getNearestValidTimeIndex() : 0;
  // Initialize index: if today, use nearestIndex; else use provided value index.
  const [currentIndex, setCurrentIndex] = useState(
    isDateToday ? nearestIndex : ALL_TIMES.indexOf(value)
  );

  // Force currentIndex to never drop below nearestIndex when today is selected.
  useEffect(() => {
    if (isDateToday && currentIndex < nearestIndex) {
      setCurrentIndex(nearestIndex);
    } else {
      onChange(ALL_TIMES[currentIndex]);
    }
  }, [currentIndex, onChange, isDateToday, nearestIndex]);

  // Allow up arrow: if not today or if today and currentIndex > nearestIndex.
  function handleUp() {
    if (isDateToday) {
      setCurrentIndex((prev) => Math.max(nearestIndex, prev - 1));
    } else {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }
  function handleDown() {
    setCurrentIndex((prev) => Math.min(ALL_TIMES.length - 1, prev + 1));
  }

  const prevTime = currentIndex > 0 ? ALL_TIMES[currentIndex - 1] : "";
  const centerTime = ALL_TIMES[currentIndex];
  const nextTime =
    currentIndex < ALL_TIMES.length - 1 ? ALL_TIMES[currentIndex + 1] : "";

  // Show up arrow if either it's not today or it's today and currentIndex > nearestIndex.
  const showUpArrow =
    !isDateToday || (isDateToday && currentIndex > nearestIndex);

  return (
    <div className="flex w-max flex-col items-center gap-2 bg-[#f8f8f8] p-4 rounded-lg">
      {showUpArrow && (
        <button
          onClick={handleUp}
          className="text-2xl text-gray-600 hover:text-black"
          aria-label="Previous time"
        >
          <FaAngleUp />
        </button>
      )}

      <div className="flex flex-col items-center">
        <span className="text-gray-400">{prevTime}</span>
        <span className="text-xl font-bold">{centerTime}</span>
        <span className="text-gray-400">{nextTime}</span>
      </div>

      <button
        onClick={handleDown}
        className="text-2xl text-gray-600 hover:text-black"
        aria-label="Next time"
      >
        <FaAngleDown />
      </button>
    </div>
  );
}
