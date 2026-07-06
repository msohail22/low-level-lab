// react 
import React from "react";

// dev tools
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


export default function App() {
  return (
    <>
      {
        import.meta.env.DEV && ( 
          <React.Fragment>
            <DevTools />
            <ReactQueryDevtools initialIsOpen={false} />
          </React.Fragment>
        ) 
      }
      <h1> Hello, Auntry </h1>
    </>
  );
}
