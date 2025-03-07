import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";

export default async function handler(req, res) {
  await dbConnect();
  console.log("geting get call");
  if (req.method === "POST") {
    try {
      // Extract data from request body (you should validate these fields)
      const {
        studio,
        startDate,
        startTime,
        endDate,
        endTime,
        items,
        subtotal,
        surcharge,
        estimatedTotal,
      } = req.body;

      // Recalculate totals on the server for security:
      const recalculatedSubtotal = items.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
      );
      if (Number(subtotal) !== recalculatedSubtotal) {
        return res.status(400).json({ message: "Invalid subtotal" });
      }

      const recalculatedTotal = recalculatedSubtotal + surcharge;
      if (Number(estimatedTotal) !== recalculatedTotal) {
        return res.status(400).json({ message: "Total mismatch" });
      }

      // Save the booking in your database
      const booking = new Booking({
        studio,
        startDate,
        startTime,
        endDate,
        endTime,
        items,
        subtotal: recalculatedSubtotal,
        surcharge,
        estimatedTotal: recalculatedTotal,
      });

      await booking.save();
      res.status(201).json({ message: "Booking saved", booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } else if (req.method === "GET") {
    try {
      // Fetch all booking details from the database
      const bookings = await Booking.find({});
      res.status(200).json({ bookings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
