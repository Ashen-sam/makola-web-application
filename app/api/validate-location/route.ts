// app/api/validate-location/route.ts
import { NextRequest, NextResponse } from "next/server";

// // Makola area boundaries (you can adjust these based on the exact area)
// const MAKOLA_BOUNDARIES = {
//   north: 7.045, // Northern boundary
//   south: 7.03, // Southern boundary
//   east: 79.965, // Eastern boundary
//   west: 79.945, // Western boundary
// };

// // More precise polygon points for Makola area (you can add more points for accuracy)
// const MAKOLA_POLYGON = [
//   { lat: 7.03, lng: 79.945 }, // Southwest
//   { lat: 7.045, lng: 79.945 }, // Northwest
//   { lat: 7.045, lng: 79.965 }, // Northeast
//   { lat: 7.03, lng: 79.965 }, // Southeast
// ];

const MAKOLA_POLYGON = [
  { lat: 6.9723, lng: 79.941 }, // Southwest corner near Y Junction
  { lat: 6.976, lng: 79.9415 }, // Northwest near Nagoda Rd
  { lat: 6.9788, lng: 79.944 }, // Top
  { lat: 6.9805, lng: 79.9488 }, // East top
  { lat: 6.9802, lng: 79.9515 }, // Mid East
  { lat: 6.9783, lng: 79.955 }, // East bend
  { lat: 6.9753, lng: 79.9575 }, // Eastern curve
  { lat: 6.972, lng: 79.9565 }, // Near Keells
  { lat: 6.97, lng: 79.953 }, // Bottom
  { lat: 6.9702, lng: 79.947 }, // South central
  { lat: 6.9712, lng: 79.943 }, // South West
  { lat: 6.9723, lng: 79.941 }, // Close the loop
];

// Bounding box around the polygon to speed up basic checks
const MAKOLA_BOUNDARIES = {
  north: 6.981,
  south: 6.9695,
  east: 79.958,
  west: 79.94,
};

function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

function isWithinMakolaBoundaries(lat: number, lng: number): boolean {
  // First check simple bounding box
  const withinBox =
    lat >= MAKOLA_BOUNDARIES.south &&
    lat <= MAKOLA_BOUNDARIES.north &&
    lng >= MAKOLA_BOUNDARIES.west &&
    lng <= MAKOLA_BOUNDARIES.east;

  // Then check polygon (more precise)
  const withinPolygon = isPointInPolygon({ lat, lng }, MAKOLA_POLYGON);

  return withinBox && withinPolygon;
}

// POST - Validate if coordinates are within Makola area
export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        {
          error: "Invalid coordinates",
          valid: false,
          message: "Latitude and longitude must be valid numbers",
        },
        { status: 400 }
      );
    }

    const isValid = isWithinMakolaBoundaries(latitude, longitude);

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: "Location is within Makola area",
        coordinates: { latitude, longitude },
      });
    } else {
      return NextResponse.json(
        {
          valid: false,
          message:
            "Location is outside Makola area. Please select a location within Makola boundaries.",
          coordinates: { latitude, longitude },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Location validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        valid: false,
        message: "Failed to validate location",
      },
      { status: 500 }
    );
  }
}

// GET - Get Makola area boundaries (for frontend map initialization)
export async function GET() {
  try {
    return NextResponse.json({
      boundaries: MAKOLA_BOUNDARIES,
      polygon: MAKOLA_POLYGON,
      center: {
        lat: (MAKOLA_BOUNDARIES.north + MAKOLA_BOUNDARIES.south) / 2,
        lng: (MAKOLA_BOUNDARIES.east + MAKOLA_BOUNDARIES.west) / 2,
      },
    });
  } catch (error) {
    console.error("Get boundaries error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
