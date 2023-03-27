import { DropZone, Thumbnail } from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useState, useCallback, useEffect } from "react";
import { useAuthenticatedFetch } from "../hooks";
import useGraphql from "../hooks/useGraphql";


export function DropZoneExample() {
  const [file, setFile] = useState();
  const fetch = useAuthenticatedFetch();
  const gql = useGraphql()
  const handleDropZoneDrop = useCallback(
    (dropFiles, acceptedFiles, rejectedFiles) => {
      setFile(acceptedFiles[0]);
    },
    []
  );

  const generateStagedUploadService = async ({ name, type, size, resource }) => {
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
      input:
      {
        filename: name,
        mimeType: type,
        resource: 'IMAGE',
        httpMethod: "POST",
        fileSize: size.toString(),
      }

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
        contentType: 'IMAGE',
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
    return result
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
    console.log({ url }, { parameters }, { resourceUrl })


    const formData = new FormData();
    parameters.forEach(({ name, value: valueInp }) => {
      formData.append(name, valueInp);
    });

    formData.append('file', file);


    const method = 'POST'
    const response = await fetch(url, {
      method,
      body: formData,
      headers: { "Access-Control-Allow-Origin": "*", 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' },
    });
    console.log(response)
    const fileCreated = await createFileService({ alt: file.alt, resourceUrl, contentType: mediaType });

    const res = await getFileByIdService(fileCreated.id, 'IMAGE');
    console.log(res)

  };

  useEffect(() => {
    if (file) uploadImgHandle(file);
  }, [file]);

  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];
  const fileUpload = !file && <DropZone.FileUpload />;
  const uploadedFile = file && (
    <div>
      <Thumbnail
        size="small"
        alt={file.name}
        source={
          validImageTypes.includes(file.type)
            ? window.URL.createObjectURL(file)
            : NoteMinor
        }
      />
      <div>
        {file.name} <p>{file.size} bytes</p>
      </div>
    </div>
  );

  return (
    <DropZone allowMultiple={false} onDrop={handleDropZoneDrop}>
      {uploadedFile}
      {fileUpload}
    </DropZone>
  );
}
