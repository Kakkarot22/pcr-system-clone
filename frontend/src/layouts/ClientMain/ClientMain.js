import React, { useState, useEffect, useCallback } from "react"
import { Sidebar, Topbar } from "./components"
import { withRouter } from "react-router-dom"
import {
  Layout,
  Spin,
  message,
  Drawer,
  Row,
  Col,
  Divider,
  Button,
  Input,
  Form,
  Radio,
  Checkbox,
  Space,
  InputNumber,
  DatePicker as AntdDatePicker,
} from "antd"
import { MailOutlined } from "@ant-design/icons"
import {
  UserOutlined,
  HomeFilled,
  MailFilled,
  PhoneFilled,
} from "@ant-design/icons"
import DatePicker from "react-mobile-datepicker"
import { isMobile } from "react-device-detect"
import moment from "moment"
import "moment/locale/ja"
import { useClearCacheCtx } from "react-clear-cache"
import * as Commons from "common/common"

moment.locale("ja")

const { TextArea } = Input

const ClientMain = (props) => {
  const { children, history } = props
  const { Header, Sider, Content } = Layout
  const isMountedRef = Commons.useIsMountedRef()
  const { isLatestVersion, emptyCacheStorage } = useClearCacheCtx()

  const [profileChangeForm] = Form.useForm()

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileDrawerVisible, setIsProfileDrawerVisible] = useState(false)
  const [isProfileChangeDrawerVisible, setIsProfileChangeDrawerVisible] =
    useState(false)
  const [isBirthdayPickerOpen, setIsBirthdayPickerOpen] = useState(false)
  const [birthdayPickerValue, setBirthdayPickerValue] = useState(
    moment().toDate()
  )

  const [auth, setAuth] = useState(false)
  const [profile, setProfile] = useState({})

  const isHamburger = true

  const getAuth = useCallback(() => {
    Commons.axiosInstance
      .get(Commons.apiAuth)
      .then((response) => {
        setAuth(response?.data?.role)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.clientLoginRoute)
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        } else {
          message.error(Commons.errorSystemMsg)
        }
      })
  }, [history])

  const getProfile = useCallback(() => {
    Commons.axiosInstance
      .get(Commons.apiClientProfile)
      .then((response) => {
        setProfile(response?.data || {})
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.clientLoginRoute)
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        } else {
          message.error(Commons.errorSystemMsg)
        }
      })
  }, [history])

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

  const profileChangeHandler = (data) => {
    if (isMountedRef.current) {
      setIsLoading(true)

      const putData = {
        lastName: data.profileChangeLastName,
        firstName: data.profileChangeFirstName,
        lastNameKana: data.profileChangeLastNameKana,
        firstNameKana: data.profileChangeFirstNameKana,
        gender: data.profileChangeGender,
        dateOfBirth: data.profileChangeBirthday,
        password:
          data.profileChangePassword !== ""
            ? data.profileChangePassword
            : undefined,
        telephone: data.profileChangeTelephone,
        zipPostal: data.profileChangeZipPostal,
        prefecture: data.profileChangePrefecture,
        city: data.profileChangeCity,
        address: data.profileChangeAddress,
        q2inspectionCount: data.profileChangeQ2InspectionCount,
        q3inspectionPurpose: data.profileChangeQ3InspectionPurpose,
        q4isVaccinated: data.profileChangeQ4IsVaccinated,
        q5unvaccinatedReason: data.profileChangeQ5unvaccinatedReason,
        consent1: data.registerProfileQ6Agreement1,
        consent2: data.registerProfileQ6Agreement2,
      }

      Commons.axiosInstance
        .put(Commons.apiClientProfileChange, putData)
        .then((response) => {
          if (isMountedRef.current) {
            message.success("変更しました。")
            getProfile()
            hideProfileChangeDrawer()
          }
        })
        .catch((error) => {
          if (error.response.status === 500) {
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
    const postalCode = profileChangeForm.getFieldValue("profileChangeZipPostal")

    if (postalCode.length === 7) {
      Commons.getAddressByZipCode(postalCode).then((text) => {
        const matcher = text.match(/({".*"]})/)

        if (matcher) {
          const json = JSON.parse(matcher[0])
          const address = json[postalCode]
          if (address && address[0] && address[1]) {
            const index = address[0] - 1

            profileChangeForm.setFieldsValue({
              profileChangePrefecture: `${Commons.PREFECTURES[index]["label"]}`,
              profileChangeCity: `${address[1]}${address[2]}`,
              profileChangeAddress: "",
            })
          } else {
            message.warn(Commons.warnWrongPostalMsg)
          }
        }
      })
    }
  }

  const collapse = () => {
    setIsCollapsed(true)
  }

  const expand = () => {
    setIsCollapsed(false)
  }

  const collapseToggle = () => {
    if (isCollapsed) {
      expand()
    } else {
      collapse()
    }
  }

  const showLoadingPageSpin = () => {
    setIsPageLoading(true)
  }

  const hideLoadingPageSpin = () => {
    setIsPageLoading(false)
  }

  const showProfileDrawer = () => {
    setIsProfileDrawerVisible(true)
  }

  const hideProfileDrawer = () => {
    setIsProfileDrawerVisible(false)
  }

  const showProfileChangeDrawer = () => {
    hideProfileDrawer()

    setBirthdayPickerValue(
      profile?.dateOfBirth
        ? moment(profile?.dateOfBirth).toDate()
        : moment().toDate()
    )

    profileChangeForm.setFieldsValue({
      profileChangeLastName: profile?.lastName || "",
      profileChangeFirstName: profile?.firstName || "",
      profileChangeLastNameKana: profile?.lastNameKana || "",
      profileChangeFirstNameKana: profile?.firstNameKana || "",
      profileChangeBirthday: isMobile
        ? profile?.dateOfBirth || ""
        : profile?.dateOfBirth
        ? moment(profile?.dateOfBirth)
        : undefined,
      profileChangeGender: profile?.gender || "",
      profileChangeEmail: profile?.email || "",
      profileChangePassword: "",
      profileChangeConfirmPassword: "",
      profileChangeTelephone: profile?.telephone || "",
      profileChangeZipPostal: profile?.zipPostal || "",
      profileChangePrefecture: profile?.prefecture || "",
      profileChangeCity: profile?.city || "",
      profileChangeAddress: profile?.address || "",
      profileChangeQ2InspectionCount: profile?.q2inspectionCount || "",
      profileChangeQ3InspectionPurpose: profile?.q3inspectionPurpose || "",
      profileChangeQ4IsVaccinated: profile?.q4isVaccinated || "",
      profileChangeQ5unvaccinatedReason: profile?.q5unvaccinatedReason || "",
    })

    setIsProfileChangeDrawerVisible(true)
  }

  const hideProfileChangeDrawer = () => {
    setIsProfileChangeDrawerVisible(false)
  }

  const childrenWithProps = React.Children.map(children, (element) =>
    React.cloneElement(element, {
      showLoadingPageSpin: showLoadingPageSpin,
      hideLoadingPageSpin: hideLoadingPageSpin,
      isPageLoading: isPageLoading,
      auth: auth,
    })
  )

  useEffect(getAuth, [getAuth])
  useEffect(getProfile, [getProfile])

  useEffect(() => {
    if (isHamburger) {
      collapse()
    } else {
      expand()
    }
  }, [isHamburger])

  useEffect(() => {
    if (!isLatestVersion) emptyCacheStorage()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLatestVersion])

  return (
    <div className="flex flex-col w-full min-h-full">
      <Spin
        spinning={isPageLoading}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
        }}
      >
        <Layout className="min-h-full">
          {isHamburger ? (
            isCollapsed ? (
              <div></div>
            ) : (
              <div
                onClick={() => collapse()}
                className="absolute top-0 left-0 bg-black bg-opacity-50 w-full h-full z-50"
              ></div>
            )
          ) : isCollapsed ? (
            <div
              style={{
                flex: "0 0 80px",
                minWidth: "80px",
                maxWidth: "80px",
                overflow: "hidden",
              }}
            ></div>
          ) : (
            <div
              style={{
                flex: "0 0 200px",
                minWidth: "200px",
                maxWidth: "200px",
                overflow: "hidden",
              }}
            ></div>
          )}
          <Sider
            theme="light"
            collapsible
            collapsed={isCollapsed}
            collapsedWidth={isHamburger ? 0 : 80}
            trigger={null}
            className="fixed top-0 left-0 h-full shadow z-50 border-r border-solid border-gray-300"
          >
            <Sidebar
              isHamburger={isHamburger}
              isCollapsed={isCollapsed}
              collapseToggle={collapseToggle}
            />
          </Sider>
          <Layout className="site-layout min-h-screen">
            <Header className="site-layout-sub-header-background p-0 bg-white">
              <Topbar
                isHamburger={isHamburger}
                collapseToggle={collapseToggle}
                auth={auth}
                profile={profile}
                showProfileDrawer={showProfileDrawer}
              />
            </Header>
            <Content className="site-layout-background bg-white px-4">
              {childrenWithProps}
            </Content>
          </Layout>
          <Drawer
            placement="right"
            width={250}
            onClose={hideProfileDrawer}
            visible={isProfileDrawerVisible}
            destroyOnClose
          >
            <div className="flex flex-col h-full content-between">
              <div className="flex-1">
                <Row justify="center mb-2">
                  <UserOutlined style={{ fontSize: 60 }} />
                </Row>
                <p className="text-center text-xl font-bold mb-8">{`${
                  profile.lastName || "ー"
                } ${profile.firstName || "ー"}`}</p>
                <Row justify="center">
                  <Col>
                    <Row
                      justify="start"
                      align="middle"
                      gutter={[8, 8]}
                      className="mb-2 truncate"
                      wrap={false}
                    >
                      <Col>
                        <MailFilled />
                      </Col>
                      <Col
                        className="text-secondary truncate"
                        style={{ maxWidth: "190px" }}
                      >
                        {profile.email || "ー"}
                      </Col>
                    </Row>
                    <Row
                      justify="start"
                      align="middle"
                      gutter={[8, 8]}
                      className="mb-2 truncate"
                      wrap={false}
                    >
                      <Col>
                        <PhoneFilled />
                      </Col>
                      <Col
                        className="text-secondary truncate"
                        style={{ maxWidth: "190px" }}
                      >
                        {profile.telephone || "ー"}
                      </Col>
                    </Row>
                    <Row
                      justify="start"
                      align="top"
                      gutter={[8, 0]}
                      className="truncate"
                      wrap={false}
                    >
                      <Col>
                        <HomeFilled />
                      </Col>
                      <Col
                        className="text-secondary truncate pt-px"
                        style={{ maxWidth: "190px" }}
                      >
                        〒
                        {profile.zipPostal
                          ? `${Commons.insertCharacter(
                              profile.zipPostal,
                              3,
                              "-"
                            )}`
                          : "ー"}
                      </Col>
                    </Row>
                    <Row
                      justify="start"
                      align="top"
                      gutter={[8, 0]}
                      className="truncate"
                      wrap={false}
                    >
                      <Col style={{ width: "24px" }}></Col>
                      <Col
                        className="text-secondary truncate pt-px"
                        style={{ maxWidth: "190px" }}
                      >
                        {profile.prefecture || "ー"}
                      </Col>
                    </Row>
                    <Row
                      justify="start"
                      align="top"
                      gutter={[8, 0]}
                      className="truncate"
                      wrap={false}
                    >
                      <Col style={{ width: "24px" }}></Col>
                      <Col
                        className="text-secondary truncate pt-px"
                        style={{ maxWidth: "190px" }}
                      >
                        {profile.city || "ー"}
                      </Col>
                    </Row>
                    <Row
                      justify="start"
                      align="top"
                      gutter={[8, 0]}
                      className="truncate"
                      wrap={false}
                    >
                      <Col style={{ width: "24px" }}></Col>
                      <Col
                        className="text-secondary truncate pt-px"
                        style={{ maxWidth: "190px" }}
                      >
                        {profile.address || "ー"}
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <Divider dashed className="border-gray-600" />
                <Row justify="center">
                  <Button
                    type="primary"
                    shape="round"
                    block
                    size="large"
                    onClick={showProfileChangeDrawer}
                  >
                    変更
                  </Button>
                </Row>
              </div>
              <Divider />
              <Row justify="center" className="pb-4">
                <Button
                  danger
                  shape="round"
                  size="large"
                  className="px-8"
                  onClick={logout}
                >
                  ログアウト
                </Button>
              </Row>
            </div>
          </Drawer>
          <Drawer
            placement="right"
            size={isMobile ? "default" : "large"}
            onClose={hideProfileChangeDrawer}
            visible={isProfileChangeDrawerVisible}
            destroyOnClose
          >
            <Divider>
              <p className="text-center text-lg font-bold">情報変更</p>
            </Divider>
            <Form
              form={profileChangeForm}
              name="profileChangeForm"
              onFinish={profileChangeHandler}
              size="large"
              layout="vertical"
              preserve={false}
              scrollToFirstError
              initialValues={{
                profileChangeQ2InspectionCount: "",
              }}
            >
              <Row gutter={[8, 0]}>
                <Col span={24} className="mb-4">
                  <p>１）本人情報</p>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="氏（漢字）"
                    name="profileChangeLastName"
                    hasFeedback
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
                    name="profileChangeFirstName"
                    hasFeedback
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
                    name="profileChangeLastNameKana"
                    hasFeedback
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
                    name="profileChangeFirstNameKana"
                    hasFeedback
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
                    name="profileChangeBirthday"
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
                    name="profileChangeGender"
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
                  <Form.Item
                    name="profileChangeEmail"
                    label="メールアドレス"
                    hasFeedback
                  >
                    <Input
                      disabled={true}
                      autoCapitalize="none"
                      prefix={<MailOutlined />}
                      placeholder="例：aaa@bbb.jp"
                      type="email"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="パスワード"
                    name="profileChangePassword"
                    hasFeedback
                    rules={[
                      {
                        min: 8,
                        message: "パスワードは8文字以上にする必要があります",
                      },
                      {
                        max: 32,
                        message: "パスワードは32文字未満である必要があります",
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
                    name="profileChangeConfirmPassword"
                    hasFeedback
                    dependencies={["profileChangePassword"]}
                    rules={[
                      {
                        min: 8,
                        message: "パスワードは8文字以上にする必要があります",
                      },
                      {
                        max: 32,
                        message: "パスワードは32文字未満である必要があります",
                      },
                      ({ getFieldValue }) => ({
                        validator(rule, value) {
                          if (
                            !value ||
                            getFieldValue("profileChangePassword") === value
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
                <Col span={24}>
                  <Form.Item
                    label="電話番号"
                    name="profileChangeTelephone"
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "電話番号を入力してください",
                      },
                      {
                        max: 15,
                        message: "電話番号は15数字未満である必要があります",
                      },
                    ]}
                  >
                    <Input placeholder="例：080-0000-0000" allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <p className="mb-4">
                    <span className="custom-required-decoration-star">*</span>
                    郵便番号
                    <span className="custom-required-decoration">必須</span>
                    <span className="ml-4">「</span>
                    <span className="text-red-600">
                      9月1日以降　愛知県在住の方以外は有料
                    </span>
                    <span>」</span>
                  </p>
                  <Form.Item
                    name="profileChangeZipPostal"
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
                    name="profileChangePrefecture"
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
                    name="profileChangeCity"
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
                    name="profileChangeAddress"
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
                    name="profileChangeQ2InspectionCount"
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
                      name="profileChangeQ3InspectionPurpose"
                      extra={`本日の検査の目的について、上記より1つ選択`}
                      rules={[
                        {
                          required: true,
                          message: "検査目的を選択してください",
                        },
                      ]}
                      className="whitespace-pre-wrap"
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
                                <span className="line-through">{ins.label}</span>
                              ) : (
                                <span>{ins.label}</span>
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
                        prevValues.profileChangeQ3InspectionPurpose !==
                        currentValues.profileChangeQ3InspectionPurpose
                      )
                    }}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("profileChangeQ3InspectionPurpose") ===
                      1 ? (
                        <Form.Item label="４）ワクチンの接種の有無" required>
                          <p className="mb-4">
                            「３)」で「1.」を選んだ場合、ワクチンを
                            <span className="text-red-600">3</span>
                            回接種済みか
                          </p>
                          <Form.Item
                            noStyle
                            name="profileChangeQ4IsVaccinated"
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
                                  <Radio key={ins.value} value={ins.value}>
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
                        prevValues.profileChangeQ4IsVaccinated !==
                          currentValues.profileChangeQ4IsVaccinated ||
                        prevValues.profileChangeQ3InspectionPurpose !==
                          currentValues.profileChangeQ3InspectionPurpose
                      )
                    }}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("profileChangeQ4IsVaccinated") === 2 &&
                      getFieldValue("profileChangeQ3InspectionPurpose") ===
                        1 ? (
                        <Form.Item
                          name="profileChangeQ5unvaccinatedReason"
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
                            : Promise.reject(new Error("チェックしてください")),
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
                            : Promise.reject(new Error("チェックしてください")),
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
                    onClick={hideProfileChangeDrawer}
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
                    変更
                  </Button>
                </Col>
              </Row>
            </Form>
            {isMobile ? (
              <DatePicker
                isOpen={isBirthdayPickerOpen}
                value={birthdayPickerValue}
                confirmText="確定"
                cancelText="キャンセル"
                min={moment("1900-01-01", "YYYY-MM-DD").toDate()}
                onSelect={(time) => {
                  setIsBirthdayPickerOpen(false)
                  profileChangeForm.setFieldsValue({
                    profileChangeBirthday: moment(time).format("YYYY-MM-DD"),
                  })
                }}
                onCancel={() => {
                  setIsBirthdayPickerOpen(false)
                }}
              />
            ) : (
              ""
            )}
          </Drawer>
        </Layout>
      </Spin>
    </div>
  )
}

export default withRouter(ClientMain)
