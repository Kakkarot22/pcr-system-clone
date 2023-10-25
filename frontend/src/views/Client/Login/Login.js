import React, { useState, useEffect, useCallback } from "react"
import { withRouter } from "react-router-dom"
import {
  Button,
  Form,
  Input,
  message,
  Row,
  Col,
  Divider,
  Modal,
} from "antd"
import { MailOutlined, LockOutlined } from "@ant-design/icons"
import * as Commons from "common/common"

const Login = (props) => {
  const { history } = props
  const [form] = Form.useForm()
  const isMountedRef = Commons.useIsMountedRef()

  const [isLoginLoading, setIsLoginLoading] = useState(false)

  const checkSession = useCallback(() => {
    Commons.axiosInstance
      .get(Commons.apiCheckSession)
      .then((response) => {
        history.push(Commons.GET_REDIRECT_HOME_ROUTE(response?.data?.role))
      })
      .catch((error) => {
        if (error.response.status === 403) {
          return
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
  }, [history])

  useEffect(checkSession, [checkSession])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const onFinish = (data) => {
    setIsLoginLoading(true)

    const postData = {
      username: data["loginUsername"],
      password: data["loginPassword"],
    }

    Commons.axiosInstance
      .post(Commons.apiClientLogin, postData)
      .then((response) => {
        message.success(Commons.successLoginMsg)
        history.push({
          pathname: Commons.GET_REDIRECT_HOME_ROUTE(response?.data?.role),
          state: { login: true },
        })
      })
      .catch((error) => {
        if (error.response.status === 429) {
          Modal.info({
            title: "注意",
            className: "whitespace-pre-wrap",
            content: Commons.warnTooManyLoginRequest,
            okText: "確認",
            okType: "primary",
            okButtonProps: {
              size: "large",
              shape: "round",
              className: "px-8",
            },
            centered: true,
          })
        } else if (error.response.status === 401) {
          message.warning(Commons.errorLoginMismatchMsg)
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        } else {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoginLoading(false)
        }
      })
  }

  const registerHandler = () => {
    history.push(Commons.clientRegisterRoute)
  }

  const forgotHandler = () => {
    history.push(Commons.clientForgotRoute)
  }

  return (
    <>
      <div className="flex h-screen">
        <div className="w-11/12 sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/4 p-5 m-auto z-10 bg-white bg-opacity-75 animate__animated animate__fadeIn">
          <div className="flex mb-4">
            <img
              src="/logo.png"
              alt=""
              className="mx-auto"
              style={{ maxHeight: "80px" }}
            />
          </div>
          <div className="text-center mb-10">
            <p
              style={{ fontSize: 20 }}
              className="whitespace-pre-wrap"
            >{process.env.REACT_APP_SYSTEM_NAME}</p>
          </div>
          <Form name="loginForm" onFinish={onFinish} size="large" form={form}>
            <Form.Item
              name="loginUsername"
              rules={[
                {
                  required: true,
                  message: "メールアドレスを入力してください",
                },
              ]}
            >
              <Input
                name="loginUsername"
                autoCapitalize="none"
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="メールアドレス"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="loginPassword"
              rules={[
                {
                  required: true,
                  message: "パスワードを入力してください",
                },
              ]}
            >
              <Input.Password
                name="loginPassword"
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="パスワード"
              />
            </Form.Item>
            <Form.Item className="text-center">
              <Button
                type="primary"
                shape="round"
                block
                htmlType="submit"
                loading={isLoginLoading}
              >
                ログイン
              </Button>
            </Form.Item>
          </Form>
          <Row justify="center" className="py-2">
            <Col>
              <Button type="text" onClick={forgotHandler}>
                <span
                  style={{
                    textDecoration: "underline",
                  }}
                >
                  パスワードを忘れた場合
                </span>
              </Button>
            </Col>
          </Row>
          <Divider plain>アカウントお持ちでない方</Divider>
          <Row justify="center">
            <Col>
              <Button
                className="px-12"
                shape="round"
                size="large"
                onClick={registerHandler}
              >
                新規登録
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    </>
  )
}

export default withRouter(Login)
