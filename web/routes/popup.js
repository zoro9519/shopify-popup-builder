import express from "express";
import shopify from "../shopify.js";
import {
  createOrUpdatePopupInfo,
  getPopupInfo,
} from "../controllers/popupController.js";
export function applyPopupEndpoints(app) {
  app.use(express.json());
  app.post("/api/popup", createOrUpdatePopupInfo);
  app.get("/api/popup", getPopupInfo);

  app.post("/api/graphql", async (req, res) => {
    try {
      const session = res.locals.shopify.session;

      const response = await shopify.api.clients.graphqlProxy({
        session,
        rawBody: req.body, // From my app
      });

      res.status(200).send(response.body);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
}
