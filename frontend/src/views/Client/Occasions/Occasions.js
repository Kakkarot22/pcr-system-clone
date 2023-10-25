import React, { useState, useEffect, useCallback, useRef } from "react"
import { withRouter } from "react-router-dom"
import { Col, message, Row, Steps, Divider, Badge, Card, Button } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import styled from "styled-components"
import io from "socket.io-client"
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

const Occasions = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const registeredOccasionsRef = useRef()
  const { type } = props.match.params

  const [registeredOccasion, setRegisteredOccasion] = useState([])
  const [currentOccasions, setCurrentOccasions] = useState([])

  const fetchOccasions = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(Commons.apiClientOccasions + "/overview", { params: { type: type } })
      .then((response) => {
        setCurrentOccasions(response?.data || [])
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
  }, [showLoadingPageSpin, hideLoadingPageSpin, history, auth, type])

  const fetchRegisteredOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(Commons.apiClientRegistrations)
      .then((response) => {
        setRegisteredOccasion(response?.data || [])

        if (response?.data?.length >= 2) {
          history.push(`${Commons.clientRegisteredOccasionsRoute}`)
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

  const occasionSelectHandler = (occasionId) => {
    history.push(`${Commons.clientOccasionsRoute}/${type}/${occasionId}`)
  }

  useEffect(() => {
    fetchRegisteredOccasion()
    fetchOccasions()

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

    socket.on("newEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchRegisteredOccasion()
        fetchOccasions()
      }
    })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchRegisteredOccasion()
        fetchOccasions()
      }
    })

    socket.on("deleteEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchRegisteredOccasion()
        fetchOccasions()
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
              fetchOccasions()
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
              fetchOccasions()
            }
          })
        }
      }
    })

    return () => {
      socket.off("newEvent")
      socket.off("updateEvent")
      socket.off("deleteEvent")
      socket.off("cancelRegistration")
      socket.off("confirmRegistration")

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
              current={1}
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
            <p className="text-lg font-bold text-gray-500">会場選択</p>
            <Divider />
            {currentOccasions.length > 0 ? (
              <Row gutter={[0, 16]}>
                {currentOccasions.map((occasion) => (
                  <Col
                    key={occasion.occasionId}
                    span={24}
                    className="border border-gray-400 rounded cursor-pointer"
                  >
                    <Badge.Ribbon text={Commons.getTypeByValue(occasion.type)}>
                      <Card
                        hoverable
                        bodyStyle={{
                          padding: "10px",
                        }}
                      >
                        <Row
                          justify="space-between"
                          align="middle"
                          className="m-4"
                          onClick={() =>
                            occasionSelectHandler(occasion.occasionId)
                          }
                          wrap={false}
                        >
                          <Col flex="auto">
                            <p className="text-base font-bold">
                              {occasion.title || "ー"}
                            </p>
                            <p className="text-xs">{`〒${
                              occasion.zipPostal
                                ? Commons.insertCharacter(
                                    occasion.zipPostal,
                                    3,
                                    "-"
                                  )
                                : "ー"
                            } ${occasion.address || "ー"}`}</p>
                            <p className="text-xs whitespace-pre-wrap">{`${
                              occasion.telephone || "ー"
                            }`}</p>
                          </Col>
                          <Col flex="20px">
                            <ArrowRightOutlined />
                          </Col>
                        </Row>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>
            ) : (
              <p className="text-center m-4">
                現在、登録されている会場はありません
              </p>
            )}
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
            </Row>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default withRouter(Occasions)
