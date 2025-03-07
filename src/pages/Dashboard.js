import React, { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { saveAs } from "file-saver";

export default function BookingDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/booking");
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        console.log("✅ Fetched bookings:", data); // Debugging log
        if (data && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          setFilteredBookings(data.bookings);
        } else {
          // Handle unexpected response structure
          setBookings([]);
          setFilteredBookings([]);
        }
      } catch (error) {
        console.error("❌ Error fetching bookings:", error);
      }
    };
    fetchBookings();
  }, []);

  const handleFilter = () => {
    let filtered = [...bookings];

    if (monthFilter) {
      filtered = filtered.filter(
        (b) => format(new Date(b.startDate), "MM") === monthFilter
      );
    }
    if (yearFilter) {
      filtered = filtered.filter(
        (b) => format(new Date(b.startDate), "yyyy") === String(yearFilter)
      );
    }

    console.log("📌 Filtered Bookings:", filtered);
    setFilteredBookings(filtered);
  };

  // New function to clear filters
  const clearFilters = () => {
    setMonthFilter("");
    setYearFilter("");
    setFilteredBookings(bookings);
  };

  const exportCSV = () => {
    console.log("📂 Exporting CSV...");
    console.log("📂 Data to export:", filteredBookings);

    if (filteredBookings.length === 0) {
      alert("No data to export!");
      return;
    }

    // Get today's local date (without the time)
    const exportDate = new Date().toLocaleDateString();

    // Create an export header row
    const exportHeader = `Exported On: ${exportDate}\n\n`;

    const headers =
      "Studio,Start Date,Start Time,End Date,End Time,Subtotal,Surcharge,Total,Add-ons,Total Hours\n";
    const csvRows = filteredBookings.map((b) => {
      // Build add-ons string from items array
      const addOns =
        b.items && b.items.length > 0
          ? b.items
              .filter((item) => item.quantity > 0)
              .map((item) => `${item.name} (${item.quantity})`)
              .join("; ")
          : "None";

      // Compute total hours (using date-fns parse)
      let totalHours = "N/A";
      try {
        const startDateTime = parse(
          `${format(new Date(b.startDate), "yyyy-MM-dd")} ${b.startTime}`,
          "yyyy-MM-dd h:mm a",
          new Date()
        );
        const endDateTime = parse(
          `${format(new Date(b.endDate), "yyyy-MM-dd")} ${b.endTime}`,
          "yyyy-MM-dd h:mm a",
          new Date()
        );
        totalHours = ((endDateTime - startDateTime) / (1000 * 60 * 60)).toFixed(
          1
        );
      } catch (e) {
        console.error("Error calculating total hours", e);
      }

      return `${b.studio},${format(new Date(b.startDate), "yyyy-MM-dd")},${
        b.startTime
      },${format(new Date(b.endDate), "yyyy-MM-dd")},${b.endTime},${
        b.subtotal
      },${b.surcharge},${b.estimatedTotal},${addOns},${totalHours}`;
    });

    // Prepend the export header to your CSV data
    const csvData = exportHeader + headers + csvRows.join("\n");
    console.log("📂 CSV Data:\n", csvData);

    const blob = new Blob([csvData], { type: "text/csv" });
    // Include the date (without time) in the filename as well
    const fileName = `bookings-${exportDate}.csv`;
    saveAs(blob, fileName);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Bookings Dashboard</h2>
      <div className="flex gap-4 mb-4">
        <Select onValueChange={(value) => setMonthFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Month" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(12)].map((_, i) => (
              <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
                {format(new Date(2025, i, 1), "MMMM")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setYearFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Year" />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleFilter}>Apply Filters</Button>
        <Button onClick={clearFilters}>Clear Filters</Button>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Studio</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Surcharge</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Add‑ons</TableHead>
            <TableHead>Total Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-gray-500">
                No bookings found.
              </TableCell>
            </TableRow>
          ) : (
            filteredBookings.map((booking) => {
              // Build add-ons string from items array
              const addOns =
                booking.items && booking.items.length > 0
                  ? booking.items
                      .filter((item) => item.quantity > 0)
                      .map((item) => `${item.name} (${item.quantity})`)
                      .join("; ")
                  : "None";

              // Compute total hours
              let totalHours = "N/A";
              try {
                const startDateTime = parse(
                  `${format(new Date(booking.startDate), "yyyy-MM-dd")} ${
                    booking.startTime
                  }`,
                  "yyyy-MM-dd h:mm a",
                  new Date()
                );
                const endDateTime = parse(
                  `${format(new Date(booking.endDate), "yyyy-MM-dd")} ${
                    booking.endTime
                  }`,
                  "yyyy-MM-dd h:mm a",
                  new Date()
                );
                totalHours = (
                  (endDateTime - startDateTime) /
                  (1000 * 60 * 60)
                ).toFixed(1);
              } catch (e) {
                console.error("Error calculating total hours", e);
              }

              return (
                <TableRow key={booking._id}>
                  <TableCell>{booking.studio}</TableCell>
                  <TableCell>
                    {format(new Date(booking.startDate), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>{booking.startTime}</TableCell>
                  <TableCell>
                    {format(new Date(booking.endDate), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>{booking.endTime}</TableCell>
                  <TableCell>${booking.subtotal}</TableCell>
                  <TableCell>${booking.surcharge}</TableCell>
                  <TableCell>${booking.estimatedTotal}</TableCell>
                  <TableCell>{addOns}</TableCell>
                  <TableCell>{totalHours} hours</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
