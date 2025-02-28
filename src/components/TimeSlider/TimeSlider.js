// components/TimeSlider.js

import React, { useState, useEffect } from "react";

// Generate an array of times in 30-minute increments.
// You can customize the start/end times or increment as needed.
function generateTimes() {
  const times = [];
  const startHour = 6; // e.g. 6:00 AM
  const endHour = 24; // e.g. midnight
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

export default function TimeSlider({ value, onChange }) {
  // Find the index of the current value in ALL_TIMES, or default to 0
  const initialIndex = Math.max(0, ALL_TIMES.indexOf(value));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // When currentIndex changes, call onChange with the new time
  useEffect(() => {
    onChange(ALL_TIMES[currentIndex]);
  }, [currentIndex, onChange]);

  // Move left/right through the times array
  function handleLeft() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }
  function handleRight() {
    setCurrentIndex((prev) => Math.min(ALL_TIMES.length - 1, prev + 1));
  }

  // For display, we show the time at currentIndex in bold,
  // plus the times immediately before and after in lighter text.
  const leftTime = currentIndex > 0 ? ALL_TIMES[currentIndex - 1] : "";
  const centerTime = ALL_TIMES[currentIndex];
  const rightTime =
    currentIndex < ALL_TIMES.length - 1 ? ALL_TIMES[currentIndex + 1] : "";

  return (
    <div className="flex items-center gap-4">
      {/* Left arrow */}
      <button
        onClick={handleLeft}
        className="text-xl text-gray-600 hover:text-black"
        aria-label="Previous time"
      >
        &lsaquo;
      </button>

      {/* Times display */}
      <div className="flex items-center gap-2">
        {/* Left time in gray */}
        <span className="text-gray-400">{leftTime}</span>
        {/* Center (selected) time in bold */}
        <span className="font-bold">{centerTime}</span>
        {/* Right time in gray */}
        <span className="text-gray-400">{rightTime}</span>
      </div>

      {/* Right arrow */}
      <button
        onClick={handleRight}
        className="text-xl text-gray-600 hover:text-black"
        aria-label="Next time"
      >
        &rsaquo;
      </button>
    </div>
  );
}
