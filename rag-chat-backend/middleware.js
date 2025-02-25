export default function middleware(req) {
  const response = new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return response;
  }

  return response;
}

export const config = {
  matcher: "/api/:path*", // Apply CORS to all API routes
};
