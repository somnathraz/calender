import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query; // Get session_id from URL

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session_id) return;

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/verify-payment?session_id=${session_id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Payment verification failed");
        }

        setStatus("success");
      } catch (err) {
        console.error("❌ Error verifying payment:", err);
        setStatus("failed");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [session_id]);

  if (loading) {
    return (
      <p className="text-center text-lg font-semibold">Verifying payment...</p>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === "success" ? (
        <div className="bg-green-100 p-6 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-green-700">
            Payment Successful 🎉
          </h1>
          <p>Your booking has been confirmed. Check your email for details.</p>
        </div>
      ) : (
        <div className="bg-red-100 p-6 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-red-700">Payment Failed ❌</h1>
          <p>{error || "Something went wrong. Please contact support."}</p>
        </div>
      )}
    </div>
  );
}
