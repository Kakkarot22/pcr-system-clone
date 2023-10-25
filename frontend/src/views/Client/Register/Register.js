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
  Radio,
  InputNumber,
  Space,
  Checkbox,
  DatePicker as AntdDatePicker,
} from "antd"
import {
  MailOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons"
import DatePicker from "react-mobile-datepicker"
import { isMobile } from "react-device-detect"
import styled from "styled-components"
import queryString from "query-string"
import * as Commons from "common/common"
import moment from "moment"
import "moment/locale/ja"

moment.locale("ja")

const { Step } = Steps
const { TextArea } = Input

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

const Register = (props) => {
  const { history } = props
  const location = useLocation()
  const parsedLocation = queryString.parse(location.search)

  const [registerEmailForm] = Form.useForm()
  const [registerProfileForm] = Form.useForm()
  const isMountedRef = Commons.useIsMountedRef()

  const [currentStep, setCurrentStep] = useState(0)
  const [registerInfo, setRegisterInfo] = useState(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isBirthdayPickerOpen, setIsBirthdayPickerOpen] = useState(false)

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
            setRegisterInfo(response?.data || undefined)

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

  const registerHandler = (data) => {
    if (isMountedRef.current) {
      setIsLoading(true)

      const postData = {
        email: data.registerEmail,
      }

      Commons.axiosInstance
        .post(Commons.apiClientRegisterEmail, postData)
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
            message.warning(Commons.warnEmailAlreadyExist)
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
            email: registerEmailForm.getFieldValue("registerEmail"),
          }

          Commons.axiosInstance
            .post(Commons.apiClientRegisterEmail, postData)
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

  const registerProfileHandler = (data) => {
    if (isMountedRef.current) {
      setIsLoading(true)

      const postData = {
        lastName: data.registerProfileLastName,
        firstName: data.registerProfileFirstName,
        lastNameKana: data.registerProfileLastNameKana,
        firstNameKana: data.registerProfileFirstNameKana,
        gender: data.registerProfileGender,
        dateOfBirth: data.registerProfileBirthday,
        password: data.registerProfilePassword,
        telephone: data.registerProfileTelephone,
        zipPostal: data.registerProfileZipPostal,
        prefecture: data.registerProfilePrefecture,
        city: data.registerProfileCity,
        address: data.registerProfileAddress,
        q2inspectionCount: data.registerProfileQ2InspectionCount,
        q3inspectionPurpose: data.registerProfileQ3InspectionPurpose,
        q4isVaccinated: data.registerProfileQ4IsVaccinated,
        q5unvaccinatedReason: data.registerProfileQ5unvaccinatedReason,
        consent1: data.registerProfileQ6Agreement1,
        consent2: data.registerProfileQ6Agreement2,
        token: registerInfo.token,
      }

      Commons.axiosInstance
        .post(Commons.apiClientSignUp, postData)
        .then((response) => {
          if (isMountedRef.current) {
            message.success("登録しました。")
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

  const postalSearchHandler = () => {
    const postalCode = registerProfileForm.getFieldValue(
      "registerProfileZipPostal"
    )

    if (postalCode.length === 7) {
      Commons.getAddressByZipCode(postalCode).then((text) => {
        const matcher = text.match(/({".*"]})/)

        if (matcher) {
          const json = JSON.parse(matcher[0])
          const address = json[postalCode]
          if (address && address[0] && address[1]) {
            const index = address[0] - 1

            registerProfileForm.setFieldsValue({
              registerProfilePrefecture: `${Commons.PREFECTURES[index]["label"]}`,
              registerProfileCity: `${address[1]}${address[2]}`,
              registerProfileAddress: "",
            })
          } else {
            message.warn(Commons.warnWrongPostalMsg)
          }
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
            <p style={{ fontSize: 20 }} className="whitespace-pre-wrap">
              {process.env.REACT_APP_SYSTEM_NAME}
            </p>
          </div>
          <Divider>
            <p className="text-center text-lg font-bold">新規登録</p>
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
                  description={<span className="text-sm">入力</span>}
                />
                <CustomStep
                  title={<span className="text-xs">Step 4</span>}
                  description={<span className="text-sm">登録完了</span>}
                />
              </CustomSteps>
            </Col>
            <Col span={24}>
              {currentStep === 0 ? (
                <Form
                  form={registerEmailForm}
                  name="registerForm"
                  onFinish={registerHandler}
                  size="large"
                  layout="vertical"
                >
                  <Form.Item
                    name="registerEmail"
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
                      {`登録に必要な確認メールを送信しました。\nメール本文内に記載されてるリンクをクリックし、\nパスワードの設定に進んで下さい。\nメールが届かない場合や紛失した場合は、\n再度送信を行って下さい。\n\n※メールの受取環境により迷惑メールフォルダに\n移動されてる場合がありますので、\n迷惑メールフォルダ内の確認もお願いします。`}
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col className="text-sm">メールアドレス</Col>
                  </Row>
                  <Row className="mb-4" justify="center">
                    <Col className="text-base">
                      {registerEmailForm.getFieldValue("registerEmail")}
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
                <>
                  <Form
                    form={registerProfileForm}
                    name="registerProfileForm"
                    onFinish={registerProfileHandler}
                    size="large"
                    layout="vertical"
                    scrollToFirstError
                    initialValues={{
                      registerProfileQ2InspectionCount: "",
                    }}
                  >
                    <Row gutter={[8, 0]}>
                      <Col span={24} className="mb-4">
                        <p>１）本人確認</p>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="氏（漢字）"
                          name="registerProfileLastName"
                          rules={[
                            {
                              required: true,
                              message: "入力してください",
                            },
                            {
                              whitespace: true,
                              message: "入力してください",
                            },
                            {
                              max: 50,
                              message: "50文字未満である必要があります",
                            },
                          ]}
                        >
                          <Input
                            placeholder="例：山田"
                            onPressEnter={(e) => e.preventDefault()}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="名（漢字）"
                          name="registerProfileFirstName"
                          rules={[
                            {
                              required: true,
                              message: "入力してください",
                            },
                            {
                              whitespace: true,
                              message: "入力してください",
                            },
                            {
                              max: 50,
                              message: "50文字未満である必要があります",
                            },
                          ]}
                        >
                          <Input
                            placeholder="例：太郎"
                            onPressEnter={(e) => e.preventDefault()}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="氏（フリガナ）"
                          name="registerProfileLastNameKana"
                          rules={[
                            {
                              required: true,
                              message: "入力してください",
                            },
                            {
                              whitespace: true,
                              message: "入力してください",
                            },
                            {
                              max: 50,
                              message: "50文字未満である必要があります",
                            },
                          ]}
                        >
                          <Input
                            placeholder="例：ヤマダ"
                            onPressEnter={(e) => e.preventDefault()}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="名（フリガナ）"
                          name="registerProfileFirstNameKana"
                          rules={[
                            {
                              required: true,
                              message: "入力してください",
                            },
                            {
                              whitespace: true,
                              message: "入力してください",
                            },
                            {
                              max: 50,
                              message: "50文字未満である必要があります",
                            },
                          ]}
                        >
                          <Input
                            placeholder="例：タロウ"
                            onPressEnter={(e) => e.preventDefault()}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label="生年月日"
                          name="registerProfileBirthday"
                          rules={[
                            {
                              required: true,
                              message: "生年月日を入力してください",
                            },
                          ]}
                        >
                          {isMobile ? (
                            <Input
                              placeholder="例：生年月日を選択してください"
                              readOnly
                              className="cursor-pointer"
                              onPressEnter={(e) => e.preventDefault()}
                              onClick={() => {
                                setIsBirthdayPickerOpen(true)
                              }}
                            />
                          ) : (
                            <AntdDatePicker
                              inputReadOnly
                              showToday={false}
                              allowClear={false}
                            />
                          )}
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label="性別"
                          name="registerProfileGender"
                          rules={[
                            {
                              required: true,
                              message: "性別を選択してください",
                            },
                          ]}
                        >
                          <Radio.Group
                            options={Commons.GENDER}
                            optionType="button"
                            buttonStyle="solid"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="メールアドレス">
                          <Input
                            disabled={true}
                            autoCapitalize="none"
                            prefix={<MailOutlined />}
                            placeholder="例：aaa@bbb.jp"
                            type="email"
                            value={registerInfo?.email || ""}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label="パスワード"
                          name="registerProfilePassword"
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
                          name="registerProfileConfirmPassword"
                          dependencies={["registerProfilePassword"]}
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
                                  getFieldValue("registerProfilePassword") ===
                                    value
                                ) {
                                  return Promise.resolve()
                                }
                                return Promise.reject(
                                  "パスワードが一致しません"
                                )
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
                      <Col span={24}>
                        <Form.Item
                          label="電話番号"
                          name="registerProfileTelephone"
                          rules={[
                            {
                              required: true,
                              message: "電話番号を入力してください",
                            },
                            {
                              max: 15,
                              message:
                                "電話番号は15数字未満である必要があります",
                            },
                          ]}
                        >
                          <Input placeholder="例：080-0000-0000" allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <p className="mb-4">
                          <span className="custom-required-decoration-star">
                            *
                          </span>
                          郵便番号
                          <span className="custom-required-decoration">
                            必須
                          </span>
                          <span className="ml-4">「</span>
                          <span className="text-red-600">
                            9月1日以降　愛知県在住の方以外は有料
                          </span>
                          <span>」</span>
                        </p>
                        <Form.Item
                          name="registerProfileZipPostal"
                          rules={[
                            {
                              required: true,
                              message: "郵便番号を入力してください",
                            },
                            {
                              whitespace: true,
                              message: "有効な郵便番号を入力してください",
                            },
                            {
                              len: 7,
                              message: "",
                            },
                          ]}
                        >
                          <Commons.NumericInput
                            placeholder="例：4600000"
                            maxLength={7}
                            allowClear
                            onPressEnter={(e) => {
                              e.preventDefault()
                              postalSearchHandler()
                            }}
                            onChange={(e) => {
                              postalSearchHandler()
                            }}
                            pattern="[0-9]*"
                            inputMode="numeric"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfilePrefecture"
                          label="都道府県（自動入力）"
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: "郵便番号を入力してください",
                            },
                          ]}
                        >
                          <select
                            disabled
                            className="w-full"
                            style={{
                              minHeight: "40px",
                              lineHeight: "40px",
                              background:
                                "url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6IzQ0NDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmFycm93czwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNC45NSIgaGVpZ2h0PSIxMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxLjQxIDQuNjcgMi40OCAzLjE4IDMuNTQgNC42NyAxLjQxIDQuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMy41NCA1LjMzIDIuNDggNi44MiAxLjQxIDUuMzMgMy41NCA1LjMzIi8+PC9zdmc+) no-repeat 100% 50%",
                              WebkitAppearance: "none",
                              MozAppearance: "none",
                              textAlign: "center",
                              paddingRight: "35px",
                              paddingLeft: "15px",
                              outline: 0,
                              fontSize: "16px",
                              border: "1px solid #d9d9d9",
                              borderRadius: "2px",
                              backgroundColor: "#f5f5f5",
                              color: "rgba(0, 0, 0, 0.60)",
                            }}
                          >
                            <option value="" hidden>
                              郵便番号を入力してください
                            </option>
                            {Commons.PREFECTURES.map((pref) => (
                              <option
                                key={pref.value}
                                value={pref.label}
                                style={{
                                  background: "#fafafa",
                                  textAlign: "center",
                                }}
                              >
                                {pref.label}
                              </option>
                            ))}
                          </select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfileCity"
                          label="住所（自動入力）"
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: "郵便番号を入力してください",
                            },
                          ]}
                        >
                          <TextArea
                            placeholder="例：名古屋市中村区"
                            autoSize
                            disabled
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfileAddress"
                          label="住所（それ以降）"
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: "住所（それ以降）を入力してください",
                            },
                          ]}
                        >
                          <TextArea
                            placeholder="例：平池町４－６０－１４　マーケットスクエア"
                            autoSize
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfileQ2InspectionCount"
                          label={`２）検査利用回数`}
                          rules={[
                            {
                              required: true,
                              message: "検査利用回数を入力してください",
                            },
                            {
                              validator: (_, value) => {
                                if (value > 0) {
                                  return Promise.resolve()
                                }
                                return Promise.reject(
                                  new Error(
                                    "今回初めて検査を受ける場合は、“１”をご入力ください"
                                  )
                                )
                              },
                            },
                          ]}
                          extra={
                            <>
                              <span>
                                過去に利用した、無料検査（行政検査を除く）の回数
                              </span>
                              <span className="text-xs text-red-600 whitespace-pre-wrap">{`\n※回数・頻度が多い場合には、理由の疎明をお願いすることがあります。\n行政検査とは発熱等の症状や無症状でも濃厚接触者など当該感染症に罹患が疑わしいと医師等が判断した際の公費負担による検査。\n※今回初めて検査を受ける場合は、“１”をご入力ください。`}</span>
                            </>
                          }
                        >
                          <InputNumber
                            placeholder="例：1"
                            min={0}
                            addonAfter="回"
                            pattern="[0-9]*"
                            className="w-full"
                            inputMode="numeric"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={<p>３）検査目的</p>} required>
                          <p className="whitespace-pre-wrap text-red-600 font-bold mb-4">{`2022年度9月1日以降、検査目的「 1.イベント・飲食・旅行・帰省等の経済社会活動を行うに当たり、必要であるため（ワクチン・検査パッケージ等） 」は無料検査の適用外となります。\n\n愛知県内在住の方は以下検査目的「２. 都道府県知事から要請を受けて、感染不安があるため」であれば無料になります。愛知県外在住の方や、それ以外の項目を選択された場合は、検査は有料となります。`}</p>
                          <Form.Item
                            noStyle
                            name="registerProfileQ3InspectionPurpose"
                            rules={[
                              {
                                required: true,
                                message: "検査目的を選択してください",
                              },
                            ]}
                            className="whitespace-pre-wrap"
                            extra={`本日の検査の目的について、上記より1つ選択`}
                          >
                            <Radio.Group>
                              <Space direction="vertical">
                                {Commons.INSPECTION_PURPOSES.map((ins) => (
                                  <Radio
                                    key={ins.value}
                                    value={ins.value}
                                    disabled={ins.disable}
                                  >
                                    {ins.disable ? (
                                      <p className="line-through">
                                        {ins.label}
                                      </p>
                                    ) : (
                                      <p>{ins.label}</p>
                                    )}
                                  </Radio>
                                ))}
                              </Space>
                            </Radio.Group>
                          </Form.Item>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) => {
                            return (
                              prevValues.registerProfileQ3InspectionPurpose !==
                              currentValues.registerProfileQ3InspectionPurpose
                            )
                          }}
                        >
                          {({ getFieldValue }) =>
                            getFieldValue(
                              "registerProfileQ3InspectionPurpose"
                            ) === 1 ? (
                              <Form.Item
                                label="４）ワクチンの接種の有無"
                                required
                              >
                                <p className="mb-4">
                                  「３)」で「1.」を選んだ場合、ワクチンを
                                  <span className="text-red-600">3</span>
                                  回接種済みか
                                </p>
                                <Form.Item
                                  noStyle
                                  name="registerProfileQ4IsVaccinated"
                                  rules={[
                                    {
                                      required: true,
                                      message: "選択してください",
                                    },
                                  ]}
                                  className="whitespace-pre-wrap"
                                >
                                  <Radio.Group>
                                    <Space direction="vertical">
                                      {Commons.VACCINATED_OPTIONS.map((ins) => (
                                        <Radio
                                          key={ins.value}
                                          value={ins.value}
                                        >
                                          {ins.label}
                                        </Radio>
                                      ))}
                                    </Space>
                                  </Radio.Group>
                                </Form.Item>
                              </Form.Item>
                            ) : (
                              ""
                            )
                          }
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) => {
                            return (
                              prevValues.registerProfileQ4IsVaccinated !==
                                currentValues.registerProfileQ4IsVaccinated ||
                              prevValues.registerProfileQ3InspectionPurpose !==
                                currentValues.registerProfileQ3InspectionPurpose
                            )
                          }}
                        >
                          {({ getFieldValue }) =>
                            getFieldValue("registerProfileQ4IsVaccinated") ===
                              2 &&
                            getFieldValue(
                              "registerProfileQ3InspectionPurpose"
                            ) === 1 ? (
                              <Form.Item
                                name="registerProfileQ5unvaccinatedReason"
                                label={`５）「４)」で「いいえ」を選んだ場合、その理由`}
                                rules={[
                                  {
                                    required: true,
                                    message: "理由を選択してください",
                                  },
                                ]}
                                className="whitespace-pre-wrap"
                              >
                                <Radio.Group>
                                  <Space direction="vertical">
                                    {Commons.UNVACCINATED_REASONS.map((ins) => (
                                      <Radio key={ins.value} value={ins.value}>
                                        {ins.label}
                                      </Radio>
                                    ))}
                                  </Space>
                                </Radio.Group>
                              </Form.Item>
                            ) : (
                              ""
                            )
                          }
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <p>【確認事項】</p>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfileQ6Agreement1"
                          rules={[
                            {
                              validator: (_, value) =>
                                value
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error("チェックしてください")
                                    ),
                            },
                          ]}
                          className="whitespace-pre-wrap mb-1"
                          valuePropName="checked"
                        >
                          <Checkbox>
                            <span className="whitespace-pre-wrap">{`仮に検査結果が陽性であった場合には医療機関に受診します。`}</span>
                          </Checkbox>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="registerProfileQ6Agreement2"
                          rules={[
                            {
                              validator: (_, value) =>
                                value
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error("チェックしてください")
                                    ),
                            },
                          ]}
                          className="whitespace-pre-wrap"
                          valuePropName="checked"
                        >
                          <Checkbox>
                            <span className="whitespace-pre-wrap">{`上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。`}</span>
                          </Checkbox>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <ol
                          className="list-none list-outside mb-2 text-red-600"
                          style={{ marginLeft: "14px" }}
                        >
                          <li>
                            1：ご申告いただいた内容が虚偽であることが判明した場合、検査費用の負担を求めるほか、都道府県が必要と認める措置を講じる場合があります。
                          </li>
                          <li>
                            2：次回の検査申込に当たっては、PCR検査等の結果通知書等の有効期間が3日間とされていること及び抗原定性検査の結果通知書等の有効期間が1日間とされていること等も踏まえ、前回の検査から経過した日数等を考慮の上、申込を行うようお願いします。
                          </li>
                        </ol>
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
                          登録
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                  {isMobile ? (
                    <DatePicker
                      isOpen={isBirthdayPickerOpen}
                      confirmText="確定"
                      cancelText="キャンセル"
                      min={moment("1900-01-01", "YYYY-MM-DD").toDate()}
                      onSelect={(time) => {
                        setIsBirthdayPickerOpen(false)
                        registerProfileForm.setFieldsValue({
                          registerProfileBirthday:
                            moment(time).format("YYYY-MM-DD"),
                        })
                      }}
                      onCancel={() => {
                        setIsBirthdayPickerOpen(false)
                      }}
                    />
                  ) : (
                    ""
                  )}
                </>
              ) : (
                ""
              )}
              {currentStep === 3 ? (
                <>
                  <Row justify="center mb-8">
                    <Col className="text-center text-base">
                      登録が完了しました
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
                      TOPへ
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

export default withRouter(Register)
