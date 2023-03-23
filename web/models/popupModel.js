import mongoose from "mongoose";

const popupSchema = mongoose.Schema({
  shopDomain: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  btnLabel: { type: String, required: true },
  bgColor: { type: String, required: true },
  textColor: { type: String, required: true },
  btnColor: { type: String, required: true },
  btnLink: { type: String, default: '' },
  status: { type: String, required: true }, //Status show that popup is save or publish
});

export const PopupInfo = mongoose.model("popup_info", popupSchema);
