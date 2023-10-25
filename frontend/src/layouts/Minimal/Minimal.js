import React, { useState } from "react"
import { Layout, Spin } from "antd"

const Minimal = (props) => {
  const { children } = props
  const { Content } = Layout

  const [isPageLoading, setIsPageLoading] = useState(false)

  const showLoadingPageSpin = () => {
    setIsPageLoading(true)
  }

  const hideLoadingPageSpin = () => {
    setIsPageLoading(false)
  }

  const childrenWithProps = React.Children.map(children, (element) =>
    React.cloneElement(element, {
      showLoadingPageSpin: showLoadingPageSpin,
      hideLoadingPageSpin: hideLoadingPageSpin,
    })
  )

  return (
    <div className="w-full min-h-full">
      <Spin
        spinning={isPageLoading}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Layout className="min-h-screen">
          <Content className="bg-white">{childrenWithProps}</Content>
        </Layout>
      </Spin>
    </div>
  )
}

export default Minimal
