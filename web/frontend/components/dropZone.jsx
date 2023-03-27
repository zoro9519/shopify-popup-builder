import { DropZone, Thumbnail } from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useState, useCallback, useEffect } from "react";
import { useAuthenticatedFetch } from "../hooks";
import graphql from "../service/graphql";
import { useAppQuery } from "../hooks";
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
  
    const result = gql(query, {
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

  const uploadImgHandle = async (file) => {
    const { name, size, type } = file;
    let mediaType = "image";
    const result = await generateStagedUploadService({
      name,
      type,
      size,
      resource: mediaType,
    });
    // const { url, parameters, resourceUrl } = result;
    console.log({ result });
  };

  useEffect(() => {
    if (file) uploadImgHandle(file);
    console.log({ file });
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
