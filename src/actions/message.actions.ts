"use server";

import { Message } from "@/db/dummy";
import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { pusherServer } from "@/lib/pusher";

type SendMessageActionArgs = {
  content: string;
  receiverId: string;
  messageType: "text" | "image";
};
export async function sendMessageAction({
  content,
  messageType,
  receiverId,
}: SendMessageActionArgs) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) return { success: false, message: "User not authenticated" };

  const senderId = user.id;
  const conversationId = `conversation:${[senderId, receiverId]
    .sort()
    .join(":")}`;

  // the issue with this has been explained in the tutorial, we need to sort the ids to make sure the conversation id is always the same
  // john, jane
  // 123,  456

  // john sends a message to jane
  // senderId: 123, receiverId: 456
  // `conversation:123:456`

  // jane sends a message to john
  // senderId: 456, receiverId: 123
  // conversation:456:123

  const conversationExists = await redis.exists(conversationId);

  if (!conversationExists) {
    await redis.hset(conversationId, {
      participant1: senderId,
      participant2: receiverId,
    });

    await redis.sadd(`user:${senderId}:conversations`, conversationId);
    await redis.sadd(`user:${receiverId}:conversations`, conversationId);
  }
  // generate unique message Id
  const messageId = `message:${Date.now()}:${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const timestamp = Date.now();

  // create the message hash
  await redis.hset(messageId, {
    senderId,
    content,
    timestamp,
    messageType,
  });

  await redis.zadd(`${conversationId}:messages`, {
    score: timestamp,
    member: JSON.stringify(messageId),
  });

  const channelName = `${senderId}__${receiverId}`
    .split("__")
    .sort()
    .join("__");

  await pusherServer?.trigger(channelName, "newMessage", {
    message: { senderId, content, timestamp, messageType },
  });

  return { success: true, conversationId, messageId };
}

export async function getMessages(
  selectedUserId: string,
  currentUserId: string
) {
  //
  const conversationId = `conversation:${[selectedUserId, currentUserId]
    .sort()
    .join(":")}`;

  const messageId = await redis.zrange(`${conversationId}:messages`, 0, -1);

  if (messageId.length === 0) return [];

  const pipeline = redis.pipeline();
  messageId.forEach((messageId) => pipeline.hgetall(messageId as string));

  const messages = (await pipeline.exec()) as Message[];

  return messages;
}
