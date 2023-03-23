import { PopupInfo } from "../models/popupModel.js";
import shopify from "../shopify.js";

export const refreshMetafield = async (req, res, next) => {
    const session = res.locals.shopify.session;
    const shopDomain = session.shop;
    const metafieldResponse = await shopify.api.rest.Metafield.all({
      session: session,
      namespace: "popup_test",
    });
  
    if (metafieldResponse.length > 0 && metafieldResponse[0]?.id) {
      await shopify.api.rest.Metafield.delete({
        session: session,
        id: metafieldResponse[0].id,
      });
    }
  
    const popupInfo = await PopupInfo.findOne({
      shopDomain: shopDomain,
      status: "publish",
    });
  
    if (popupInfo) {
      const popup_info_obj = {
        title: popupInfo.title,
        description: popupInfo.description,
        btnLabel: popupInfo.btnLabel,
  
        btnLink: popupInfo.btnLink,
        bgColor: popupInfo.bgColor,
        btnColor: popupInfo.btnColor,
        textColor: popupInfo.textColor,
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
    next();
  };