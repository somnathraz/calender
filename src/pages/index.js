import React, { useState } from "react";
import { format } from "date-fns";
import { MdLocationOn, MdCalendarMonth, MdAccessTime } from "react-icons/md";
// shadcn/ui components
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Your custom components / styles
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import styles from "@/styles/Home.module.css";

/**
 * Custom component to display date and time with icons in a consistent format.
 * When no date is provided, it falls back to the provided fallback values.
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

/**
 * Example "BookingPage" component
 */
export default function BookingPage() {
  // ---------------------------
  // 1) DATE/TIME STATES
  // ---------------------------
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState("10:00 AM");

  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState("10:00 AM");

  // Popover open state for the date/time calendar
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ---------------------------
  // 2) STUDIO GROUPS + CHECKBOXES
  // ---------------------------
  const studioGroups = [
    {
      name: "BOTH STUDIOS",
      items: [
        {
          id: "both-led-lights",
          label: "(2) LED LIGHTS + (2) SOFT BOXES + $20.00",
        },
        {
          id: "both-filming",
          label:
            "1-1 FILMING VIDEO + NEED SILENCE (ONLY INSIDE THE EXTENSION) + $400.00",
        },
        {
          id: "both-bts",
          label: "2 BTS REELS BY OUR TEAM + $400.00",
        },
      ],
    },
    {
      name: "THE EXTENSION",
      items: [
        {
          id: "ext-led-lights",
          label: "(2) LED LIGHTS + (2) SOFT BOXES + $20.00",
        },
        {
          id: "ext-filming",
          label:
            "1-1 FILMING VIDEO + NEED SILENCE (ONLY INSIDE THE EXTENSION) + $400.00",
        },
        {
          id: "ext-bts",
          label: "2 BTS REELS BY OUR TEAM + $400.00",
        },
      ],
    },
  ];

  // Which items are selected (array of item IDs)
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // Popover open state for the "Select Studio" popover
  const [studioPopoverOpen, setStudioPopoverOpen] = useState(false);

  // Toggle a checkbox item on/off
  const handleToggleAddOn = (itemId) => {
    setSelectedAddOns((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // ---------------------------
  // 3) DYNAMIC LABEL FOR STUDIO POPUP
  // ---------------------------
  function getStudioTriggerLabel() {
    // Extract item IDs per group
    const bothStudiosIds = studioGroups[0].items.map((item) => item.id);
    const extensionIds = studioGroups[1].items.map((item) => item.id);

    // Count how many are selected in each group
    const selectedBoth = selectedAddOns.filter((id) =>
      bothStudiosIds.includes(id)
    ).length;
    const selectedExt = selectedAddOns.filter((id) =>
      extensionIds.includes(id)
    ).length;

    // If none are selected at all
    if (selectedAddOns.length === 0) {
      return "Choose Studio + Options";
    }

    // If only items from the first group are selected
    if (selectedBoth > 0 && selectedExt === 0) {
      return "BOTH STUDIOS";
    }

    // If only items from the second group are selected
    if (selectedExt > 0 && selectedBoth === 0) {
      return "THE EXTENSION";
    }

    // If items from both groups are selected
    return "Multiple selections";
  }

  // ---------------------------
  // 4) RENDER
  // ---------------------------
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        {/* LEFT SIDE: "Select Studio" popover with grouped checkboxes */}
        <div className={styles.leftSide}>
          <div className={styles.wrap}>
            <label className="w-40 text-xs font-bold mb-1">Select Studio</label>
            <Popover
              open={studioPopoverOpen}
              onOpenChange={setStudioPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  className="w-full bg-[#f8f8f8] justify-start text-black hover:bg-[#f8f8f8]"
                >
                  <MdLocationOn className="mr-1" />
                  {getStudioTriggerLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                className="bg-[#f8f8f8] p-4 w-[80%] text-black"
              >
                {studioGroups.map((group) => (
                  <div key={group.name} className="mb-3">
                    <div className="font-bold mb-1">{group.name}</div>
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-start mb-1">
                        <Checkbox
                          checked={selectedAddOns.includes(item.id)}
                          onCheckedChange={() => handleToggleAddOn(item.id)}
                          id={item.id}
                        />
                        <label
                          htmlFor={item.id}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* RIGHT SIDE: Working Hours, Timezone, etc. */}
        <div className={styles.rightSide}>
          <div className="flex items-center gap-4">
            {/* Popover for Start/End date/time */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer">
                  {/* Working Hours Start */}
                  <div className="flex flex-col">
                    <label className="font-bold text-xs mb-1">
                      Working Hours Start
                    </label>
                    <DateTimeDisplay
                      date={startDate}
                      time={startTime}
                      fallbackDate="Mon (05/12)"
                      fallbackTime="10:00 AM"
                    />
                  </div>

                  {/* Working Hours End */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold mb-1">
                      Working Hours End
                    </label>
                    <DateTimeDisplay
                      date={endDate}
                      time={endTime}
                      fallbackDate="Tue (05/12)"
                      fallbackTime="10:00 AM"
                    />
                  </div>
                </div>
              </PopoverTrigger>

              <PopoverContent
                className="bg-[#f8f8f8] p-4 mt-2 w-full"
                align="start"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex gap-8">
                    {/* Start Date + Time Picker */}
                    <div>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                      <div className="mt-2">
                        <label className="block text-xs font-bold mb-1">
                          Start Time
                        </label>
                        <TimeSlider
                          value={startTime}
                          onChange={(val) => setStartTime(val)}
                        />
                      </div>
                    </div>

                    {/* End Date + Time Picker */}
                    <div>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                      />
                      <div className="mt-2">
                        <label className="block text-xs font-bold mb-1">
                          Drop-off Time:
                        </label>
                        <TimeSlider
                          value={endTime}
                          onChange={(val) => setEndTime(val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="default"
                      onClick={() => setCalendarOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Timezone (placeholder - could be another Select or Popover) */}
            <div className="flex flex-col">
              <label className="text-xs font-bold mb-1">Timezone</label>
              <div className="w-[180px] bg-[#f8f8f8] p-2 text-sm">
                (GMT+05:00)
              </div>
            </div>

            {/* Get Started button */}
            <Button variant="default" className="ml-auto h-12 px-6">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
