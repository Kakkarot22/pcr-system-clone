import React, { useState, useEffect, useCallback } from "react"
import { withRouter } from "react-router-dom"
import {
  Col,
  Divider,
  message,
  Row,
  Steps,
  Button,
  Modal,
  Checkbox,
  Card,
  Badge,
} from "antd"
import moment from "moment"
import "moment/locale/ja"
import styled from "styled-components"
import io from "socket.io-client"
import * as Commons from "common/common"

moment.locale("ja")

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

const OccurrenceConfirm = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const { occasionId, occurrenceTime, occurrenceDate, occurrenceId } =
    props.match.params
  const isMountedRef = Commons.useIsMountedRef()

  const [currentOccasion, setCurrentOccasion] = useState({})
  const [agreement, setAgreement] = useState(false)

  const fetchOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(`${Commons.apiClientOccasions}/${occasionId}/details`)
      .then((response) => {
        setCurrentOccasion(response?.data || {})
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
  }, [showLoadingPageSpin, hideLoadingPageSpin, history, auth, occasionId])

  const fetchRegisteredOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(Commons.apiClientRegistrations)
      .then((response) => {
        if (response?.data?.length >= 2) {
          history.push(`${Commons.clientRegisteredOccasionsRoute}`)
        } else {
          fetchOccasion()
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

    // eslint-disable-next-line
  }, [showLoadingPageSpin, hideLoadingPageSpin, history, auth])

  const confirmHandler = () => {
    if (
      currentOccasion?.limitTime
        ? moment(occurrenceDate)
            .subtract(currentOccasion?.limitDays ?? 1, "day")
            .hour(currentOccasion?.limitHours ?? 18)
            .minute(currentOccasion?.limitMinutes ?? 0)
            .second(0)
            .isAfter(moment())
        : true
    ) {
      if (agreement) {
        showLoadingPageSpin()

        const rParams = {
          expected: 1,
          occurrenceId: parseInt(occurrenceId),
        }

        Commons.axiosInstance
          .post(Commons.apiClientOccasions, rParams)
          .then((response) => {
            history.push({
              pathname: `${Commons.clientRegisteredOccasionsRoute}`,
              state: { fromConfirm: true },
            })
          })
          .catch((error) => {
            if (error.response.status === 400) {
              Modal.info({
                title: "確認",
                content: Commons.warnSameDayReserveMsg,
                okText: "確認",
                okButtonProps: { shape: "round" },
                centered: true,
                onOk() {
                  history.go(-2)
                },
              })
            } else if (error.response.status === 406) {
              Modal.info({
                title: "確認",
                content: Commons.warnNoAvailableSpaceMsg,
                okText: "確認",
                okButtonProps: { shape: "round" },
                centered: true,
                onOk() {
                  history.goBack()
                },
              })
            } else if (error.response.status === 409) {
              Modal.info({
                title: "確認",
                content: Commons.warnRegistrationOverlapMsg,
                okText: "確認",
                okButtonProps: { shape: "round" },
                centered: true,
              })
            } else if (error.response.status === 500) {
              message.error(Commons.errorSystemMsg)
            }
          })
          .finally(() => {
            if (isMountedRef.current) {
              hideLoadingPageSpin()
            }
          })
      } else {
        Modal.info({
          title: "確認",
          okText: "確認",
          okButtonProps: { shape: "round" },
          centered: true,
          content: Commons.warnAgreementNotCheckedMsg,
        })
      }
    } else {
      Modal.info({
        title: "確認",
        content: Commons.warnNoAvailableSpaceMsg,
        okText: "確認",
        okButtonProps: { shape: "round" },
        centered: true,
        onOk() {
          history.goBack()
        },
      })
    }
  }

  useEffect(() => {
    fetchRegisteredOccasion()

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const socket = io(Commons.siteURL, { path: "/socket.io" })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchRegisteredOccasion()
        }
      }
    })

    socket.on("deleteEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          history.goBack()
        }
      }
    })

    return () => {
      socket.off("updateEvent")
      socket.off("deleteEvent")

      socket.disconnect()
    }

    // eslint-disable-next-line
  }, [])

  return (
    <>
      <div className="mb-8 animate__animated animate__fadeIn">
        <Row gutter={[0, 0]} justify="center">
          <Col xs={24} lg={12} xl={8}>
            <CustomSteps
              type="navigation"
              size="small"
              direction="horizontal"
              responsive={false}
              style={{
                boxShadow: "0px -1px 0 0 #e8e8e8 inset",
              }}
              current={4}
            >
              <CustomStep
                title={<span className="text-xs">Step 1</span>}
                description={
                  <span className="text-sm whitespace-pre-wrap">{`検査方法\n選択`}</span>
                }
              />
              <CustomStep
                title={<span className="text-xs">Step 2</span>}
                description={
                  <span className="text-sm  whitespace-pre-wrap">{`会場\n選択`}</span>
                }
              />
              <CustomStep
                title={<span className="text-xs">Step 3</span>}
                description={
                  <span className="text-sm whitespace-pre-wrap">{`受診日\n選択`}</span>
                }
              />
              <CustomStep
                title={<span className="text-xs">Step 4</span>}
                description={
                  <span className="text-sm whitespace-pre-wrap">{`受診時間\n選択`}</span>
                }
              />
              <CustomStep
                title={<span className="text-xs">Step 5</span>}
                description={
                  <span className="text-sm whitespace-pre-wrap">{`内容\n確認`}</span>
                }
              />
            </CustomSteps>
          </Col>
        </Row>
        <Row gutter={[0, 0]} justify="center">
          <Col xs={24} lg={12} xl={8} className="mt-8">
            <p className="text-lg font-bold text-gray-500">内容確認</p>
            <Divider />
            <Badge.Ribbon text={Commons.getTypeByValue(currentOccasion?.type)}>
              <Card>
                <div className="px-4">
                  <p className="text-sm text-gray-500 mb-2">検査場所</p>
                  <p className="text-lg text-center font-bold">{`${
                    currentOccasion?.title || "ー"
                  }`}</p>
                  <p className="text-sm text-center">{`〒${
                    currentOccasion?.zipPostal
                      ? Commons.insertCharacter(
                          currentOccasion.zipPostal,
                          3,
                          "-"
                        )
                      : "ー"
                  } ${currentOccasion?.address || "ー"}`}</p>
                  <p className="text-sm text-center whitespace-pre-wrap">{`${
                    currentOccasion?.telephone || "ー"
                  }`}</p>
                  <Divider />
                  <p className="text-sm text-gray-500 mb-2">予約日</p>
                  <p className="text-lg text-center font-bold">
                    {moment(occurrenceDate, "YYYY-MM-DD").format(
                      "YYYY年M月D日"
                    )}
                  </p>
                  <Divider />
                  <p className="text-sm text-gray-500 mb-2">予約時間</p>
                  <p className="text-lg text-center font-bold">
                    {moment(occurrenceTime, "HH:mm").format("HH時mm分")}
                  </p>
                  <Divider />
                  <p className="text-center mb-4">{`予約内容をご確認の後、間違えがなければ下記の「予約確定」を押してください。`}</p>
                  <div className="text-center">
                    <Checkbox
                      className="text-xs"
                      checked={agreement}
                      onChange={(e) => {
                        setAgreement(e.target.checked)
                      }}
                    >
                      <a
                        href={Commons.PRIVACY_POLICY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary"
                      >
                        プライバシーポリシー
                      </a>
                      に同意
                    </Checkbox>
                  </div>
                </div>
              </Card>
            </Badge.Ribbon>
            <Divider />
            <Row gutter={[8, 0]} justify="center" className="mb-4">
              <Col>
                <Button
                  size="large"
                  className="px-8"
                  shape="round"
                  onClick={() => {
                    history.goBack()
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
                  className="px-12"
                  onClick={confirmHandler}
                >
                  予約確定
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default withRouter(OccurrenceConfirm)
