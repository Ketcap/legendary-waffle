import * as functions from 'firebase-functions';

import { REGION } from '../config';
import { bot } from '../services/bot';

export const telegramHandler = functions
  .region(REGION)
  .https.onRequest(async (request, response) => {
    try {
      await bot.handleUpdate(request.body);
    } finally {
      response.status(200).end();
    }
  });
