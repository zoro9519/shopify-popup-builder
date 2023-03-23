import express from "express";
import {
  createOrUpdatePopupInfo,
  getPopupInfo,
} from "../controllers/popupController.js";

export function applyPopupEndpoints(app) {
  app.use(express.json());
  app.post("/api/popup", createOrUpdatePopupInfo);
  app.get("/api/popup", getPopupInfo);
}
