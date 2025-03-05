import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking"; // Your booking model
import Product from "@/models/Product"; // Your product model

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === "POST") {
    try {
      const {
        studio: clientStudio,
        startDate,
        startTime,
        endDate,
        endTime,
        items: clientItems,
        subtotal: clientSubtotal,
        surcharge,
        estimatedTotal: clientTotal,
      } = req.body;
      //   console.log(clientItems, "clientItems");

      // Retrieve the product document from the database
      const productDoc = await Product.findOne().lean();
      //   console.log(productDoc, "productDoc");
      if (!productDoc) {
        return res.status(400).json({ message: "Product catalog not found" });
      }

      // --- Validate Studio ---
      const validStudio = productDoc.studios.find(
        (s) => s.name.toLowerCase() === clientStudio.toLowerCase()
      );
      if (!validStudio) {
        return res.status(400).json({
          message: `Invalid studio: "${clientStudio}" is not available in our catalog.`,
        });
      }

      // --- Validate Services (Add-ons) ---
      // Build a price map using the custom "id" field from the services array
      const priceMap = {};
      productDoc.services.forEach((service) => {
        // Convert the custom id to a string to ensure type consistency
        priceMap[String(service.id)] = service.pricePerHour;
      });

      //   console.log(priceMap);
      let recalculatedSubtotal = 0;

      for (const clientItem of clientItems) {
        // Ensure you’re comparing the same types
        const canonicalPrice = priceMap[String(clientItem.id)];
        if (canonicalPrice === undefined) {
          return res.status(400).json({
            message: `Invalid product: ${clientItem.name} (ID: ${clientItem.id}) was not found in our catalog.`,
          });
        }
        // Optionally, you can also verify that the client's price (if provided) matches canonicalPrice
        // if (clientItem.price && clientItem.price !== canonicalPrice) { ... }

        recalculatedSubtotal += clientItem.quantity * canonicalPrice;
      }

      // Validate the subtotal and total amounts
      if (Number(clientSubtotal) !== recalculatedSubtotal) {
        return res.status(400).json({ message: "Subtotal mismatch" });
      }
      const recalculatedTotal = recalculatedSubtotal + surcharge;
      if (Number(clientTotal) !== recalculatedTotal) {
        return res.status(400).json({ message: "Total mismatch" });
      }

      // Save the booking in your database
      const booking = new Booking({
        studio: clientStudio,
        startDate,
        startTime,
        endDate,
        endTime,
        items: clientItems,
        subtotal: recalculatedSubtotal,
        surcharge,
        estimatedTotal: recalculatedTotal,
      });
      await booking.save();

      // Proceed to create a payment session here (e.g., using Stripe)
      res.status(201).json({ message: "Booking validated and saved", booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
