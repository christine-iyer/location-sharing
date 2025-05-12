import { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Head from "next/head";
import axios from "axios";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface DistanceResult {
  distance: string;
  duration: string;
}

interface GeocodingResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface DistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      status: string;
    }>;
  }>;
}

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<string>("");
  const [distanceResult, setDistanceResult] = useState<DistanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axios.get<GeocodingResponse>(`/api/distance?type=geocode&from=${latitude},${longitude}`);
          
          if (response.data.status === "OK" && response.data.results[0]) {
            setCurrentLocation({
              lat: latitude,
              lng: longitude,
              address: response.data.results[0].formatted_address
            });
            setError(null);
          } else {
            setError("Could not get address for your location");
          }
        } catch (error) {
          setError("Error getting location details");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError("Unable to retrieve your location");
        console.error(error);
        setLoading(false);
      }
    );
  };

  const calculateDistance = async () => {
    if (!currentLocation || !destination) {
      setError("Please provide both locations");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<DistanceMatrixResponse>(
        `/api/distance?from=${currentLocation.lat},${currentLocation.lng}&to=${encodeURIComponent(destination)}`
      );

      if (response.data.status === "OK" && response.data.rows?.[0]?.elements?.[0]?.distance) {
        const { distance, duration } = response.data.rows[0].elements[0];
        setDistanceResult({
          distance: distance.text,
          duration: duration.text
        });
      } else {
        setError("Could not calculate distance");
      }
    } catch (error) {
      setError("Error calculating distance");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = currentLocation || { lat: 0, lng: 0 };

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
          onClick={getCurrentLocation}
          disabled={loading}
          className="mb-8 rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Loading..." : "Share My Location"}
        </button>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        {currentLocation && (
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
                <strong>Current Location:</strong> {currentLocation.address}
              </p>

              <div className="mt-6">
                <h2 className="mb-4 text-xl font-semibold">Calculate Distance</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter destination address"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <button
                    onClick={calculateDistance}
                    disabled={loading}
                    className="w-full rounded-lg bg-green-500 px-6 py-3 text-white hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {loading ? "Calculating..." : "Calculate Distance"}
                  </button>
                  {distanceResult && (
                    <div className="mt-4 text-center">
                      <p className="text-lg font-semibold text-green-600">
                        Distance: {distanceResult.distance}
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        Duration: {distanceResult.duration}
                      </p>
                    </div>
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
