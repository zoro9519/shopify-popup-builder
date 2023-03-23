// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { connectDB } from "./config/db.js";
import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { PopupInfo } from "./models/popupModel.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const refreshMetafield = async (req, res, next) => {
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

const createOrUpdatePopupInfo = async (_req, res) => {
  let status = 200;
  let error = null;
  try {
    const session = res.locals.shopify.session;
    const shopDomain = session.shop;

    if (_req.body.status === "publish") {
      const popup_info_obj = {
        title: _req.body.title,
        description: _req.body.description,
        btnLabel: _req.body.btnLabel,

        bgColor: _req.body.bgColor,
        btnColor: _req.body.btnColor,
        textColor: _req.body.textColor,
        btnLink: _req.body.btnLink,
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
        status: _req.body.status,
      });
    }
  } catch (e) {
    console.log(e, "error!");
  }
  res.status(status).send({ success: status === 200, error });
};

const getPopupInfo = async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shopDomain = session.shop;
    const popupInfo = await PopupInfo.findOne({
      shopDomain: shopDomain,
      status: "save",
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

connectDB();

const app = express();
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  refreshMetafield,
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/popup", getPopupInfo);

app.post("/api/popup", createOrUpdatePopupInfo);

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
