import React, { useState, useEffect, useRef, useCallback } from "react"
import { Sidebar, Topbar } from "./components"
import { withRouter } from "react-router-dom"
import {
  Button,
  Col,
  Descriptions,
  Grid,
  Layout,
  Modal,
  Spin,
  Row,
  message,
  Tag
} from "antd"
import { QrcodeOutlined } from "@ant-design/icons"
import { isMobile } from "react-device-detect"
import QrReader from "react-qr-reader"
import { decode } from "base-64"
import moment from "moment"
import "moment/locale/ja"
import * as Commons from "common/common"

moment.locale("ja")

const Main = (props) => {
  const { children, history } = props
  const { Header, Sider, Content } = Layout
  const { useBreakpoint } = Grid

  const isMountedRef = Commons.useIsMountedRef()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [registration, setRegistration] = useState({})
  const [auth, setAuth] = useState(false)

  const qrRef = useRef()

  const breakpoint = useBreakpoint()
  const isHamburger = !breakpoint.xl

  const getAuth = useCallback(() => {
    Commons.axiosInstance
      .get(Commons.apiAuth)
      .then((response) => {
        setAuth(response?.data?.role)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.adminLoginRoute)
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        } else {
          message.error(Commons.errorSystemMsg)
        }
      })
  }, [history])

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

  const hideQRModal = () => {
    setQrModalVisible(false)
  }

  const showQRModal = () => {
    setQrModalVisible(true)
  }

  const showConfirmModal = () => {
    setConfirmModalVisible(true)
  }

  const hideConfirmModal = () => {
    setConfirmModalVisible(false)
  }

  const handleQRError = (err) => {
    console.log(err)
  }

  const handleQRScan = (data) => {
    if (data) {
      if (typeof data === "string" || data instanceof String) {
        hideQRModal()

        let decodedData = ""

        try {
          decodedData = decode(data)

          if (!isNaN(decodedData)) {
            checkRegistration(decodedData)
          } else {
            message.warning(Commons.errorQrWrongMsg)
          }
        } catch (e) {
          message.warning(Commons.errorQrWrongMsg)
        }
      } else {
        message.warning(Commons.errorQrWrongMsg)
      }
    }
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

  useEffect(() => {
    if (isHamburger) {
      collapse()
    } else {
      expand()
    }
  }, [isHamburger])

  const checkRegistration = (registrationId) => {
    if (isMountedRef.current) {
      showLoadingPageSpin()

      const paramData = {
        registrationId: registrationId,
      }

      Commons.axiosInstance
        .post(Commons.apiRegistrations, paramData)
        .then((response) => {
          if (response.status === 200) {
            if (response.data) {
              if (response.data.attended === 0) {
                setRegistration(response.data)
                showConfirmModal()
              } else {
                message.warning(Commons.errorQrAlreadyUsedMsg)
              }
            } else {
              message.error(Commons.errorSystemMsg)
            }
          }
        })
        .catch((error) => {
          if (error.response.status === 409) {
            message.warning(Commons.errorQrNotExistMsg)
          } else if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth))
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          } else {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            hideLoadingPageSpin()
          }
        })
    }
  }

  const confirmRegistration = () => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
      setIsLoading(true)

      const paramData = {
        registrationId: registration.registrationId,
      }

      Commons.axiosInstance
        .put(Commons.apiRegistrations, paramData)
        .then((response) => {
          if (response.status === 200) {
            message.success(Commons.successQrEventMsg)
            hideConfirmModal()
          }
        })
        .catch((error) => {
          if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth))
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          } else {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            hideLoadingPageSpin()
            setIsLoading(false)
          }
        })
    }
  }

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
            <Header className="site-layout-sub-header-background p-0 bg-white shadow">
              <Topbar
                isHamburger={isHamburger}
                collapseToggle={collapseToggle}
                auth={auth}
              />
            </Header>
            <Content className="site-layout-background m-5 bg-white border-solid border border-gray-400 shadow">
              {isMobile ? (
                <>
                  <div
                    className="fixed z-10 bg-white border border-primary rounded p-1 right-0"
                    onClick={showQRModal}
                  >
                    <Row justify="center">
                      <Col span={24}>
                        <QrcodeOutlined className="text-4xl" />
                      </Col>
                    </Row>
                  </div>
                  <Modal
                    visible={qrModalVisible}
                    title="QR読み取り"
                    onCancel={hideQRModal}
                    footer={null}
                    centered
                    destroyOnClose
                  >
                    {qrModalVisible ? (
                      <QrReader
                        ref={qrRef}
                        delay={300}
                        facingMode={"environment"}
                        onError={handleQRError}
                        onScan={handleQRScan}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      ""
                    )}
                  </Modal>
                  <Modal
                    visible={confirmModalVisible}
                    title="参加者確認"
                    onCancel={hideConfirmModal}
                    footer={null}
                    centered
                    destroyOnClose
                  >
                    <Row gutter={[0, 8]}>
                      <Col span={24}>
                        <Descriptions
                          column={1}
                          bordered
                          labelStyle={{ width: "150px" }}
                        >
                          <Descriptions.Item label="会場名">
                            <span>{registration.title || "ー"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="検査タイプ">
                            <Tag color='#21acd7'>{Commons.getTypeByValue(registration.type)}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="予約日">
                            <span>
                              {registration.startAt
                                ? moment(registration.startAt).format(
                                    "YYYY年M月D日 (ddd)"
                                  )
                                : "ー"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="予約時間">
                            <span>
                              {registration.startAt
                                ? moment(registration.startAt).format(
                                    "HH時mm分"
                                  )
                                : "ー"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="氏名">{`${
                            registration?.lastName || "ー"
                          } ${
                            registration?.firstName || "ー"
                          }`}</Descriptions.Item>
                          <Descriptions.Item label="氏名（フリガナ）">{`${
                            registration?.lastNameKana || "ー"
                          } ${
                            registration?.firstNameKana || "ー"
                          }`}</Descriptions.Item>
                          <Descriptions.Item label="生年月日">
                            {registration?.dateOfBirth || "ー"}
                          </Descriptions.Item>
                          <Descriptions.Item label="性別">
                            {Commons.getGenderByValue(registration?.gender)}
                          </Descriptions.Item>
                          <Descriptions.Item label="メールアドレス">
                            {registration?.email || "ー"}
                          </Descriptions.Item>
                          <Descriptions.Item label="電話番号">
                            {registration?.telephone || "ー"}
                          </Descriptions.Item>
                          <Descriptions.Item label="住所">
                            〒
                            {registration?.zipPostal
                              ? Commons.insertCharacter(
                                  registration.zipPostal,
                                  3,
                                  "-"
                                )
                              : "ー"}{" "}
                            {registration?.prefecture || "ー"}
                            {registration?.city || "ー"}
                            {registration?.address || "ー"}
                          </Descriptions.Item>
                          <Descriptions.Item label="検査利用回数">
                            {registration?.q2inspectionCount || "ー"}回
                          </Descriptions.Item>
                          <Descriptions.Item label="検査目的">
                            {Commons.getInspectionPurposeByValue(
                              registration?.q3inspectionPurpose
                            )}
                          </Descriptions.Item>
                          {registration?.q3inspectionPurpose === 1 ? (
                            <Descriptions.Item label="ワクチンの接種の有無">
                              {Commons.getVaccinatedOptionByValue(
                                registration?.q4isVaccinated
                              )}
                            </Descriptions.Item>
                          ) : (
                            ""
                          )}
                          {registration?.q4isVaccinated === 2 ? (
                            <Descriptions.Item label="ワクチン未接種の理由">
                              {Commons.getUnvaccinatedReasonByValue(
                                registration?.q5unvaccinatedReason
                              )}
                            </Descriptions.Item>
                          ) : (
                            ""
                          )}
                        </Descriptions>
                      </Col>
                      <Col span={24} className="mt-4">
                        <Row gutter={[8, 8]} justify="center">
                          <Col>
                            <Button
                              type="primary"
                              size="large"
                              className="px-8"
                              onClick={confirmRegistration}
                              loading={isLoading}
                            >
                              登録
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Modal>
                </>
              ) : (
                ""
              )}
              {childrenWithProps}
            </Content>
          </Layout>
        </Layout>
      </Spin>
    </div>
  )
}

export default withRouter(Main)
