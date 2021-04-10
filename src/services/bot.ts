import { Telegraf } from 'telegraf';

import { BASE_FUNCTIONS, BOT_TOKEN } from '../config';
import {
  createDocument,
  getDocWithId,
  getListFromTable,
  Tables,
  updateDocument,
} from './firestore';

const bot = new Telegraf(BOT_TOKEN as string);

bot.telegram.setWebhook(`${BASE_FUNCTIONS}/telegramHandler`);

/**
 * Register user to notification List
 * Chat id will be saved as unique id
 * registered column added as true
 */
bot.command('register', async (ctx) => {
  const { id } = ctx.message.chat;
  const document = await getDocWithId(Tables.channels, `${id}`);
  if (document?.registered) {
    ctx.reply(`You are already registered for notification`);
    return;
  }
  await createDocument(Tables.channels, {
    id: `${id}`,
    registered: true,
    name: ctx.message.from.username ?? '',
  });
  ctx.reply('You have been subscribed to notifications');
});

/**
 * Un-Register user from the notification List
 * Chat id will be remain but register value is false
 */
bot.command('unregister', async (ctx) => {
  const { id } = ctx.message.chat;
  const document = await getDocWithId(Tables.channels, `${id}`);
  if (!document || document.registered) {
    ctx.reply(`You are not registered notification`);
    return;
  }
  await updateDocument(Tables.channels, `${id}`, {
    registered: false,
  });

  ctx.reply('You have been un-subscribed to notifications');
});

/**
 * Listing users that are in the db
 * with their name and register status.
 */
bot.command('list', async (ctx) => {
  const documents = await getListFromTable(Tables.channels);
  const usernames = documents
    .map((data) => `- ${data.name}: ${data.registered ? '✅' : '❌'}`)
    .join('\n');

  ctx.replyWithMarkdown(usernames);
});

/**
 * Send message to users as a notification
 * Users what are regist ered will recieve
 *
 * Its broadcast message
 */
export const sendNotifications = async (content: string) => {
  const documents = await getListFromTable(Tables.channels);
  const users: { id: string; name: string }[] = [];

  documents.forEach((data) => {
    if (data.registered) {
      users.push({
        id: data.id,
        name: data.name,
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
