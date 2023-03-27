import { GraphQLClient } from "graphql-request";
import { getSessionToken } from "@shopify/app-bridge-utils";
const handleApiResponse = ({ result, type = "restful" }) => {
  if (type == "restful") {
    if (result.status === 200) {
      if (result?.data?.data) {
        return Promise.resolve({
          code: result.status,
          message: "SUCCESS",
          data: result?.data?.data ?? result?.data,
        });
      }
      return Promise.resolve(result?.data);
    }
  }
  if (type === "graphql") {
    if (!result.code) result.code = 200;

    if (result.code === 200 && !result?.errors?.length) {
      return Promise.resolve({
        code: result.code,
        message: result.message,
        data: result,
      });
    }
    result.message = [result?.code ?? 500];
  }
};

const graphql = async (query, variables, controller, token) => {
  const graphQLClient = new GraphQLClient(
    "/api/graphql",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    {
      signal: controller?.signal,
    }
  );
  const result = await graphQLClient.request(query, variables);
  return handleApiResponse({
    result,
    type: "graphql",
  });
};

export default graphql;
