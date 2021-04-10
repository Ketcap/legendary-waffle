import { Telegraf } from 'telegraf';

import { BASE_FUNCTIONS, BOT_TOKEN, admin } from '../config';

const db = admin.firestore();
const channels = db.collection('channels');

const bot = new Telegraf(BOT_TOKEN as string);

bot.telegram.setWebhook(`${BASE_FUNCTIONS}/telegramHandler`);

/**
 * Register user to notification List
 * Chat id will be saved as unique id
 * registered column added as true
 */
bot.command('register', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const chatRef = channels.doc(`${chatId}`);
  const chatDoc = await chatRef.get();
  if (chatDoc.data()?.registered) {
    ctx.reply(`You are already registered for notification`);
    return;
  }
  await chatRef.set({
    registered: true,
    from: ctx.message.from.username ?? '',
  });
  ctx.reply('You have been subscribed to notifications');
});

/**
 * Un-Register user from the notification List
 * Chat id will be remain but register value is false
 */
bot.command('unregister', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const chatRef = channels.doc(`${chatId}`);
  const chatDoc = await chatRef.get();
  if (!chatDoc.exists || !chatDoc.data()?.registered) {
    ctx.reply(`You are not registered notification`);
    return;
  }
  await chatRef.update({
    registered: false,
  });
  ctx.reply('You have been un-subscribed to notifications');
});

/**
 * Listing users that are in the db
 * with their name and register status.
 */
bot.command('list', async (ctx) => {
  const snapshot = await channels.get();
  const usernames: string[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    usernames.push(`- ${data.from}: ${data.registered ? '✅' : '❌'}`);
  });

  ctx.replyWithMarkdown(usernames.join('\n'));
});

/**
 * Send message to users as a notification
 * Users what are regist ered will recieve
 *
 * Its broadcast message
 */
export const sendNotifications = async (content: string) => {
  const snapshot = await channels.get();
  const users: { id: string; name: string }[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.registered) {
      users.push({
        id: doc.id,
        name: data.from,
      });
    }
  });
  /**
   * Map all the messeage sending requests as async
   * Then call them with promise all to send all
   */
  const sendMessagePromises = users.map(({ id, name }) => {
    return bot.telegram.sendMessage(
      id,
      `Hello ${name},\n
      ${content}
      `,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
  });
  await Promise.all(sendMessagePromises);
};

export { bot };
