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
import { DropZone, Thumbnail } from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import useGraphql from "../hooks/useGraphql";
import { useState, useCallback, useEffect } from "react";
import { useAuthenticatedFetch } from "../hooks";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [btnLabel, setBtnLabel] = useState("");
  const [btnLink, setBtnLink] = useState("");
  const [loadingPublishButton, setLoadingPublishButton] = useState(false);
  const [bgColor, setBgColor] = useState("");
  const [btnColor, setBtnColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [btnDisable, setBtnDisable] = useState(true);
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const [loadingSaveButton, setLoadingSaveButton] = useState(false);
  const [flag, setFlag] = useState(false);
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
            setImg(
              "https://media.wired.com/photos/598e35fb99d76447c4eb1f28/16:9/w_2123,h_1194,c_limit/phonepicutres-TA.jpg"
            );
          } else {
            setTitle(data.title);
            setDescription(data.description);
            setBtnLabel(data.btnLabel);
            setImg(data.image);
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
    status === "publish"
      ? setLoadingPublishButton(true)
      : setLoadingSaveButton(true);
    const data = {
      title: title,
      description: description,
      btnLabel: btnLabel,
      bgColor: bgColor,
      btnColor: btnColor,
      textColor: textColor,
      btnLink: btnLink,
      status: status,
      image: img,
    };
    const response = await fetch("/api/popup", {
      method,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    setActive(true);
    status === "publish"
      ? setLoadingPublishButton(false)
      : setLoadingSaveButton(false);
    setBtnDisable(btnDisable === true ? false : true);
    return response;
  };

  const [file, setFile] = useState();
  const [img, setImg] = useState();
  const gql = useGraphql();
  const handleDropZoneDrop = useCallback(
    (dropFiles, acceptedFiles, rejectedFiles) => {
      setFile(acceptedFiles[0]);
    },
    []
  );

  const generateStagedUploadService = async ({
    name,
    type,
    size,
    resource,
  }) => {
    const query = `
        mutation generateStagedUploads($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
          }
        }
      `;

    const result = await gql(query, {
      input: {
        filename: name,
        mimeType: type,
        resource: "IMAGE",
        httpMethod: "POST",
        fileSize: size.toString(),
      },
    });

    return result?.data?.stagedUploadsCreate?.stagedTargets?.[0];
  };

  const createFileService = async ({ alt, resourceUrl, contentType }) => {
    const query = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on MediaImage {
              alt
              createdAt
              id
              preview {
                image {
                  originalSrc
                }
              }
              status
            }
            ... on Video {
              alt
              createdAt
              filename
              id
              duration
              status
              preview {
                image {
                  url
                }
              }
              originalSource {
                url
              }
            }
            ... on GenericFile {
              id
              alt
              createdAt
              fileStatus
              mimeType
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const result = await gql(query, {
      files: {
        alt,
        originalSource: resourceUrl,
        contentType: "IMAGE",
      },
    });
    return result?.data?.fileCreate?.files?.[0];
  };

  const getFileByIdService = async (fileId, type) => {
    const query = `
      query getImageById($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            alt
            createdAt
            status
            image {
              originalSrc
              width
              height
            }
            id
          }
          ... on Video {
            alt
            createdAt
            filename
            id
            status
            duration
            preview {
              image {
                url
              }
            }
            originalSource {
              url
            }
          }
          ... on GenericFile {
            alt
            createdAt
            fileStatus
            id
            url
          }
        }
      }
    `;

    const result = await gql(query, { id: fileId });
    return result;
  };

  const uploadImgHandle = async (file) => {
    const { name, size, type } = file;
    let mediaType = "image";
    const result = await generateStagedUploadService({
      name,
      type,
      size,
      resource: mediaType,
    });
    const { url, parameters, resourceUrl } = result;

    const formData = new FormData();
    parameters.forEach(({ name, value: valueInp }) => {
      formData.append(name, valueInp);
    });

    formData.append("file", file);

    const method = "POST";
    const response = await fetch(url, {
      method,
      body: formData,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
    const fileCreated = await createFileService({
      alt: file.alt,
      resourceUrl,
      contentType: mediaType,
    });

    const res = await getFileByIdService(fileCreated.id, "IMAGE");
    const imgUrl = res.data.node.image.originalSrc;
    setImg(imgUrl);
    setFlag(true);
  };

  useEffect(() => {
    if (file) uploadImgHandle(file);
  }, [file]);

  const fileUpload = <DropZone.FileUpload />;
  const uploadedFile = file && img && flag && (
    <div>
      <img
        style={{
          width: "204px",
          height: "170px",
          verticalAlign: "middle",
          borderRadius: "5px",
        }}
        src={img}
      />
    </div>
  );

  useEffect(() => {
    setBtnDisable(true);
  }, [
    title,
    description,
    btnLabel,
    btnLink,
    btnColor,
    textColor,
    bgColor,
    img,
  ]);

  return (
    <Page
      title="Popup setting"
      subtitle="Create coupon or newsletter popup to interact with your customer."
      fullWidth
    >
      <Layout>
        <Layout.Section secondary>
          <h2
            style={{
              margin: "20px 0px 20px 0px",
              fontSize: "16px",
              fontWeight: "bold",
              lineHeight: "24px",
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
          <p style={{ marginTop: "20px" }}>Background Color: </p>
          <div style={{ display: "flex" }}>
            <input type="text" value={bgColor} />
            <input
              type="color"
              id="style1"
              name="favcolor"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                console.log(e.target.value);
              }}
            />
          </div>

          <p style={{ marginTop: "10px" }}>Button Color: </p>
          <div style={{ display: "flex" }}>
            <input type="text" value={btnColor} />
            <input
              type="color"
              id="style1"
              name="favcolor"
              value={btnColor}
              onChange={(e) => {
                setBtnColor(e.target.value);
              }}
            />
          </div>
          <p style={{ marginTop: "10px" }}>Text Color: </p>
          <div style={{ display: "flex" }}>
            <input type="text" value={textColor} />

            <input
              type="color"
              id="style1"
              name="favcolor"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
              }}
            />
          </div>
          <p style={{ marginTop: "20px" }}>Image: </p>
          <div style={{ display: "flex", marginTop: "10px" }}>
            {uploadedFile}
            <div
              style={{ width: "114px", height: "114px", marginLeft: "20px" }}
            >
              <DropZone
                allowMultiple={false}
                onDrop={handleDropZoneDrop}
                accept="image/*"
                type="image"
                overlayText="Add Image"
              >
                {fileUpload}
              </DropZone>
            </div>
          </div>
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
                <img src={img} width={450} height={300} />
                {/* <button className="btn-close">⨉</button> */}
              </div>
              <div className="text-container">
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
          <br />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ marginRight: 10 }}>
              <Button
                loading={loadingPublishButton}
                primary
                disabled={btnDisable}
                onClick={() => callApiHandle("publish")}
              >
                Publish
              </Button>
            </div>
            <div>
              <Button
                loading={loadingSaveButton}
                primary
                onClick={() => callApiHandle("save")}
                disabled={!btnDisable}
              >
                Save
              </Button>
            </div>
          </div>
        </Layout.Section>
      </Layout>
      <Frame>{toastMarkup}</Frame>
    </Page>
  );
}
