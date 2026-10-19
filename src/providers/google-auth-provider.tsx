"use client";

import { ReactNode } from "react";
import {GoogleOAuthProvider} from '@react-oauth/google';

const GoogleProvider = ({ children }: { children: ReactNode }) => {

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!

    if(!clientId){
       return <>{children}</>
    }

  return (

  <GoogleOAuthProvider clientId={clientId}>
    {children}
  </GoogleOAuthProvider>
  );
};

export default GoogleProvider;