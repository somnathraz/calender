import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "Missing session ID" });
    }

    console.log(`🔍 Verifying Stripe session: ${session_id}`);

    // Fetch Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("✅ Stripe Session Retrieved:", session);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Extract booking ID from metadata
    const bookingId = session.metadata.bookingId;
    if (!bookingId) {
      return res
        .status(400)
        .json({ message: "Booking ID missing from session metadata" });
    }

    // Update booking status in database
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "paid" },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`✅ Booking ${bookingId} marked as paid`);

    res
      .status(200)
      .json({ message: "Payment verified", booking: updatedBooking });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}
