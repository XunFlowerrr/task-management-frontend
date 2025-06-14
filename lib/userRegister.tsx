export default async function userRegister(
  name: string,
  telephone: string,
  address: string,
  email: string,
  password: string
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to register");
  }

  return await response.json();
}
