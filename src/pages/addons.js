import React, { useContext } from "react";
import { BookingContext } from "@/context/BookingContext";
import styles from "@/styles/Addon.module.css";
import Image from "next/image";
import { useRouter } from "next/router";

export default function AddOnsPage() {
  const {
    studio,
    startDate,
    startTime,
    endDate,
    endTime,
    items,
    updateItemQuantity,
  } = useContext(BookingContext);
  const router = useRouter();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add-Ons / Cart</h2>

      {/* Booking Details */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <p className="text-lg font-semibold">Studio: {studio}</p>
        <p className="text-lg">
          Start: {startDate?.toDateString()} {startTime}
        </p>
        <p className="text-lg">
          End: {endDate?.toDateString()} {endTime}
        </p>
      </div>

      {/* Add-On Items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2">
            {/* Item Image */}
            <div className={styles.image}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="rounded-md mb-2"
              />
            </div>

            {/* Item Name & Price */}
            <div className="flex justify-between">
              <p className="text-lg font-semibold w-[50%]">{item.name}</p>

              {/* Quantity Controls */}
              <div className="flex gap-2 items-center">
                <p className="text-gray-600 font-bold">${item.price}/Hr</p>
                <div className="flex items-center justify-center gap-1">
                  <button
                    className={`px-2 py-[2px] rounded-md ${
                      item.quantity === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => updateItemQuantity(item.id, -1)}
                    disabled={item.quantity === 0}
                  >
                    −
                  </button>
                  <span className="px-4 text-lg font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    className={`px-2 py-[2px] rounded-md ${
                      item.quantity > 0
                        ? "bg-black text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => updateItemQuantity(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-8 mt-6">
        <button
          className={`px-6 py-2 text-white rounded-md ${
            items.some((item) => item.quantity > 0)
              ? "bg-gray-400  hover:bg-gray-800"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!items.some((item) => item.quantity > 0)}
        >
          Back
        </button>
        <button
          className={`px-6 py-2 text-white rounded-md ${
            items.some((item) => item.quantity > 0)
              ? "bg-black hover:bg-gray-800"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!items.some((item) => item.quantity > 0)}
          onClick={() => router.push("/checkout")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
