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
// Dialog components for desktop (we keep these for non‑mobile views)
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

// Custom components and styles
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import styles from "@/styles/Home.module.css";
import { BookingContext } from "@/context/BookingContext";
import { useRouter } from "next/router";

// Import helper for time conversion and blocked times
import {
  timeStringToMinutes,
  computeBlockedTimesByDate,
} from "@/utils/bookingHelpers";
import Head from "next/head";

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
    const closingTimeMinutes = 23 * 60;
    if (nowMinutes >= closingTimeMinutes) {
      displayTime = "---:--";
    }
  }
  return (
    <div className="flex items-center w-full bg-[#f8f8f8] px-2 sm:px-4 py-2 text-black">
      <MdCalendarMonth size={14} className="mr-1 text-gray-500" />
      <span className="text-[12px] sm:text-[14px]">{displayDate}</span>
      <span className="mx-1 text-gray-500">|</span>
      <MdAccessTime size={14} className="mr-1 text-gray-500" />
      <span className="text-[12px] sm:text-[14px]">{displayTime}</span>
    </div>
  );
}

export default function BookingPage() {
  const {
    studiosList,
    selectedStudio,
    setSelectedStudio,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
  } = useContext(BookingContext);
  const today = startOfDay(new Date());
  const router = useRouter();
  const [errors, setErrors] = useState({
    studio: false,
    startDate: false,
    startTime: false,
    endTime: false,
  });

  // Compute blocked times for the selected date.
  const [blockedTimesByDate, setBlockedTimesByDate] = useState({});

  // If today's date is selected and current time is past closing, update to tomorrow.
  useEffect(() => {
    if (startDate && isToday(startDate)) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const closingTimeMinutes = 23 * 60;
      if (nowMinutes >= closingTimeMinutes) {
        const tomorrow = addDays(today, 1);
        setStartDate(tomorrow);
        setStartTime("6:00 AM");
      }
    }
  }, [startDate, today, setStartDate, setStartTime]);

  // Track screen width to determine mobile view.
  const [monthsToShow, setMonthsToShow] = useState(2);
  useEffect(() => {
    const updateMonthsToShow = () => {
      if (window.innerWidth < 768) {
        setMonthsToShow(1);
      } else {
        setMonthsToShow(2);
      }
    };
    updateMonthsToShow();
    window.addEventListener("resize", updateMonthsToShow);
    return () => window.removeEventListener("resize", updateMonthsToShow);
  }, []);

  useEffect(() => {
    const sendHeight = () => {
      // Use the larger of body or documentElement height for accuracy
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      console.log("Sending height:", height);
      // Replace '*' with your parent's origin for production
      window.parent.postMessage({ iframeHeight: height }, "*");
    };

    // Send initial height
    sendHeight();

    // Use MutationObserver to watch for DOM changes that might change height
    const observer = new MutationObserver(() => {
      sendHeight();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Also update height on window resize
    window.addEventListener("resize", sendHeight);

    return () => {
      window.removeEventListener("resize", sendHeight);
      observer.disconnect();
    };
  }, []);
  // Define mobile view based on monthsToShow (1 = mobile)
  const isMobile = monthsToShow === 1;

  // Fetch existing bookings for the selected studio and date.
  useEffect(() => {
    async function fetchBookings() {
      if (!selectedStudio || !startDate) return;
      const formattedDate = format(startDate, "yyyy-MM-dd");
      try {
        const res = await fetch(`/api/booking`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        // Filter bookings by studio and date.
        const filteredBookings = (data.bookings || []).filter(
          (booking) =>
            booking.studio === selectedStudio.name &&
            format(new Date(booking.startDate), "yyyy-MM-dd") === formattedDate
        );
        const blockedByDate = computeBlockedTimesByDate(filteredBookings);
        setBlockedTimesByDate(blockedByDate);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    }
    fetchBookings();
  }, [selectedStudio, startDate]);

  const startDateKey = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const blockedTimesForStartDate =
    blockedTimesByDate[startDateKey] || new Set();

  // Validate and process booking details.
  const handleNext = () => {
    const newErrors = {
      studio: !selectedStudio,
      startDate: !startDate,
      startTime: !startTime,
      endTime: !endTime,
    };

    if (startTime && timeStringToMinutes(startTime) >= 23 * 60) {
      newErrors.startTime = true;
      alert("Invalid start time. Must be before 11:00 PM.");
    }
    // Create Date objects using the same date for both start and end times.
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(startDate);
    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = timeStringToMinutes(endTime);

    startDateTime.setHours(
      Math.floor(startMinutes / 60),
      startMinutes % 60,
      0,
      0
    );
    endDateTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    if (endDateTime <= startDateTime) {
      newErrors.endTime = true;
      alert("End time must be after start time.");
    }

    // Minimum booking duration check (1 hour).
    const diffInMinutes = (endDateTime - startDateTime) / 60000;
    if (diffInMinutes < 60) {
      newErrors.endTime = true;
      alert("Minimum booking time is 1 hour.");
    }

    // Check for conflicts in the selected day (using a simple 30‑minute step).
    let conflictFound = false;
    for (
      let time = timeStringToMinutes(startTime);
      time < timeStringToMinutes(endTime);
      time += 30
    ) {
      if (blockedTimesForStartDate.has(time)) {
        conflictFound = true;
        break;
      }
    }
    if (conflictFound) {
      alert("Time slots not available on the selected day.");
      return;
    }

    if (
      newErrors.studio ||
      newErrors.startDate ||
      newErrors.startTime ||
      newErrors.endTime
    ) {
      setErrors(newErrors);
      return;
    }
    router.push("/addons");
  };

  return (
    <div className={styles.wrapper}>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function sendHeight() {
                var height = document.body.scrollHeight;
                window.parent.postMessage({ iframeHeight: height }, '*');
              }
              window.onload = sendHeight;
              window.onresize = sendHeight;
            `,
          }}
        />
      </Head>
      <div className={styles.row}>
        {/* LEFT SIDE: Select Studio */}
        <div className={styles.leftSide}>
          <div className={styles.wrap}>
            <div className="w-full">
              <label className="w-40 text-xs font-bold mb-1">
                Select Studio
              </label>
              <Select
                value={selectedStudio ? selectedStudio.name : ""}
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
                    <SelectItem
                      key={studio.name}
                      value={studio.name}
                      className="text-xs"
                    >
                      {studio.name} (${studio.pricePerHour.toFixed(2)}/Hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studio && (
                <p className="text-red-500 text-xs mt-1">
                  * Studio is required
                </p>
              )}
            </div>
            <div className="w-full hidden">
              <Calendar
                mode="single"
                inline
                isClearable={true}
                selected={startDate}
                disabled={{ before: new Date() }}
                onSelect={(value) => setStartDate(value)}
                numberOfMonths={1}
                className="w-full"
              />
            </div>
          </div>
          <div className={styles.calender}>
            <div className="flex gap-2 w-full  h-[120%] hidden slider">
              <div className="flex-1 h-[120%]">
                <TimeSlider
                  title="Start Time"
                  value={startTime}
                  onChange={(val) => setStartTime(val)}
                  selectedDate={startDate}
                  blockedTimes={blockedTimesForStartDate}
                />
              </div>
              <div className="flex-1">
                <TimeSlider
                  title="End Time"
                  value={endTime}
                  onChange={(val) => setEndTime(val)}
                  selectedDate={startDate}
                  blockedTimes={blockedTimesForStartDate}
                />
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT SIDE: Working Hours */}
        <div className={styles.rightSide}>
          {/* Working Hours Start */}
          <div>
            {/* <div className={styles.singleRow}>
              <div className="flex flex-col">
                <label className="font-bold text-xs mb-1">
                  Working Hours Start
                </label>
                {isMobile ? (
                  // In mobile view simply display the date/time info
                  <DateTimeDisplay
                    date={startDate}
                    time={startTime}
                    fallbackDate="Mon (05/12)"
                    fallbackTime="10:00 AM"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div>
                        <DateTimeDisplay
                          date={startDate}
                          time={startTime}
                          fallbackDate="Mon (05/12)"
                          fallbackTime="10:00 AM"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-2 bg-[#f8f8f8] flex flex-col md:flex-row gap-4 w-full md:w-[600px] max-h-[80vh] overflow-y-auto"
                      align="end"
                    >
                      <div className="flex-1">
                        <Calendar
                          mode="single"
                          inline
                          isClearable={true}
                          selected={startDate}
                          disabled={{ before: new Date() }}
                          onSelect={(value) => setStartDate(value)}
                          numberOfMonths={1}
                        />
                      </div>
                      <div className="flex-1">
                        <TimeSlider
                          value={startTime}
                          onChange={(val) => setStartTime(val)}
                          selectedDate={startDate}
                          blockedTimes={blockedTimesForStartDate}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
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

              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1">
                  Working Hours End
                </label>
                {isMobile ? (
                  // In mobile view simply display the date/time info
                  <DateTimeDisplay
                    date={startDate}
                    time={endTime}
                    fallbackDate="Mon (05/12)"
                    fallbackTime="10:00 AM"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div>
                        <DateTimeDisplay
                          date={startDate}
                          time={endTime}
                          fallbackDate="Mon (05/12)"
                          fallbackTime="10:00 AM"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-2 bg-[#f8f8f8] flex flex-col md:flex-row gap-4 w-full md:w-[600px] max-h-[80vh] overflow-y-auto"
                      align="end"
                    >
                      <div className="flex-1">
                        <Calendar
                          mode="single"
                          inline
                          isClearable={true}
                          selected={startDate}
                          disabled={{ before: new Date() }}
                          onSelect={(value) => setStartDate(value)}
                          numberOfMonths={1}
                        />
                      </div>
                      <div className="flex-1">
                        <TimeSlider
                          value={endTime}
                          onChange={(val) => setEndTime(val)}
                          selectedDate={startDate}
                          blockedTimes={blockedTimesForStartDate}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {errors.endTime && (
                  <p className="text-red-500 text-xs mt-1">
                    * End time is required or must be after start time
                  </p>
                )}
              </div>
            </div> */}
            <Button
              variant="default"
              className="block sm:hidden mt-4 h-12 px-10 rounded-none"
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
          {/* Mobile view extra block: Responsive Calendar and both TimeSliders side by side */}
          {isMobile && (
            <div className="flex flex-col gap-0 mt-4 w-full px-2">
              <div className="w-full">
                <Calendar
                  mode="single"
                  inline
                  isClearable={true}
                  selected={startDate}
                  disabled={{ before: new Date() }}
                  onSelect={(value) => setStartDate(value)}
                  numberOfMonths={1}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <TimeSlider
                    title="Start Time"
                    value={startTime}
                    onChange={(val) => setStartTime(val)}
                    selectedDate={startDate}
                    blockedTimes={blockedTimesForStartDate}
                  />
                </div>
                <div className="flex-1">
                  <TimeSlider
                    title="End Time"
                    value={endTime}
                    onChange={(val) => setEndTime(val)}
                    selectedDate={startDate}
                    blockedTimes={blockedTimesForStartDate}
                  />
                </div>
              </div>
            </div>
          )}
          <Button
            variant="default"
            className="hidden sm:block mt-4 h-12 px-10 rounded-none"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
