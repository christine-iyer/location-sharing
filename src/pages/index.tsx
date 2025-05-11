import { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Head from "next/head";
import axios from "axios";

interface DistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: Array<{
      distance?: {
        value: number;
        text: string;
      };
      status: string;
    }>;
  }>;
}

export default function Home() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    from: "",
    to: "",
  });
  const [distance, setDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setError(null);
        // Set the current location as the "from" address
        setForm((prev) => ({
          ...prev,
          from: `${position.coords.latitude},${position.coords.longitude}`,
        }));
      },
      (error) => {
        setError("Unable to retrieve your location");
        console.error(error);
      }
    );
  };

  const calculateDistance = async () => {
    const from = form.from.trim();
    const to = form.to.trim();

    if (!from || !to) {
      setError("Please fill in both locations.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
      }

      const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        from
      )}&destinations=${encodeURIComponent(to)}&key=${apiKey}`;

      console.log("Making request to:", apiUrl);

      const response = await axios.get(apiUrl);
      const data = response.data as DistanceMatrixResponse;

      console.log("API Response:", data);

      if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.distance) {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const distanceInMiles = (distanceInMeters * 0.000621371).toFixed(2);
        setDistance(`${distanceInMiles} miles`);
      } else {
        const errorMessage = data.error_message || "Unable to calculate distance. Please try again.";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError("An error occurred while calculating the distance.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = location
    ? {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }
    : {
        lat: 0,
        lng: 0,
      };

  return (
    <>
      <Head>
        <title>Location Sharing App</title>
        <meta name="description" content="Share your location and calculate distances" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="mb-8 text-4xl font-bold">Location Sharing App</h1>
        
        <button
          onClick={getLocation}
          className="mb-8 rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
        >
          Share My Location
        </button>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        {location && (
          <div className="w-full max-w-2xl">
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
              >
                <Marker position={center} />
              </GoogleMap>
            </LoadScript>
            
            <div className="mt-4 rounded-lg bg-gray-100 p-4">
              <p className="mb-2">
                <strong>Latitude:</strong> {location.coords.latitude.toFixed(6)}
              </p>
              <p className="mb-4">
                <strong>Longitude:</strong> {location.coords.longitude.toFixed(6)}
              </p>

              <div className="mt-6">
                <h2 className="mb-4 text-xl font-semibold">Calculate Distance</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="From (current location)"
                    value={form.from}
                    onChange={(e) => setForm((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="To (destination)"
                    value={form.to}
                    onChange={(e) => setForm((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <button
                    onClick={calculateDistance}
                    disabled={loading}
                    className="w-full rounded-lg bg-green-500 px-6 py-3 text-white hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {loading ? "Calculating..." : "Calculate Distance"}
                  </button>
                  {distance && (
                    <p className="mt-4 text-center text-lg font-semibold text-green-600">
                      Distance: {distance}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
