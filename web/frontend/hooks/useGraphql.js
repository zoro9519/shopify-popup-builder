import { getSessionToken } from "@shopify/app-bridge-utils";
import { useAppBridge } from "@shopify/app-bridge-react";

import graphql from "../service/graphql";

const useGraphql = () => {
  const app = useAppBridge();
  return async (query, variables, controller) => {
    const session = await getSessionToken(app);
    const response = await graphql(query, variables, controller, session);
    return response;
  };
};

export default useGraphql;
