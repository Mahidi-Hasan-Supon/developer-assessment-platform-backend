import React, { ReactNode } from "react";
import QueryProviders from "./query.provider";
import GoogleProvider from "./google-auth-provider";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <GoogleProvider>
      <QueryProviders>{children}</QueryProviders>
    </GoogleProvider>
  );
};

export default Providers;
