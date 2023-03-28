import shopify from "../shopify.js";
import { PopupInfo } from "../models/popupModel.js";

export const createOrUpdatePopupInfo = async (_req, res) => {
  let status = 200;
  let error = null;
  try {
    const session = res.locals.shopify.session;
    const shopDomain = session.shop;

    if (_req.body.status === process.env.POPUP_STATUS_PUBLISH) {
      const popup_info_obj = {
        title: _req.body.title,
        description: _req.body.description,
        btnLabel: _req.body.btnLabel,

        bgColor: _req.body.bgColor,
        btnColor: _req.body.btnColor,
        textColor: _req.body.textColor,
        btnLink: _req.body.btnLink,
        image: _req.body.image,
      };

      const metafield = new shopify.api.rest.Metafield({ session });
      metafield.namespace = "popup_test";
      metafield.type = "json";
      metafield.key = "info";
      metafield.owner_resource = "shop";
      metafield.value = JSON.stringify(popup_info_obj);
      await metafield.save({
        update: true,
      });
    }

    const popupInfo = await PopupInfo.findOne({
      shopDomain: shopDomain,
      status: _req.body.status,
    });

    if (popupInfo) {
      popupInfo.shopDomain = shopDomain;
      popupInfo.title = _req.body.title;
      popupInfo.description = _req.body.description;
      popupInfo.btnLabel = _req.body.btnLabel;

      popupInfo.bgColor = _req.body.bgColor;
      popupInfo.btnColor = _req.body.btnColor;
      popupInfo.textColor = _req.body.textColor;
      popupInfo.btnLink = _req.body.btnLink;
      popupInfo.status = _req.body.status;
      popupInfo.image = _req.body.image;
      await popupInfo.save();
    } else {
      await PopupInfo.create({
        shopDomain: shopDomain,
        title: _req.body.title,
        description: _req.body.description,
        btnLabel: _req.body.btnLabel,
        bgColor: _req.body.bgColor,
        btnColor: _req.body.btnColor,
        textColor: _req.body.textColor,
        btnLink: _req.body.btnLink,
        image: _req.body.image,
        status: _req.body.status,
      });
    }
  } catch (e) {
    console.log(e, "error!");
  }
  res.status(status).send({ success: status === 200, error });
};

export const getPopupInfo = async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shopDomain = session.shop;
    const popupInfo = await PopupInfo.findOne({
      shopDomain: shopDomain,
      status: process.env.POPUP_STATUS_SAVE,
    });
    if (popupInfo === null) {
      res.send(false);
    } else {
      res.send(popupInfo);
    }
  } catch (error) {
    console.log(error);
  }
};

