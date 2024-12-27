"use server";
import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function checkAuthStatus() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) return { success: false };

  // namespace are really important to understand in redis
  const userId = `user:${user.id}`;
  const existingUser = await redis.hgetall(userId);

  // signup case: bcz user is visiting  our platform for the first time
  if (!existingUser || Object.keys(existingUser).length === 0) {
    const imgIsNull = user.picture?.includes("gravatar");
    const image = imgIsNull ? "" : user.picture;
    await redis.hset(userId, {
      id: user.id,
      email: user.email,
      name: `${user.given_name} ${user.family_name}`,
      image: image,
    });
  }

  return { success: true };
}
