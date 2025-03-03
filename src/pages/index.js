import React, { useContext, useState } from "react";
import { format, startOfDay } from "date-fns";
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
import { useRouter } from "next/router"; // if using Next.js

/**
 * Custom component to display date and time with icons.
 */
function DateTimeDisplay({
  date,
  time,
  fallbackDate = "Mon (05/12)",
  fallbackTime = "10:00 AM",
}) {
  const displayDate = date ? format(date, "EEE (MM/dd)") : fallbackDate;
  const displayTime = date ? time : fallbackTime;
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

  // Local state for errors
  const [errors, setErrors] = useState({
    studio: false,
    startDate: false,
    startTime: false,
    endDate: false,
    endTime: false,
  });

  // Validate all required fields on Next click
  const handleNext = () => {
    const newErrors = {
      studio: !studio,
      startDate: !startDate,
      startTime: !startTime,
      endDate: !endDate,
      endTime: !endTime,
    };

    // If any field is missing, set errors and do not proceed
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

    // All fields are filled; navigate to next page
    router.push("/addons"); // or perform your next action
  };

  return (
    <div className={styles.wrapper}>
      {/* Main Row */}
      <div className={styles.row}>
        {/* LEFT SIDE: "Select Studio" dropdown */}
        <div className={styles.leftSide}>
          <div className={styles.wrap}>
            <label className="w-40 text-xs font-bold mb-1">Select Studio</label>
            <Select value={studio} onValueChange={setStudio}>
              <SelectTrigger className="w-full bg-[#f8f8f8] justify-start text-black hover:bg-[#f8f8f8]">
                <MdLocationOn className="mr-1" />
                <SelectValue placeholder="Select Studio" />
              </SelectTrigger>
              <SelectContent className="bg-[#f8f8f8] text-black">
                <SelectItem value="BOTH STUDIOS">BOTH STUDIOS</SelectItem>
                <SelectItem value="THE EXTENSION">THE EXTENSION</SelectItem>
              </SelectContent>
            </Select>
            {errors.studio && (
              <p className="text-red-500 text-xs mt-1">* Studio is required</p>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Working Hours */}
        <div className={styles.rightSide}>
          {/* Working Hours Start with Time Slider Popover */}
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
                * Start time is required
              </p>
            )}
          </div>

          {/* Working Hours End with Time Slider Popover */}
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
                * End time is required
              </p>
            )}
          </div>

          <Button
            variant="default"
            className="mt-4 h-12 px-10"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mt-4 w-[70%] p-5 bg-[#f8f8f8]">
        <div className="flex justify-between">
          {/* Start Date Calendar */}
          <div className="flex justify-center items-center">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={{ before: today }}
              initialFocus
              className="w-full"
            />
          </div>

          {/* End Date Calendar */}
          <div className="flex justify-center items-center">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={{ before: today }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
