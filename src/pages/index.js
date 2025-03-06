import React, { useContext, useState, useEffect } from "react";
import { format, startOfDay, addDays, isToday } from "date-fns";
import { MdCalendarMonth, MdAccessTime, MdLocationOn } from "react-icons/md";
// shadcn/ui components
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// Your custom components / styles
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import styles from "@/styles/Home.module.css";
import { BookingContext } from "@/context/BookingContext";
import { useRouter } from "next/router";

// Import helpers for multi-day booking support
import {
  timeStringToMinutes,
  computeBlockedTimesByDate,
  getTimeSlotsRange,
} from "@/utils/bookingHelpers";

/**
 * DateTimeDisplay Component (Used for Working Hours)
 */
function DateTimeDisplay({
  date,
  time,
  fallbackDate = "Mon (05/12)",
  fallbackTime = "10:00 AM",
}) {
  const displayDate = date ? format(date, "EEE (MM/dd)") : fallbackDate;
  let displayTime = date ? time : fallbackTime;

  if (date && isToday(date)) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const closingTimeMinutes = 21 * 60;
    if (nowMinutes >= closingTimeMinutes) {
      displayTime = "---:--";
    }
  }
  return (
    <div className="flex items-center w-full bg-[#f8f8f8] px-4 py-2 text-black">
      <MdCalendarMonth size={16} className="mr-1 text-gray-500" />
      <span className="text-[14px]">{displayDate}</span>
      <span className="mx-1 text-gray-500">|</span>
      <MdAccessTime size={16} className="mr-1 text-gray-500" />
      <span className="text-[14px]">{displayTime}</span>
    </div>
  );
}

export default function BookingPage() {
  const {
    studiosList,
    selectedStudio,
    setSelectedStudio,
    studio,
    setStudio,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
  } = useContext(BookingContext);
  const today = startOfDay(new Date());
  const router = useRouter();
  const [errors, setErrors] = useState({
    studio: false,
    startDate: false,
    startTime: false,
    endDate: false,
    endTime: false,
  });

  // Instead of a single blockedTimes set, store blocked times per date.
  const [blockedTimesByDate, setBlockedTimesByDate] = useState({});

  // Effect: If today's date is selected and current time is past closing, update to tomorrow.
  useEffect(() => {
    if (startDate && isToday(startDate)) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const closingTimeMinutes = 21 * 60;
      if (nowMinutes >= closingTimeMinutes) {
        const tomorrow = addDays(today, 1);
        setStartDate(tomorrow);
        setStartTime("8:00 AM");
      }
    }
  }, [startDate, today, setStartDate, setStartTime]);

  // Fetch existing bookings for the selected studio and date.
  useEffect(() => {
    async function fetchBookings() {
      if (!studio || !startDate) return;
      const formattedDate = format(startDate, "yyyy-MM-dd");
      try {
        const res = await fetch(`/api/booking?date=${formattedDate}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        // Filter the bookings for the selected studio
        const filteredBookings = (data.bookings || []).filter(
          (booking) => booking.studio === studio
        );
        // Compute blocked times only for the filtered bookings
        const blockedByDate = computeBlockedTimesByDate(filteredBookings);
        setBlockedTimesByDate(blockedByDate);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    }
    fetchBookings();
  }, [studio, startDate]);

  // For TimeSlider components, pick the blocked set for the selected day.
  const startDateKey = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const endDateKey = endDate ? format(endDate, "yyyy-MM-dd") : "";
  const blockedTimesForStartDate =
    blockedTimesByDate[startDateKey] || new Set();
  const blockedTimesForEndDate = blockedTimesByDate[endDateKey] || new Set();

  // For the calendar, we want to show two months side by side.
  // When selecting a range, we want the first click to set the start date and the second to set the end date.
  // Modify the onSelect callback so that if the range object does not include a "to" date, we update only the start date.
  const handleRangeSelect = (range) => {
    if (!range) return;

    if (!range.to) {
      // If only one date is selected, set both start and end to that date
      setStartDate(range.from);
      setEndDate(range.from);
    } else {
      // If both dates are selected, set accordingly
      setStartDate(range.from);
      setEndDate(range.to);
    }
  };

  // Validate required fields and conditions.
  const handleNext = () => {
    const newErrors = {
      studio: !selectedStudio,
      startDate: !startDate,
      startTime: !startTime,
      endDate: !endDate,
      endTime: !endTime,
    };

    if (startTime && timeStringToMinutes(startTime) >= 21 * 60) {
      newErrors.startTime = true;
      alert("Invalid start time. Must be before 9:00 PM.");
    }
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const startDateTimeWithTime = new Date(startDate);
    const endDateTimeWithTime = new Date(endDate);

    if (startTime !== "---:--" && endTime !== "---:--") {
      const startMinutes = timeStringToMinutes(startTime);
      const endMinutes = timeStringToMinutes(endTime);

      // Set the hours and minutes on the date objects
      startDateTimeWithTime.setHours(
        Math.floor(startMinutes / 60),
        startMinutes % 60,
        0,
        0
      );
      endDateTimeWithTime.setHours(
        Math.floor(endMinutes / 60),
        endMinutes % 60,
        0,
        0
      );

      // Now compare the full datetime objects
      if (endDateTimeWithTime <= startDateTimeWithTime) {
        newErrors.endTime = true;
        alert("End time must be after start time.");
      }
    }

    // Additional check for minimum booking duration (1 hour)
    if (startTime !== "---:--") {
      // Create Date objects for start and end times using their respective dates.
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      // Convert time strings to minutes since midnight
      const startMinutes = timeStringToMinutes(startTime);
      const endMinutes = timeStringToMinutes(endTime);

      // Set the hours and minutes on the date objects accordingly.
      startDateTime.setHours(
        Math.floor(startMinutes / 60),
        startMinutes % 60,
        0,
        0
      );
      endDateTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

      // Calculate the total difference in minutes
      const diffInMinutes = (endDateTime - startDateTime) / 60000;
      if (diffInMinutes < 60) {
        newErrors.endTime = true;
        alert("Minimum booking time is 1 hour.");
      }
    }

    // New multi-day range check:
    const rangeSlots = getTimeSlotsRange(
      startDate,
      startTime,
      endDate,
      endTime
    );
    let conflictFound = false;
    rangeSlots.forEach(({ date, time }) => {
      const blockedSet = blockedTimesByDate[date] || new Set();
      if (blockedSet.has(time)) {
        conflictFound = true;
      }
    });
    if (rangeSlots.length > 0 && conflictFound) {
      alert("Time slots not available in the selected range.");
      return;
    }

    if (
      newErrors.studio ||
      newErrors.startDate ||
      newErrors.startTime ||
      newErrors.endDate ||
      newErrors.endTime
    ) {
      setErrors(newErrors);
      return;
    }
    router.push("/addons");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        {/* LEFT SIDE: Select Studio */}
        <div className={styles.leftSide}>
          <div className={styles.wrap}>
            <label className="w-40 text-xs font-bold mb-1">Select Studio</label>
            <Select
              value={selectedStudio?.name}
              onValueChange={(studioName) => {
                const studioObj = studiosList.find(
                  (s) => s.name === studioName
                );
                setSelectedStudio(studioObj);
              }}
            >
              <SelectTrigger className="w-full bg-[#f8f8f8] justify-start text-black hover:bg-[#f8f8f8]">
                <MdLocationOn className="mr-1" />
                <SelectValue placeholder="Select Studio" />
              </SelectTrigger>
              <SelectContent className="bg-[#f8f8f8] text-black">
                {studiosList.map((studio) => (
                  <SelectItem key={studio.name} value={studio.name}>
                    {studio.name} (${studio.pricePerHour.toFixed(2)}/Hr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studio && (
              <p className="text-red-500 text-xs mt-1">* Studio is required</p>
            )}
          </div>
        </div>
        {/* RIGHT SIDE: Working Hours */}
        <div className={styles.rightSide}>
          {/* Working Hours Start */}
          <div className="flex flex-col">
            <label className="font-bold text-xs mb-1">
              Working Hours Start
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <div onClick={() => {}}>
                  <DateTimeDisplay
                    date={startDate}
                    time={startTime}
                    fallbackDate="Mon (05/12)"
                    fallbackTime="10:00 AM"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-max bg-[#f8f8f8]" align="end">
                <TimeSlider
                  value={startTime}
                  onChange={(val) => setStartTime(val)}
                  selectedDate={startDate}
                  blockedTimes={blockedTimesForStartDate}
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && (
              <p className="text-red-500 text-xs mt-1">
                * Start date is required
              </p>
            )}
            {errors.startTime && (
              <p className="text-red-500 text-xs mt-1">
                * Start time is required or invalid
              </p>
            )}
          </div>
          {/* Working Hours End */}
          <div className="flex flex-col">
            <label className="text-xs font-bold mb-1">Working Hours End</label>
            <Popover>
              <PopoverTrigger asChild>
                <div onClick={() => {}}>
                  <DateTimeDisplay
                    date={endDate}
                    time={endTime}
                    fallbackDate="Tue (05/12)"
                    fallbackTime="10:00 AM"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-max bg-[#f8f8f8]" align="end">
                <TimeSlider
                  value={endTime}
                  onChange={(val) => setEndTime(val)}
                  selectedDate={endDate}
                  blockedTimes={blockedTimesForEndDate}
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && (
              <p className="text-red-500 text-xs mt-1">
                * End date is required
              </p>
            )}
            {errors.endTime && (
              <p className="text-red-500 text-xs mt-1">
                * End time is required or must be after start time
              </p>
            )}
          </div>
          <Button
            variant="default"
            className="mt-4 h-12 px-10 rounded-none"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
      {/* Calendar Section */}
      <div className="mt-4 w-[70%] flex items-center justify-center p-5 bg-[#f8f8f8]">
        {/* Single Calendar for Range Selection: Shows 2 months at a time */}
        {/* Use the Calendar in range mode to allow selection of start and end dates */}
        <Calendar
          mode="range"
          inline
          isClearable={true}
          selected={{ from: startDate, to: endDate }}
          disabled={{ before: new Date() }}
          onSelect={(range) => handleRangeSelect(range)}
          numberOfMonths={2}
          className="w-full"
        />
      </div>
    </div>
  );
}
