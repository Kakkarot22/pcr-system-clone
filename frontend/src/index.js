import React from "react"
import ReactDOM from "react-dom"
import { ConfigProvider } from "antd"
import jaJP from "antd/es/locale/ja_JP"
import { ClearCacheProvider } from "react-clear-cache"

import * as serviceWorker from "./serviceWorker"
import App from "./App"

ReactDOM.render(
  // <React.StrictMode>
  <ClearCacheProvider duration={10000}>
    <ConfigProvider locale={jaJP}>
      <App />
    </ConfigProvider>
  </ClearCacheProvider>,
  // </React.StrictMode>,
  document.getElementById("root")
)

serviceWorker.unregister()