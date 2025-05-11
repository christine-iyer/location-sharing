import { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Head from "next/head";

export default function Home() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setError(null);
      },
      (error) => {
        setError("Unable to retrieve your location");
        console.error(error);
      }
    );
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
        <meta name="description" content="Share your location with others" />
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
              <p>
                <strong>Longitude:</strong> {location.coords.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
