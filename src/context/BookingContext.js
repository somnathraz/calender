import React, { createContext, useState } from "react";
import { startOfDay, addDays } from "date-fns";

// Function to get the nearest valid 30‑minute time slot
function getNearestValidTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const addMinutes = minutes % 30 === 0 ? 30 : 30 - (minutes % 30);
  const rounded = new Date(now.getTime() + addMinutes * 60000);
  const hour = rounded.getHours();
  const minute = rounded.getMinutes();
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const minStr = minute === 0 ? "00" : "30";
  return `${h12}:${minStr} ${ampm}`;
}

// Define the available studios along with their pricing per hour.
export const studiosList = [
  { name: "THE GROUND", pricePerHour: 200 },
  { name: "THE EXTENSION", pricePerHour: 250 },
  { name: "THE LAB", pricePerHour: 150 },
  { name: "BOTH THE LAB & THE EXTENSION FOR EVENTS", pricePerHour: 400 },
  { name: "THE PODCAST ROOM", pricePerHour: 100 },
];

// Create the context
export const BookingContext = createContext();

// Provider component
export function BookingProvider({ children }) {
  // Selected studio is now stored as an object.
  // Default to the first studio (or set to null if you prefer no default).
  const [selectedStudio, setSelectedStudio] = useState(studiosList[0]);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [startTime, setStartTime] = useState(getNearestValidTime());
  const [endDate, setEndDate] = useState(addDays(startOfDay(new Date()), 1));
  const [endTime, setEndTime] = useState("10:00 AM");

  // Placeholder image URL
  const placeholderImage = "/addon.png";

  // Example "cart items" or add‑on items with images.
  const [items, setItems] = useState([
    { id: 1, name: "Makeup", price: 20, quantity: 0, image: placeholderImage },
    { id: 2, name: "Steamer", price: 30, quantity: 0, image: placeholderImage },
    { id: 3, name: "Tables", price: 25, quantity: 0, image: placeholderImage },
    {
      id: 4,
      name: "Organic Stairs",
      price: 40,
      quantity: 0,
      image: placeholderImage,
    },
    {
      id: 5,
      name: "LED Lights + (2) Soft Boxes",
      price: 50,
      quantity: 0,
      image: placeholderImage,
    },
  ]);

  // Provide a function to update item quantity.
  const updateItemQuantity = (itemId, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };

  return (
    <BookingContext.Provider
      value={{
        studiosList,
        selectedStudio,
        setSelectedStudio,
        startDate,
        setStartDate,
        startTime,
        setStartTime,
        endDate,
        setEndDate,
        endTime,
        setEndTime,
        items,
        updateItemQuantity,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}
