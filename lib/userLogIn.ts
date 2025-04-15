/**
 * Authenticates a user against the backend API
 * Returns a user object with token that NextAuth can use
 */
export default async function userLogIn(email: string, password: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Authentication failed");
  }

  const data = await response.json();

  // Return user object that NextAuth can store in the session
  return {
    id: data.userId,
    name: data.name || email.split("@")[0],
    email: email,
    token: data.token,
  };
}
