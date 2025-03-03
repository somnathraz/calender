import { BookingProvider } from "@/context/BookingContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <BookingProvider>
      <Component {...pageProps} />
    </BookingProvider>
  );
}
