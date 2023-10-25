import React from "react"
import { withRouter } from "react-router-dom"
import { Menu, message } from "antd"
import {
  MenuOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
} from "@ant-design/icons"
import styled from "styled-components"
import * as Commons from "common/common"

const StyledMenuItem = styled(Menu.Item)`
  .ant-menu-title-content {
    margin-left: 0 !important;
  }
`

const Topbar = (props) => {
  const { isHamburger, collapseToggle, history, location, auth } = props
  const occasionId = props?.match?.params?.id || undefined

  const logout = () => {
    Commons.axiosInstance
      .get(Commons.apiLogout)
      .then((response) => {
        if (response.status === 200) {
          message.success(Commons.successLogoutMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth))
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
  }

  const handleClick = (event) => {
    switch (event.key) {
      case "logout":
        logout()
        break
      case "menu":
        collapseToggle()
        break
      case "events":
        history.push(Commons.adminOccasionsRoute)
        break
      default:
        break
    }
  }

  return (
    <>
      {isHamburger ? (
        <Menu mode="horizontal" onClick={handleClick} selectable={false}>
          <StyledMenuItem
            className="float-left"
            key="menu"
            icon={<MenuOutlined style={{ fontSize: 18 }} />}
          ></StyledMenuItem>
          <Menu.Item
            className="float-right"
            style={{ fontSize: 12 }}
            key="logout"
            icon={<LogoutOutlined style={{ fontSize: 14 }} />}
            danger
          >
            ログアウト
          </Menu.Item>
          <Menu.Item
            className="float-right"
            style={{ fontSize: 12 }}
            key="profile"
            icon={<UserOutlined style={{ fontSize: 14 }} />}
          >
            管理者
          </Menu.Item>
          {occasionId &&
          location.pathname === `${Commons.adminOccasionsRoute}${occasionId}` ? (
            <Menu.Item
              className="float-right"
              style={{ fontSize: 12 }}
              key="events"
              icon={<ArrowLeftOutlined style={{ fontSize: 14 }} />}
            >
              戻る
            </Menu.Item>
          ) : undefined}
        </Menu>
      ) : (
        <Menu mode="horizontal" onClick={handleClick} selectable={false}>
          {occasionId &&
          location.pathname === `${Commons.adminOccasionsRoute}${occasionId}` ? (
            <Menu.Item
              className="float-left"
              key="events"
              icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
            >
              戻る
            </Menu.Item>
          ) : undefined}
          <Menu.Item
            className="float-right"
            key="logout"
            icon={<LogoutOutlined style={{ fontSize: 18 }} />}
            danger
          >
            ログアウト
          </Menu.Item>
          <Menu.Item
            className="float-right"
            key="profile"
            icon={<UserOutlined style={{ fontSize: 18 }} />}
          >
            管理者
          </Menu.Item>
        </Menu>
      )}
    </>
  )
}

export default withRouter(Topbar)
