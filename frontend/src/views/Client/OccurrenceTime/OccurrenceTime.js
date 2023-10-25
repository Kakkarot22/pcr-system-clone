import React, { useState, useEffect, useCallback } from "react"
import { withRouter } from "react-router-dom"
import { Col, Divider, message, Row, Steps, Button, Modal } from "antd"
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

const OccurrenceTime = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const { type, occasionId, occurrenceDate } = props.match.params

  const [currentOccurrenceTimes, setCurrentOccurrenceTimes] = useState([])
  const [selectedOccurrence, setSelectedOccurrence] = useState(undefined)

  const fetchOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(`${Commons.apiClientOccasions}/${occasionId}/details`)
      .then((response) => {
        if (
          response?.data?.limitTime
            ? moment(occurrenceDate)
                .subtract(response?.data?.limitDays ?? 1, "day")
                .hour(response?.data?.limitHours ?? 18)
                .minute(response?.data?.limitMinutes ?? 0)
                .second(0)
                .isAfter(moment())
            : true
        ) {
          fetchOccurrenceTimes()
        } else {
          history.goBack()
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
  }, [
    showLoadingPageSpin,
    hideLoadingPageSpin,
    history,
    auth,
    occasionId,
    occurrenceDate,
  ])

  const fetchOccurrenceTimes = useCallback(() => {
    showLoadingPageSpin()

    const rParams = {
      params: {
        date: moment(occurrenceDate).format("YYYY-MM-DD"),
      },
    }

    Commons.axiosInstance
      .get(`${Commons.apiClientOccasions}/${occasionId}/times`, rParams)
      .then((response) => {
        setCurrentOccurrenceTimes(response?.data || [])
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
  }, [
    showLoadingPageSpin,
    hideLoadingPageSpin,
    history,
    auth,
    occasionId,
    occurrenceDate,
  ])

  const timeSelectHandler = () => {
    if (selectedOccurrence) {
      history.push(
        `${Commons.clientOccasionsRoute}/${type}/${occasionId}/${occurrenceDate}/${
          currentOccurrenceTimes.find(
            (ot) => ot.occurrenceId + "" === selectedOccurrence
          )?.startAt
        }/${selectedOccurrence}`
      )
    } else {
      Modal.info({
        title: "確認",
        okText: "確認",
        okButtonProps: { shape: "round" },
        centered: true,
        content: Commons.warnTimeNotSelectedMsg,
      })
    }
  }

  useEffect(() => {
    fetchOccasion()

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
          fetchOccasion()
        }
      }
    })

    socket.on("updateOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
        }
      }
    })

    socket.on("deleteOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
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

    socket.on("newRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
        }
      }
    })

    socket.on("cancelRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
        }
      }
    })

    return () => {
      socket.off("updateEvent")
      socket.off("updateOccurrence")
      socket.off("deleteOccurrence")
      socket.off("deleteEvent")
      socket.off("newRegistration")
      socket.off("cancelRegistration")

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
              current={3}
            >
              <CustomStep
                title={<span className="text-xs">Step 1</span>}
                description={<span className="text-sm whitespace-pre-wrap">{`検査方法\n選択`}</span>}
              />
              <CustomStep
                title={<span className="text-xs">Step 2</span>}
                description={<span className="text-sm  whitespace-pre-wrap">{`会場\n選択`}</span>}
              />
              <CustomStep
                title={<span className="text-xs">Step 3</span>}
                description={<span className="text-sm whitespace-pre-wrap">{`受診日\n選択`}</span>}
              />
              <CustomStep
                title={<span className="text-xs">Step 4</span>}
                description={<span className="text-sm whitespace-pre-wrap">{`受診時間\n選択`}</span>}
              />
              <CustomStep
                title={<span className="text-xs">Step 5</span>}
                description={<span className="text-sm whitespace-pre-wrap">{`内容\n確認`}</span>}
              />
            </CustomSteps>
          </Col>
        </Row>
        <Row gutter={[0, 0]} justify="center">
          <Col xs={24} lg={12} xl={8} className="mt-8">
            <p className="text-lg font-bold text-gray-500">検査時間選択</p>
            <Divider />
            <select
              className="border border-gray-400 rounded-none w-full"
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
              }}
              value={selectedOccurrence}
              onChange={(e) => {
                setSelectedOccurrence(e.target.value)
              }}
            >
              <option value="" hidden>
                選択してください
              </option>
              {currentOccurrenceTimes.map((ot) => (
                <option
                  key={ot.occurrenceId}
                  value={ot.occurrenceId}
                  style={{ background: "#fafafa", textAlign: "center" }}
                >
                  {moment(ot.startAt, "HH:mm").format("HH時mm分")}
                </option>
              ))}
            </select>
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
                  onClick={timeSelectHandler}
                >
                  次へ
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default withRouter(OccurrenceTime)
