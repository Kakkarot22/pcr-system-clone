import React, { useState, useEffect, useCallback } from "react"
import { withRouter, useLocation } from "react-router-dom"
import {
  Button,
  Form,
  Input,
  message,
  Row,
  Col,
  Divider,
  Steps,
  Modal,
} from "antd"
import {
  MailOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons"
import styled from "styled-components"
import queryString from "query-string"
import * as Commons from "common/common"

const { Step } = Steps

const CustomSteps = styled(Steps)`
  .ant-steps-item-wait
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-title {
    color: rgba(0, 0, 0, 0.2);
  }
  .ant-steps-item-wait
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-description {
    color: rgba(0, 0, 0, 0.2);
  }
  .ant-steps-item-process
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-title {
    color: #21acd7;
    font-weight: bold;
  }
  .ant-steps-item-process
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-description {
    color: #21acd7;
    font-weight: bold;
  }
  .ant-steps-item-finish
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-title {
    color: rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }
  .ant-steps-item-finish
    > .ant-steps-item-container
    > .ant-steps-item-content
    > .ant-steps-item-description {
    color: rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }
`

const CustomStep = styled(Step)`
  &::after {
    display: none !important;
  }
  .ant-steps-item-icon {
    display: none !important;
  }
`

const Forgot = (props) => {
  const { history } = props
  const location = useLocation()
  const parsedLocation = queryString.parse(location.search)

  const [forgotEmailForm] = Form.useForm()
  const [forgotPasswordForm] = Form.useForm()
  const isMountedRef = Commons.useIsMountedRef()

  const [currentStep, setCurrentStep] = useState(0)
  const [forgotInfo, setForgotInfo] = useState(undefined)
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    if (parsedLocation.to !== undefined) {
      setIsLoading(true)

      const postData = {
        token: parsedLocation.to,
      }

      Commons.axiosInstance
        .post(Commons.apiClientToken, postData)
        .then((response) => {
          if (isMountedRef.current) {
            setForgotInfo(response?.data || undefined)

            if (response?.data) {
              setCurrentStep(2)
            }
          }
        })
        .catch((error) => {
          if (error.response.status === 406) {
            message.warning(Commons.warnTokenUsed)
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          } else {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsLoading(false)
          }
        })
    }
    // eslint-disable-next-line
  }, [])

  const forgotEmailHandler = (data) => {
    if (isMountedRef.current) {
      setIsLoading(true)

      const postData = {
        email: data.forgotEmail,
      }

      Commons.axiosInstance
        .post(Commons.apiClientResetEmail, postData)
        .then((response) => {
          if (isMountedRef.current) {
            Modal.info({
              title: Commons.successSentMsg,
              icon: <CheckCircleTwoTone twoToneColor="#a0d911" />,
              className: "whitespace-pre-wrap",
              content: `メールアドレスの確認をお願いします。\nメールが届かない場合や紛失した場合は、再度送信を行って下さい。\n\n※メールの受取環境により迷惑メールフォルダに移動されてる場合がありますので、迷惑メールフォルダ内の確認もお願いします。`,
              okText: "確認",
              okType: "primary",
              okButtonProps: {
                size: "large",
                shape: "round",
                className: "px-8",
              },
              centered: true,
            })

            setCurrentStep(1)
          }
        })
        .catch((error) => {
          if (error.response.status === 409) {
            message.warning(Commons.warnEmailNotExist)
          } else if (error.response.status === 429) {
            Modal.info({
              title: "注意",
              className: "whitespace-pre-wrap",
              content: Commons.warnTooManyRequest,
              okText: "確認",
              okType: "primary",
              okButtonProps: {
                size: "large",
                shape: "round",
                className: "px-8",
              },
              centered: true,
            })
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          } else {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsLoading(false)
          }
        })
    }
  }

  const resendMailHandler = () => {
    Modal.confirm({
      title: "確認",
      icon: <ExclamationCircleTwoTone twoToneColor="#21acd7" />,
      className: "whitespace-pre-wrap",
      content: `メールを再送信してもよろしいですか？\n再度送信すると、以前のメールのリンクが使用できなくなります`,
      okText: "メールを再送信する",
      okType: "primary",
      okButtonProps: {
        size: "large",
        shape: "round",
      },
      cancelText: "戻る",
      cancelButtonProps: {
        size: "large",
        shape: "round",
      },
      centered: true,
      onOk() {
        if (isMountedRef.current) {
          setIsLoading(true)

          const postData = {
            email: forgotEmailForm.getFieldValue("forgotEmail"),
          }

          Commons.axiosInstance
            .post(Commons.apiClientResetEmail, postData)
            .then((response) => {
              message.success(Commons.successSentMsg)
            })
            .catch((error) => {
              if (error.response.status === 429) {
                Modal.info({
                  title: "注意",
                  className: "whitespace-pre-wrap",
                  content: Commons.warnTooManyRequest,
                  okText: "確認",
                  okType: "primary",
                  okButtonProps: {
                    size: "large",
                    shape: "round",
                    className: "px-8",
                  },
                  centered: true,
                })
              } else if (error.response.status === 500) {
                message.error(Commons.errorSystemMsg)
              } else {
                message.error(Commons.errorSystemMsg)
              }
            })
            .finally(() => {
              if (isMountedRef.current) {
                setIsLoading(false)
              }
            })
        }
      },
    })
  }

  const resetPasswordHandler = (data) => {
    if (isMountedRef.current) {
      setIsLoading(true)

      const postData = {
        password: data.forgotPassword,
        token: forgotInfo.token,
      }

      Commons.axiosInstance
        .post(Commons.apiClientResetPassword, postData)
        .then((response) => {
          if (isMountedRef.current) {
            message.success("変更しました。")
            setCurrentStep(3)
          }
        })
        .catch((error) => {
          if (error.response.status === 406) {
            message.warning(Commons.warnTokenUsed)
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          } else {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsLoading(false)
          }
        })
    }
  }

  return (
    <>
      <div className="flex h-screen">
        <div className="w-full sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/3 p-5 mx-auto bg-white animate__animated animate__fadeIn">
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
          <Divider>
            <p className="text-center text-lg font-bold">パスワード再設定</p>
          </Divider>
          <Row gutter={[0, 0]} justify="center" className="mb-8">
            <Col span={24} className="mb-8">
              <CustomSteps
                type="navigation"
                size="small"
                direction="horizontal"
                responsive={false}
                style={{
                  boxShadow: "0px -1px 0 0 #e8e8e8 inset",
                }}
                current={currentStep}
              >
                <CustomStep
                  title={<span className="text-xs">Step 1</span>}
                  description={<span className="text-sm">メール登録</span>}
                />
                <CustomStep
                  title={<span className="text-xs">Step 2</span>}
                  description={<span className="text-sm">確認</span>}
                />
                <CustomStep
                  title={<span className="text-xs">Step 3</span>}
                  description={<span className="text-sm">再設定</span>}
                />
                <CustomStep
                  title={<span className="text-xs">Step 4</span>}
                  description={<span className="text-sm">完了</span>}
                />
              </CustomSteps>
            </Col>
            <Col span={24}>
              {currentStep === 0 ? (
                <Form
                  form={forgotEmailForm}
                  name="forgotEmailForm"
                  onFinish={forgotEmailHandler}
                  size="large"
                  layout="vertical"
                >
                  <Form.Item
                    name="forgotEmail"
                    label="メールアドレス"
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "メールアドレスを入力してください",
                      },
                      {
                        type: "email",
                        message: "有効なメールアドレスを入力してください",
                      },
                    ]}
                  >
                    <Input
                      disabled={isLoading}
                      autoCapitalize="none"
                      prefix={<MailOutlined />}
                      placeholder="例：aaa@bbb.jp"
                      type="email"
                    />
                  </Form.Item>
                  <Divider />
                  <Row justify="center" gutter={[8, 0]}>
                    <Col>
                      <Button
                        shape="round"
                        className="px-8"
                        onClick={() => {
                          history.push(Commons.clientLoginRoute)
                        }}
                      >
                        戻る
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="px-12"
                        shape="round"
                        loading={isLoading}
                      >
                        確認する
                      </Button>
                    </Col>
                  </Row>
                </Form>
              ) : (
                ""
              )}
              {currentStep === 1 ? (
                <>
                  <Row className="mb-2" justify="center">
                    <Col className="text-base text-center">
                      メールアドレスの確認をお願いします。
                    </Col>
                  </Row>
                  <Row className="mb-4" justify="center">
                    <Col className="text-sm text-center whitespace-pre-wrap">
                      {`パスワード再設定に必要なメールを送信しました。\nメール本文内に記載されてるリンクをクリックし、\nパスワードの再設定に進んで下さい。\nメールが届かない場合や紛失した場合は、\n再度送信を行って下さい。\n\n※メールの受取環境により迷惑メールフォルダに\n移動されてる場合がありますので、\n迷惑メールフォルダ内の確認もお願いします。`}
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col className="text-sm">メールアドレス</Col>
                  </Row>
                  <Row className="mb-4" justify="center">
                    <Col className="text-base">
                      {forgotEmailForm.getFieldValue("forgotEmail")}
                    </Col>
                  </Row>
                  <Divider />
                  <Row justify="center" gutter={[8, 8]}>
                    <Col>
                      <Button
                        shape="round"
                        size="large"
                        className="px-8"
                        onClick={() => {
                          history.push(Commons.clientLoginRoute)
                        }}
                      >
                        戻る
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        size="large"
                        shape="round"
                        onClick={resendMailHandler}
                        loading={isLoading}
                      >
                        メールを再送信する
                      </Button>
                    </Col>
                  </Row>
                </>
              ) : (
                ""
              )}
              {currentStep === 2 ? (
                <Form
                  form={forgotPasswordForm}
                  name="forgotPasswordForm"
                  onFinish={resetPasswordHandler}
                  size="large"
                  layout="vertical"
                  scrollToFirstError
                >
                  <Row gutter={[8, 0]}>
                    <Col span={24}>
                      <Form.Item
                        label="パスワード"
                        name="forgotPassword"
                        hasFeedback
                        rules={[
                          {
                            required: true,
                            message: "パスワードを入力してください",
                          },
                          {
                            min: 8,
                            message:
                              "パスワードは8文字以上にする必要があります",
                          },
                          {
                            max: 32,
                            message:
                              "パスワードは32文字未満である必要があります",
                          },
                          {
                            whitespace: true,
                            message: "有効なパスワードを入力してください",
                          },
                        ]}
                      >
                        <Input.Password
                          placeholder="例：abcd1234"
                          onPressEnter={(e) => e.preventDefault()}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="パスワード（確認）"
                        name="forgotConfirmPassword"
                        hasFeedback
                        dependencies={["forgotPassword"]}
                        rules={[
                          {
                            required: true,
                            message: "パスワードを入力してください",
                          },
                          {
                            min: 8,
                            message:
                              "パスワードは8文字以上にする必要があります",
                          },
                          {
                            max: 32,
                            message:
                              "パスワードは32文字未満である必要があります",
                          },
                          {
                            whitespace: true,
                            message: "有効なパスワードを入力してください",
                          },
                          ({ getFieldValue }) => ({
                            validator(rule, value) {
                              if (
                                !value ||
                                getFieldValue("forgotPassword") === value
                              ) {
                                return Promise.resolve()
                              }
                              return Promise.reject("パスワードが一致しません")
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          placeholder="例：abcd1234"
                          onPressEnter={(e) => e.preventDefault()}
                        />
                      </Form.Item>
                    </Col>
                    <Divider />
                    <Col span={24} className="text-center">
                      <Button
                        className="px-8 m-1"
                        shape="round"
                        onClick={() => {
                          history.push(Commons.clientLoginRoute)
                        }}
                      >
                        戻る
                      </Button>
                      <Button
                        type="primary"
                        className="px-12 m-1"
                        htmlType="submit"
                        shape="round"
                        loading={isLoading}
                      >
                        再設定する
                      </Button>
                    </Col>
                  </Row>
                </Form>
              ) : (
                ""
              )}
              {currentStep === 3 ? (
                <>
                  <Row justify="center mb-8">
                    <Col className="text-center text-base">
                      パスワードの再設定が完了しました
                    </Col>
                  </Row>
                  <Divider />
                  <Row justify="center">
                    <Button
                      type="primary"
                      shape="round"
                      size="large"
                      className="px-8"
                      onClick={() => {
                        history.push(Commons.clientLoginRoute)
                      }}
                    >
                      ログインへ戻る
                    </Button>
                  </Row>
                </>
              ) : (
                ""
              )}
            </Col>
          </Row>
        </div>
      </div>
    </>
  )
}

export default withRouter(Forgot)
