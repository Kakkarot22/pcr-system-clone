import React from "react"
import { Result } from "antd"
import * as Commons from "common/common"

const NotFound = props => {
  return (
    <div className="flex h-screen">
      <div className="m-auto">
        <Result
          status="404"
          title="404"
          subTitle={Commons.error404Msg}
        />
      </div>
    </div>
  )
}

export default NotFound
