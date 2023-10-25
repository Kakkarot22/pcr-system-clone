import React from "react"
import { withRouter } from "react-router-dom"
import { Menu } from "antd"
import {
  // MenuOutlined,
  UserOutlined,
} from "@ant-design/icons"
import * as Commons from "common/common"
// import styled from "styled-components"

// const StyledMenuItem = styled(Menu.Item)`
//   .ant-menu-title-content {
//     margin-left: 0 !important;
//   }
// `

const Topbar = (props) => {
  const {
    isHamburger,
    // collapseToggle,
    profile,
    showProfileDrawer,
    history
  } = props

  const handleClick = (event) => {
    switch (event.key) {
      // case "menu":
      //   collapseToggle()
      //   break
      case "profile":
        showProfileDrawer()
        break
      default:
        break
    }
  }

  return (
    <>
      {isHamburger ? (
        <>
          <div className="cursor-pointer" onClick={() => {
            history.push(Commons.clientOccasionsRoute)
          }}>
            <img
              src="/logo.png"
              alt="ロゴ"
              style={{
                float: "left",
                maxWidth: "100px",
                maxHeight: "31px",
                margin: "16px 10px 16px 16px",
              }}
            />
            <span
              style={{
                float: "left",
                maxWidth: "150px",
                maxHeight: "31px",
                overflow: "hidden",
                margin: "16px 16px 16px 0px",
                lineHeight: "15px",
                whiteSpace: "pre-wrap",
                textAlign: "left",
                fontSize: "0.75rem",
              }}
            >
              {process.env.REACT_APP_SYSTEM_NAME}
            </span>
          </div>
          <Menu mode="horizontal" onClick={handleClick} selectable={false}>
            {/* <StyledMenuItem
            className="float-left"
            key="menu"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
          ></StyledMenuItem> */}
            <Menu.Item
              className="float-right"
              style={{ fontSize: 16 }}
              key="profile"
            >
              <span className="mr-2">{`${profile.lastName || ""} ${
                profile.firstName || ""
              }`}</span>
              <UserOutlined style={{ fontSize: 20 }} />
            </Menu.Item>
          </Menu>
        </>
      ) : (
        ""
      )}
    </>
  )
}

export default withRouter(Topbar)
