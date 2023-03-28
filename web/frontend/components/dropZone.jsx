import { DropZone } from "@shopify/polaris";
import { useState, useCallback, useEffect, useContext } from "react";
import { useAuthenticatedFetch } from "../hooks";
import useGraphql from "../hooks/useGraphql";
import { ImageContext } from "../pages";
import { Spinner } from '@shopify/polaris';
export function DropImage() {
  const [file, setFile] = useState();
  const fetch = useAuthenticatedFetch();
  const gql = useGraphql();
  const [flag, setFlag] = useState(false);
  const { img, dispatchImage } = useContext(ImageContext);
  const [imgLoading, setImgLoading] = useState(false);
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
    setImgLoading(true)
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
    await fetch(url, {
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
    dispatchImage(imgUrl)
    setFlag(true);
    setImgLoading(false)
  };

  const fileUpload = <DropZone.FileUpload />;
  const uploadedFile = file && flag && (
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
    if (file) uploadImgHandle(file);
  }, [file]);

  return (
    <div style={{ display: "flex", marginTop: "10px" }}>
      {!imgLoading && uploadedFile}
      {imgLoading && <Spinner accessibilityLabel="Spinner example" size="large" />}
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
  );
}
