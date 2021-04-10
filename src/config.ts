import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const runtimeConfig = functions.config();

const { BOT_TOKEN: ENV_TOKEN } = process.env;

const BOT_TOKEN = ENV_TOKEN ?? runtimeConfig.bot.token;

const { projectId } = admin.app().options;

const REGION = 'europe-west2';
const BASE_FUNCTIONS = `https://${REGION!}-${projectId!}.cloudfunctions.net`;

export { BOT_TOKEN, REGION, BASE_FUNCTIONS, admin };
