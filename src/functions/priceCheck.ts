import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

import { formatItems, gatherItems, groupItems } from '../services/utils';
import { sendNotifications } from '../services/bot';
import { BASE_FUNCTIONS, REGION } from '../config';

const FIRST_PAGE = 'https://www.akakce.com/fiyati-dusen-urunler/?c=1053';

export const priceCheckSchedule = functions
  .region(REGION)
  .pubsub // every hour
  .schedule('0 * * * *')
  .timeZone('Europe/Istanbul')
  .onRun(() => {
    fetch(`${BASE_FUNCTIONS}/priceCheck`, {
      method: 'POST',
    });
    return null;
  });

export const priceCheck = functions
  // prettier-ignore
  .region(REGION)
  .https.onRequest(async (_, resp) => {
    const items = await gatherItems(FIRST_PAGE, []);
    const groupedItems = groupItems(items);
    const formattedItems = formatItems(groupedItems);
    await sendNotifications(formattedItems);
    resp.json({
      status: 'successfull',
    });
  });
