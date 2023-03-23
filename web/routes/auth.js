// import express from "express";
// import shopify from "../shopify";
// import { refreshMetafield } from "../middleware/refreshMetafield.middleware";
// import GDPRWebhookHandlers from "../gdpr.js";

// const app = express();

// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   refreshMetafield,
//   shopify.redirectToShopifyOrAppRoot()
// );
// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
// );