import React, { useState, useEffect, useCallback, useRef } from "react"
import { withRouter, useLocation } from "react-router-dom"
import { Col, Divider, message, Row, Button, Modal, Card, Badge } from "antd"
import {
  ExclamationCircleOutlined,
  AppleOutlined,
  GoogleOutlined,
} from "@ant-design/icons"
import QRCode from "qrcode.react"
import { encode } from "base-64"
import { google, ics } from "calendar-link"
import moment from "moment"
import "moment/locale/ja"
import io from "socket.io-client"
import * as Commons from "common/common"

moment.locale("ja")

const RegisteredOccasion = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const registeredOccasionsRef = useRef()
  const location = useLocation()
  const isMountedRef = Commons.useIsMountedRef()

  const [registeredOccasion, setRegisteredOccasion] = useState([])
  const [currentRegistration, setCurrentRegistration] = useState(undefined)
  const [qrModalVisible, setQrModalVisible] = useState(false)

  const fetchRegisteredOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(Commons.apiClientRegistrations)
      .then((response) => {
        setRegisteredOccasion(response?.data || [])

        if (response?.data?.length === 0) {
          history.push(Commons.clientOccasionsRoute)
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
        hideLoadingPageSpin()
      })
  }, [showLoadingPageSpin, hideLoadingPageSpin, history, auth])

  const handleCancellation = (occasion) => {
    showLoadingPageSpin()

    const rParams = {
      data: {
        registrationId: occasion?.registrationId || undefined,
      },
    }

    Commons.axiosInstance
      .delete(Commons.apiClientOccasions, rParams)
      .then((response) => {
        message.success(Commons.successCancelMsg)
        history.push(Commons.clientOccasionsRoute)
      })
      .catch((error) => {
        if (error.response.status === 406) {
          history.push(Commons.clientOccasionsRoute)
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

  const cancelHandler = (occasion) => {
    Modal.confirm({
      title: "確認",
      icon: <ExclamationCircleOutlined />,
      content: "予約をキャンセルしてもよろしいですか？",
      okText: "予約をキャンセル",
      okType: "danger",
      okButtonProps: { shape: "round" },
      cancelText: "閉じる",
      cancelButtonProps: { shape: "round" },
      centered: true,
      onOk() {
        handleCancellation(occasion)
      },
    })
  }

  const showQrModal = (registration) => {
    setCurrentRegistration(registration)
    setQrModalVisible(true)
  }

  const hideQrModal = () => {
    setCurrentRegistration(undefined)
    setQrModalVisible(false)
  }

  useEffect(() => {
    fetchRegisteredOccasion()

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    registeredOccasionsRef.current = registeredOccasion

    // eslint-disable-next-line
  }, [registeredOccasion])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const socket = io(Commons.siteURL, { path: "/socket.io" })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && registeredOccasionsRef.current) {
          registeredOccasionsRef.current.forEach((registeredOccasion) => {
            if (
              response.occasionId + "" ===
              registeredOccasion.occasionId + ""
            ) {
              fetchRegisteredOccasion()
            }
          })
        }
      }
    })

    socket.on("deleteEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && registeredOccasionsRef.current) {
          registeredOccasionsRef.current.forEach((registeredOccasion) => {
            if (
              response.occasionId + "" ===
              registeredOccasion.occasionId + ""
            ) {
              history.push(Commons.clientOccasionsRoute)
            }
          })
        }
      }
    })

    socket.on("confirmRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && registeredOccasionsRef.current) {
          registeredOccasionsRef.current.forEach((registeredOccasion) => {
            if (
              response.occasionId + "" ===
              registeredOccasion.occasionId + ""
            ) {
              fetchRegisteredOccasion()
            }
          })
        }
      }
    })

    socket.on("cancelRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && registeredOccasionsRef.current) {
          registeredOccasionsRef.current.forEach((registeredOccasion) => {
            if (
              response.occasionId + "" ===
              registeredOccasion.occasionId + ""
            ) {
              fetchRegisteredOccasion()
            }
          })
        }
      }
    })

    return () => {
      socket.off("updateEvent")
      socket.off("deleteEvent")
      socket.off("confirmRegistration")
      socket.off("cancelRegistration")

      socket.disconnect()
    }

    // eslint-disable-next-line
  }, [])

  const registeredOccasionView = (occasion) => {
    return (
      <>
        <Badge.Ribbon
          key={occasion.occasionId}
          text={Commons.getTypeByValue(occasion.type)}
        >
          <Card>
            <div className="px-2">
              <p className="text-sm text-gray-500 mb-2">検査場所</p>
              <p className="text-lg text-center font-bold">{`${
                occasion?.title || "ー"
              }`}</p>
              <p className="text-sm text-center">{`〒${
                occasion?.zipPostal
                  ? Commons.insertCharacter(occasion.zipPostal, 3, "-")
                  : "ー"
              } ${occasion?.address || "ー"}`}</p>
              <p className="text-sm text-center whitespace-pre-wrap">
                {`${occasion?.telephone || "ー"}`}
              </p>
              <Divider />
              <p className="text-sm text-gray-500 mb-2">予約日</p>
              <p className="text-lg text-center font-bold">
                {occasion?.startAt
                  ? moment(occasion.startAt).format("YYYY年M月D日 (ddd)")
                  : "ー"}
              </p>
              <Divider />
              <p className="text-sm text-gray-500 mb-2">予約時間</p>
              <p className="text-lg text-center font-bold">
                {occasion?.startAt
                  ? moment(occasion.startAt).format("HH時mm分")
                  : "ー"}
              </p>
              <Divider />
              {registeredOccasion?.length < 2 ? (
                <div className="mb-4">
                  {registeredOccasion.filter(
                    (ro) => ro.type === Commons.OCCASION_TYPE_ANTIGEN
                  )[0] ? (
                    <Button
                      type="primary"
                      className="rounded-lg"
                      style={{ minHeight: "100px" }}
                      block
                      onClick={() => {
                        history.push(
                          `${Commons.clientOccasionsRoute}/${Commons.OCCASION_TYPE_PCR}`
                        )
                      }}
                    >
                      <p className="text-sm mb-4">PCR検査も予約する</p>
                      <p className="text-xs">※同日中にPCR検査・抗原定性検査の</p>
                      <p className="text-xs">両方を受検することはできません</p>
                    </Button>
                  ) : registeredOccasion.filter(
                      (ro) => ro.type === Commons.OCCASION_TYPE_PCR
                    )[0] ? (
                    <Button
                      type="primary"
                      className="rounded-lg"
                      style={{ minHeight: "100px" }}
                      block
                      onClick={() => {
                        history.push(
                          `${Commons.clientOccasionsRoute}/${Commons.OCCASION_TYPE_ANTIGEN}`
                        )
                      }}
                    >
                      <p className="text-sm mb-4">抗原定性検査も予約する</p>
                      <p className="text-xs">※同日中にPCR検査・抗原定性検査の</p>
                      <p className="text-xs">両方を受検することはできません</p>
                    </Button>
                  ) : (
                    ""
                  )}
                </div>
              ) : (
                ""
              )}
            </div>
            <p className="text-center mb-4">{occasion?.textCancel || "ー"}</p>
            <Divider />
            <Row justify="center" gutter={[8, 8]}>
              <Col>
                <Button
                  type="dashed"
                  shape="round"
                  icon={<GoogleOutlined />}
                  href={google({
                    title: `${
                      occasion?.type === Commons.OCCASION_TYPE_ANTIGEN
                        ? "抗原性"
                        : occasion?.type === Commons.OCCASION_TYPE_PCR
                        ? "PCR"
                        : ""
                    }検査`,
                    description: `${occasion?.title}\n\n〒${
                      occasion?.zipPostal
                        ? Commons.insertCharacter(occasion.zipPostal, 3, "-")
                        : "ー"
                    } ${occasion?.address || "ー"}\n\n${occasion?.telephone}`,
                    start: moment(occasion?.startAt).toISOString(),
                    end: moment(occasion?.startAt).add(1, "hour").toISOString(),
                    duration: 1,
                    location: occasion?.address,
                    url: Commons.siteURL,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Googleカレンダーに追加
                </Button>
              </Col>
              <Col>
                <Button
                  type="dashed"
                  shape="round"
                  icon={<AppleOutlined />}
                  href={ics({
                    title: `${
                      occasion?.type === Commons.OCCASION_TYPE_ANTIGEN
                        ? "抗原性"
                        : occasion?.type === Commons.OCCASION_TYPE_PCR
                        ? "PCR"
                        : ""
                    }検査`,
                    description: `${occasion?.title}\n\n〒${
                      occasion?.zipPostal
                        ? Commons.insertCharacter(occasion.zipPostal, 3, "-")
                        : "ー"
                    } ${occasion?.address || "ー"}\n\n${occasion?.telephone}`,
                    start: moment(occasion?.startAt).toISOString(),
                    end: moment(occasion?.startAt).add(1, "hour").toISOString(),
                    duration: 1,
                    location: occasion?.address,
                    url: Commons.siteURL,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Appleカレンダーに追加
                </Button>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[8, 0]} justify="center" className="mb-4">
              <Col>
                <Button
                  danger
                  shape="round"
                  className="h-12 m-1"
                  disabled={
                    occasion?.canCancel
                      ? occasion?.attended === 0
                        ? occasion?.startAt
                          ? moment().isSameOrBefore(
                              moment(occasion?.startAt).subtract(
                                occasion?.timeCancel || 0,
                                "minutes"
                              )
                            )
                            ? false
                            : true
                          : true
                        : true
                      : true
                  }
                  onClick={() => {
                    cancelHandler(occasion)
                  }}
                >
                  予約キャンセル
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  shape="round"
                  className="w-32 h-12 m-1"
                  onClick={() => {
                    showQrModal(occasion)
                  }}
                >
                  検査QR
                </Button>
              </Col>
            </Row>
          </Card>
        </Badge.Ribbon>
      </>
    )
  }

  return (
    <>
      <Row
        gutter={[0, 0]}
        justify="center"
        className="mb-8 animate__animated animate__fadeIn"
      >
        <Col xs={24} lg={12} xl={8} className="mt-8">
          {location?.state?.fromConfirm ? (
            <>
              <p className="text-xl whitespace-pre-wrap font-bold text-center text-gray-600 mb-2">{`${
                registeredOccasion?.length >= 2
                  ? "PCR・抗原性"
                  : registeredOccasion.filter(
                      (ro) => ro.type === Commons.OCCASION_TYPE_ANTIGEN
                    )[0]
                  ? "抗原性"
                  : registeredOccasion.filter(
                      (ro) => ro.type === Commons.OCCASION_TYPE_PCR
                    )[0]
                  ? "PCR"
                  : ""
              }検査をご予約\nいただきまして\nありがとうございました。\n`}</p>
              <p className="text-xs text-center text-gray-500 mb-6">{`下記の通りいただきました予約が完了しました。`}</p>
            </>
          ) : (
            <>
              <p className="text-xl whitespace-pre-wrap font-bold text-center text-gray-600 mb-4">{`${
                registeredOccasion?.length >= 2
                  ? "PCR・抗原性"
                  : registeredOccasion.filter(
                      (ro) => ro.type === Commons.OCCASION_TYPE_ANTIGEN
                    )[0]
                  ? "抗原性"
                  : registeredOccasion.filter(
                      (ro) => ro.type === Commons.OCCASION_TYPE_PCR
                    )[0]
                  ? "PCR"
                  : ""
              }検査受付`}</p>
              <p className="text-xs text-center text-gray-500 mb-8">{`QRコードを検査受付時にご提示ください。`}</p>
            </>
          )}
          <p className="text-lg font-bold text-gray-500">予約内容</p>
          <Divider />
          {registeredOccasion?.length > 0 &&
          registeredOccasion.filter(
            (ro) => ro.type === Commons.OCCASION_TYPE_PCR
          )[0]
            ? registeredOccasionView(
                registeredOccasion.filter(
                  (ro) => ro.type === Commons.OCCASION_TYPE_PCR
                )[0]
              )
            : ""}
          {registeredOccasion?.length >= 2 ? <Divider /> : ""}
          {registeredOccasion?.length > 0 &&
          registeredOccasion.filter(
            (ro) => ro.type === Commons.OCCASION_TYPE_ANTIGEN
          )[0]
            ? registeredOccasionView(
                registeredOccasion.filter(
                  (ro) => ro.type === Commons.OCCASION_TYPE_ANTIGEN
                )[0]
              )
            : ""}
        </Col>
      </Row>
      <Modal
        visible={qrModalVisible}
        title="検査受付QRコード"
        onCancel={hideQrModal}
        footer={null}
        centered
      >
        <Row justify="center" className="mb-8">
          <Col>
            {currentRegistration?.registrationId ? (
              <Col span={24}>
                <Row justify="center">
                  <Col>
                    <QRCode
                      value={encode(currentRegistration.registrationId)}
                      size={250}
                      level='H'
                      renderAs="svg"
                    />
                  </Col>
                </Row>
              </Col>
            ) : (
              ""
            )}
          </Col>
        </Row>
        <Divider />
        <Row justify="center">
          <Col>
            <Button
              type="primary"
              shape="round"
              size="large"
              className="px-8"
              onClick={hideQrModal}
            >
              閉じる
            </Button>
          </Col>
        </Row>
      </Modal>
    </>
  )
}

export default withRouter(RegisteredOccasion)
