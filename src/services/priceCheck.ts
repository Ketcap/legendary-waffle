import * as functions from 'firebase-functions';

import { formatItems, gatherItems, groupItems } from './utils';
import { sendNotifications } from './bot';
import { REGION } from '../config';

const FIRST_PAGE = 'https://www.akakce.com/fiyati-dusen-urunler/?c=1053';

export const priceCheck = functions
  .region(REGION)
  .pubsub // every hour
  .schedule('0 * * * *')
  .timeZone('Europe/Istanbul')
  .onRun(async () => {
    const items = await gatherItems(FIRST_PAGE, []);
    const groupedItems = groupItems(items);
    const formattedItems = formatItems(groupedItems);
    await sendNotifications(formattedItems);
  });
