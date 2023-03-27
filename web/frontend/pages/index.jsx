import { disable } from "@shopify/app-bridge/actions/LeaveConfirmation";
import {
  Card,
  Page,
  Layout,
  Image,
  Badge,
  ButtonGroup,
  FullscreenBar,
  TextField,
  Button,
  Toast,
  Frame,
} from "@shopify/polaris";

import { useState, useCallback, useEffect } from "react";
import { useAuthenticatedFetch } from "../hooks";
import { DropZoneExample } from "../components/dropZone";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [btnLabel, setBtnLabel] = useState("");
  const [btnLink, setBtnLink] = useState("");

  const [bgColor, setBgColor] = useState("");
  const [btnColor, setBtnColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [publishDisable, setPublishDisable] = useState(true);
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const [loadingButton, setLoadingButton] = useState(false);
  const fetch = useAuthenticatedFetch();
  const method = "POST";

  const toastMarkup = active ? (
    <Toast content="Success" onDismiss={toggleActive} />
  ) : null;

  useEffect(async () => {
    try {
      const getMethod = "GET";
      fetch("/api/popup", {
        getMethod,
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data) {
            setTitle("Special gift for our subscribers");
            setDescription("Enter your email to get 50% off for all products");
            setBtnLabel("Get My 20% Off");
            setBgColor("#ffffff");
            setBtnColor("#000000");
            setTextColor("#000000");
          } else {
            setTitle(data.title);
            setDescription(data.description);
            setBtnLabel(data.btnLabel);

            setBgColor(data.bgColor);
            setBtnColor(data.btnColor);
            setTextColor(data.textColor);
            setBtnLink(data.btnLink);
          }
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const callApiHandle = async (status) => {
    const data = {
      title: title,
      description: description,
      btnLabel: btnLabel,
      bgColor: bgColor,
      btnColor: btnColor,
      textColor: textColor,
      btnLink: btnLink,
      status: status,
    };
    console.log(data);
    const response = await fetch("/api/popup", {
      method,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    setActive(true);
    setPublishDisable(false);
    return response;
  };
  return (
    <Page fullWidth>
      <FullscreenBar>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: "1rem",
            paddingRight: "1rem",
          }}
        >
          <div style={{ marginLeft: "1rem", flexGrow: 1 }}>Popup Setting</div>
          <ButtonGroup>
            <Button
              onClick={() => callApiHandle("publish")}
              disabled={publishDisable}
            >
              Publish
            </Button>

            <Button
              primary
              onClick={() => callApiHandle("save")}
              loading={loadingButton}
            >
              Save
            </Button>
          </ButtonGroup>
        </div>
      </FullscreenBar>

      <Layout>
        <Layout.Section secondary>
          <h2
            style={{
              margin: "20px 0px 20px 0px",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            Content setting
          </h2>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e)}
            autoComplete="off"
          />
          <br />
          <TextField
            multiline={4}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e)}
            autoComplete="off"
          />
          <br />
          <TextField
            label="Button label"
            value={btnLabel}
            onChange={(e) => setBtnLabel(e)}
            autoComplete="off"
          />
          <br />
          <TextField
            label="Button link"
            value={btnLink}
            placeholder="Example: https://example.com.vn"
            onChange={(e) => setBtnLink(e)}
            autoComplete="off"
          />
          <br />
          <p>Background Color: </p>

          <input
            type="color"
            id="favcolor"
            name="favcolor"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              console.log(e.target.value);
            }}
          />

          <p>Button Color: </p>
          <input
            type="color"
            id="favcolor"
            name="favcolor"
            value={btnColor}
            onChange={(e) => {
              setBtnColor(e.target.value);
            }}
          />

          <p>Text Color: </p>
          <input
            type="color"
            id="favcolor"
            name="favcolor"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
            }}
          />
          <p>Image: </p>
          <DropZoneExample />
        </Layout.Section>

        <Layout.Section secondary>
          <h2
            style={{
              marginTop: "20px",
              marginBottom: "20px",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            Preview
          </h2>
          <div className="page-frame-preview">
            <section
              className="modal"
              style={{
                position: "relative",
                marginLeft: 50,
                backgroundColor: bgColor,
              }}
            >
              <div className="flex">
                <img
                  src="https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg"
                  width={450}
                  height={300}
                />
                {/* <button className="btn-close">⨉</button> */}
              </div>
              <div>
                <h1 style={{ color: textColor }}>{title}</h1>
                <p style={{ color: textColor }}>{description}</p>
              </div>
              <button
                className="btn"
                style={{
                  backgroundColor: btnColor,
                }}
              >
                {btnLabel}
              </button>
            </section>
          </div>
        </Layout.Section>
      </Layout>
      <Frame>{toastMarkup}</Frame>
    </Page>
  );
}
