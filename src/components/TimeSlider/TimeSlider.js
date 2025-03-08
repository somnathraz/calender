import React, { useState, useEffect, useRef } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import { isToday } from "date-fns";

// 1) Generate an array of times in 1‑hour increments from 8:00 AM to 9:00 PM.
function generateTimes() {
  const times = [];
  // Start at 6 (6:00 AM) and go up to 23 (11:00 PM)
  for (let hour = 6; hour <= 23; hour++) {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const period = hour < 12 ? "AM" : "PM";
    times.push(`${h12}:00 ${period}`);
  }
  return times;
}

const ALL_TIMES = generateTimes();

// 2) If the current time is 11:10 AM, the next slot is "12:00 PM".
function getNearestValidTimeIndex() {
  const now = new Date();
  // Round up to the next full hour
  const rounded = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours() + (now.getMinutes() > 0 ? 1 : 0),
    0,
    0
  );
  const hour = rounded.getHours();
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  const formatted = `${h12}:00 ${period}`;
  const index = ALL_TIMES.indexOf(formatted);
  return index !== -1 ? index : 0;
}

// 3) Convert a time string like "11:00 AM" to minutes after midnight
function timeStringToMinutes(timeStr) {
  const [time, period] = timeStr.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minutes;
}

export default function TimeSlider({
  value,
  onChange,
  selectedDate,
  blockedTimes = new Set(),
}) {
  const isDateToday = selectedDate && isToday(selectedDate);

  // If today and current time is >= 9:00 PM, no slots are available
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const closingTimeMinutes = 21 * 60; // 9:00 PM
  const noSlotsAvailable = isDateToday && nowMinutes >= closingTimeMinutes;

  // 4) Determine the initial index
  const nearestIndex = isDateToday ? getNearestValidTimeIndex() : 0;
  const initialIndex = isDateToday ? nearestIndex : ALL_TIMES.indexOf(value);
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  // 5) Scroll container reference
  const containerRef = useRef(null);

  // 6) Create a combined blocked set: include those passed via props plus any past slots (if today).
  const combinedBlocked = new Set(blockedTimes);
  if (isDateToday) {
    ALL_TIMES.forEach((slot) => {
      if (timeStringToMinutes(slot) < nowMinutes) {
        combinedBlocked.add(slot);
      }
    });
  }

  // 7) Scroll to the selected time slot when currentIndex changes
  useEffect(() => {
    if (containerRef.current) {
      const slotElement = containerRef.current.querySelector(
        `[data-index="${currentIndex}"]`
      );
      if (slotElement) {
        slotElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [currentIndex]);

  // 8) If the current slot is blocked, jump to the next available slot.
  function findNextAvailableIndex(index) {
    let i = index;
    while (i < ALL_TIMES.length && combinedBlocked.has(ALL_TIMES[i])) {
      i++;
    }
    return i < ALL_TIMES.length ? i : index;
  }
  function findPrevAvailableIndex(index) {
    let i = index;
    while (i >= 0 && combinedBlocked.has(ALL_TIMES[i])) {
      i--;
    }
    return i >= 0 ? i : index;
  }

  useEffect(() => {
    if (!noSlotsAvailable && combinedBlocked.has(ALL_TIMES[currentIndex])) {
      const newIndex = findNextAvailableIndex(currentIndex);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    } else if (!noSlotsAvailable) {
      onChange(ALL_TIMES[currentIndex]);
    }
  }, [combinedBlocked, currentIndex, onChange, noSlotsAvailable]);

  // 9) Arrow handlers
  function handleUp() {
    let newIndex = isDateToday
      ? Math.max(nearestIndex, currentIndex - 1)
      : Math.max(0, currentIndex - 1);
    newIndex = findPrevAvailableIndex(newIndex);
    setCurrentIndex(newIndex);
  }
  function handleDown() {
    let newIndex = Math.min(ALL_TIMES.length - 1, currentIndex + 1);
    newIndex = findNextAvailableIndex(newIndex);
    setCurrentIndex(newIndex);
  }

  // 10) If no slots are available, show a message
  if (noSlotsAvailable) {
    return (
      <div className="text-red-500 font-bold">No slots available for today</div>
    );
  }

  const showUpArrow =
    !isDateToday || (isDateToday && currentIndex > nearestIndex);

  // 11) Handle slot click
  function handleSlotClick(i) {
    // If it's blocked, do nothing.
    if (combinedBlocked.has(ALL_TIMES[i])) return;
    setCurrentIndex(i);
  }

  return (
    <div className="flex flex-col items-center w-48">
      {showUpArrow && (
        <button
          onClick={handleUp}
          className="mb-2 text-gray-600 hover:text-black"
          aria-label="Scroll up"
        >
          <FaAngleUp size={20} />
        </button>
      )}

      <div
        ref={containerRef}
        className="h-64 w-full overflow-y-auto border border-gray-300 rounded-lg p-2"
      >
        {ALL_TIMES.map((slot, i) => {
          const isBlocked = combinedBlocked.has(slot);
          const isSelected = i === currentIndex;

          const slotClass = isBlocked
            ? "bg-gray-200 text-gray-400 pointer-events-none"
            : "bg-white text-black cursor-pointer hover:bg-blue-50";
          const selectedClass = isSelected
            ? "border border-blue-500"
            : "border border-transparent";

          return (
            <div
              key={slot}
              data-index={i}
              onClick={() => handleSlotClick(i)}
              className={`mb-2 p-2 rounded text-center ${slotClass} ${selectedClass}`}
            >
              {slot}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleDown}
        className="mt-2 text-gray-600 hover:text-black"
        aria-label="Scroll down"
      >
        <FaAngleDown size={20} />
      </button>
    </div>
  );
}
