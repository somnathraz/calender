import React, { useContext, useState } from "react";
import { BookingContext } from "@/context/BookingContext";
import styles from "@/styles/Checkout.module.css";
import { FiBox } from "react-icons/fi";
import {
  MdCalendarMonth,
  MdAccessTime,
  MdLocationOn,
  MdKeyboardArrowDown,
} from "react-icons/md";

function DateTimeDisplay({
  date,
  time,
  fallbackDate = "Mon (05/12)",
  fallbackTime = "10:00 AM",
}) {
  const displayDate = date ? date.toDateString() : fallbackDate;
  const displayTime = date ? time : fallbackTime;
  return (
    <div className="flex items-center w-full bg-gray-100 px-4 text-black rounded-md">
      <MdCalendarMonth size={16} className="mr-1 text-gray-500" />
      <span className="text-[15px]">{displayDate}</span>
      <span className="mx-1 text-gray-500">|</span>
      <MdAccessTime size={16} className="mr-1 text-gray-500" />
      <span className="text-[15px]">{displayTime}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const {
    studio,
    startDate,
    startTime,
    endDate,
    endTime,
    items,
    selectedStudio,
  } = useContext(BookingContext);
  console.log(items);

  // Calculate addons subtotal
  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  // Calculate the studio hours and cost if a studio is selected.
  // This assumes startDate and endDate are valid Date objects.
  const studioHours =
    selectedStudio && startDate && endDate
      ? (endDate - startDate) / (1000 * 60 * 60)
      : 0;
  const studioCost =
    selectedStudio && studioHours > 0
      ? studioHours * selectedStudio.pricePerHour
      : 0;

  const surcharge = 400; // Example surcharge amount

  // Update the estimated total to include studio cost.
  const estimatedTotal = subtotal + studioCost + surcharge;

  // Local state for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to handle checkout API call
  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    // Prepare the booking data from context
    const bookingData = {
      studio,
      startDate,
      startTime,
      endDate,
      endTime,
      items: items.filter((item) => item.quantity > 0),
      subtotal,
      studioCost,
      surcharge,
      estimatedTotal,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.message || "An error occurred during checkout");
      } else {
        // Payment session created or order validated successfully.
        // For example, redirect to payment gateway or show success message.
        alert("Booking validated and saved! Proceed to payment.");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6">
        Your Appointment Details
      </h2>

      {/* Studio Details Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-sm font-semibold">Studio Name</p>
            <div className="p-3 flex items-center gap-1 text-[14px] bg-gray-100">
              <MdLocationOn className="mr-1" />{" "}
              {selectedStudio
                ? `${
                    selectedStudio.name
                  } ($${selectedStudio.pricePerHour.toFixed(2)}/Hr)`
                : studio}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-sm font-semibold">
              Working Hours Start
            </p>
            <div className="p-3 text-[16px] bg-gray-100">
              <DateTimeDisplay date={startDate} time={startTime} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-sm font-semibold">
              Working Hours End
            </p>
            <div className="p-3 text-[16px] bg-gray-100">
              <DateTimeDisplay date={endDate} time={endTime} />
            </div>
          </div>
        </div>
      </div>

      {/* Your Addons Section */}
      <div className={styles.addonCard}>
        <div>
          <h3 className="text-lg font-bold mb-4">Your Addons</h3>
          {items
            .filter((item) => item.quantity > 0)
            .map((item) => (
              <div key={item.id} className="flex gap-2 py-2 items-center">
                <p className="flex items-center gap-2 bg-[#f8f8f8] px-4 py-3 font-semibold text-sm w-full">
                  <FiBox /> {item.name}
                </p>
              </div>
            ))}
        </div>

        <div>
          <div className="grid grid-cols-3 gap-20 font-semibold text-gray-600 mb-4">
            <p className="text-center">Total Hours</p>
            <p className="text-center">Price/Hr</p>
            <p className="text-center">Total Price</p>
          </div>
          {items
            .filter((item) => item.quantity > 0)
            .map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 gap-20 items-center py-2"
              >
                <p className="flex items-center justify-center gap-2 bg-[#f8f8f8] px-4 py-3 font-semibold text-center text-sm w-full">
                  {item.quantity}
                  <MdKeyboardArrowDown className="text-lg" />
                </p>
                <p className="flex items-center gap-2 justify-center bg-[#f8f8f8] px-4 py-3 font-semibold text-center text-sm w-full">
                  ${item.price}/Hr
                </p>
                <p className="flex items-center gap-2 justify-center bg-[#f8f8f8] px-4 py-3 font-semibold text-center text-sm w-full">
                  ${item.quantity * item.price}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Price Summary Section */}
      <div className={styles.totalCard}>
        <div className="flex justify-between text-lg mb-2">
          <p>Subtotal (Addons)</p>
          <p>${subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between text-lg mb-2">
          <p>Studio Price</p>
          <p>${studioCost.toFixed(2)}</p>
        </div>
        <div className="flex justify-between text-lg mb-2">
          <p>Surcharge (Details)</p>
          <p>${surcharge.toFixed(2)}</p>
        </div>
        <div className="flex justify-between text-xl font-bold mt-2">
          <p>Estimated Total</p>
          <p className="text-black">${estimatedTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Display any error message */}
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Checkout Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCheckout}
          className="bg-black text-white px-6 py-3 rounded-md text-lg"
          disabled={loading}
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}
