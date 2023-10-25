import React, { useState, useEffect, useCallback, useRef } from "react"
import { withRouter } from "react-router-dom"
import { Col, Divider, message, Row, Steps, Button, Modal, Badge } from "antd"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import momentPlugin from "@fullcalendar/moment"
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

const CustomBadge = styled(Badge)`
  .ant-badge-status-processing {
    background-color: #52c41a;
  }

  .ant-badge-status-processing::after {
    border-color: #52c41a;
  }

  .ant-badge-status-text {
    margin: 0;
  }
`

const CalendarWrapper = styled.div`
  a {
    color: inherit !important;
  }

  .fc .fc-button {
    padding: 0;
    background-color: #fff;
    color: #00bcd4;
    border-radius: 0;
    border: 1px solid #00bcd4;
    vertical-align: bottom;
  }

  .fc .fc-button-primary:not(:disabled):active:focus,
  .fc .fc-button-primary:not(:disabled).fc-button-active:focus {
    box-shadow: none;
  }

  .fc .fc-button-primary:focus {
    box-shadow: none;
  }

  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: #00bcd4;
    border-color: #00bcd4;
  }

  .fc .fc-toolbar-title {
    font-weight: bold;
    font-size: 1.5em;
    color: #00bcd4;
  }

  .fc .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
    min-height: 0;
  }

  .fc .fc-daygrid-body-natural .fc-daygrid-day-events {
    margin-bottom: 0;
  }

  .fc .fc-daygrid-day-events {
    margin-top: 0;
  }

  .fc .fc-daygrid-day-top {
    justify-content: center;
  }

  .fc .fc-daygrid-day-top .fc-daygrid-day-number:hover {
    color: #000 !important;
  }

  .fc .fc-daygrid-day.fc-day-today {
    background-color: rgba(236, 236, 236, 0.6);
  }

  .fc .fc-daygrid-day-bottom {
    padding: 0;
  }

  .fc .fc-highlight {
    background: #b7eb8f;
  }

  .fc-CustomPrevMonth-button,
  .fc-CustomNextMonth-button {
    padding: 0.25rem !important;
    margin: 0.25rem !important;
  }

  .fc .fc-bg-event {
    opacity: 0.7;
    font-weight: bold;
  }

  .fc-day-sat {
    color: #00c2ff;
  }

  .fc-day-sun {
    color: #c40055;
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

const OccurrenceDate = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const { type, occasionId } = props.match.params
  const calendarRef = useRef()

  const [currentOccasion, setCurrentOccasion] = useState({})
  const [currentOccurrenceDates, setCurrentOccurrenceDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(undefined)
  const [fromDate, setFromDate] = useState(moment().startOf("month"))
  const [toDate, setToDate] = useState(moment().endOf("month"))

  const fetchRegisteredOccasion = useCallback(() => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .get(Commons.apiClientRegistrations)
      .then((registeredResponse) => {
        const rParams = {
          params: {
            from: moment(fromDate).format("YYYY-MM-DD"),
            to: moment(toDate).format("YYYY-MM-DD"),
          },
        }

        Commons.axiosInstance
          .get(`${Commons.apiClientOccasions}/${occasionId}/days`, rParams)
          .then((occurrencesResponse) => {
            if (registeredResponse?.data?.length > 0) {
              setCurrentOccurrenceDates(
                occurrencesResponse?.data?.filter(
                  (od) =>
                    registeredResponse.data.find((ro) =>
                      moment(od).isSame(moment(ro?.startAt), "day")
                    ) === undefined
                ) || []
              )
            } else {
              setCurrentOccurrenceDates(occurrencesResponse?.data || [])
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
    fromDate,
    toDate,
  ])

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

  const dateSelectHandler = () => {
    if (selectedDate) {
      history.push(
        `${Commons.clientOccasionsRoute}/${type}/${occasionId}/${moment(
          selectedDate
        ).format("YYYY-MM-DD")}`
      )
    } else {
      Modal.info({
        title: "確認",
        okText: "確認",
        okButtonProps: { shape: "round" },
        centered: true,
        content: Commons.warnDateNotSelectedMsg,
      })
    }
  }

  useEffect(() => {
    fetchOccasion()

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    fetchRegisteredOccasion()

    // eslint-disable-next-line
  }, [fromDate, toDate])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const socket = io(Commons.siteURL, { path: "/socket.io" })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
          fetchRegisteredOccasion()
        }
      }
    })

    socket.on("updateOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
          fetchRegisteredOccasion()
        }
      }
    })

    socket.on("deleteOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
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

    socket.on("newRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
          fetchRegisteredOccasion()
        }
      }
    })

    socket.on("cancelRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (response.occasionId && response.occasionId + "" === occasionId) {
          fetchOccasion()
          fetchRegisteredOccasion()
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
              current={2}
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
            <p className="text-lg font-bold text-gray-500">検査日選択</p>
            <Divider />
            <CalendarWrapper>
              <FullCalendar
                locale="ja"
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin, momentPlugin]}
                initialView="dayGridMonth"
                height="auto"
                customButtons={{
                  prev: {
                    click: () => {
                      calendarRef.current.getApi().prev()
                      setFromDate(
                        moment(fromDate).subtract(1, "month").startOf("month")
                      )
                      setToDate(
                        moment(toDate).subtract(1, "month").endOf("month")
                      )
                    },
                  },
                  next: {
                    click: () => {
                      calendarRef.current.getApi().next()
                      setFromDate(
                        moment(fromDate).add(1, "month").startOf("month")
                      )
                      setToDate(moment(toDate).add(1, "month").endOf("month"))
                    },
                  },
                }}
                headerToolbar={{
                  left: "prev",
                  center: "title",
                  right: "next",
                }}
                titleFormat={(date) => {
                  return moment(date.date).format("YYYY年M月")
                }}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                  startTime: Commons.BUSINESS_OPEN_TIME,
                  endTime: Commons.BUSINESS_CLOSE_TIME,
                }}
                unselectAuto={false}
                showNonCurrentDates={false}
                fixedWeekCount={false}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  omitZeroMinute: false,
                }}
                dayHeaderFormat={(date) => {
                  return moment(date.date).format("ddd")
                }}
                dayCellContent={(date) =>
                  currentOccurrenceDates.length > 0 &&
                  currentOccurrenceDates.find(
                    (od) =>
                      moment(od).isSame(moment(date.date), "day") &&
                      (currentOccasion?.limitTime
                        ? moment(od)
                            .subtract(currentOccasion?.limitDays ?? 1, "day")
                            .hour(currentOccasion?.limitHours ?? 18)
                            .minute(currentOccasion?.limitMinutes ?? 0)
                            .second(0)
                            .isAfter(moment())
                        : true)
                  ) ? (
                    <>
                      <Row justify="center">
                        <Col>{moment(date.date).format("D")}</Col>
                      </Row>
                      <Row justify="center">
                        <Col>
                          <CustomBadge status="processing" />
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <>
                      <Row justify="center">
                        <Col>{moment(date.date).format("D")}</Col>
                      </Row>
                      <Row justify="center">
                        <Col>-</Col>
                      </Row>
                    </>
                  )
                }
                dateClick={(info) => {
                  if (
                    currentOccurrenceDates.length > 0 &&
                    currentOccurrenceDates.find(
                      (od) =>
                        moment(od).isSame(moment(info.date), "day") &&
                        (currentOccasion?.limitTime
                          ? moment(od)
                              .subtract(currentOccasion?.limitDays ?? 1, "day")
                              .hour(currentOccasion?.limitHours ?? 18)
                              .minute(currentOccasion?.limitMinutes ?? 0)
                              .second(0)
                              .isAfter(moment())
                          : true)
                    )
                  ) {
                    calendarRef.current.getApi().select(info.date)
                    setSelectedDate(
                      currentOccurrenceDates.find((od) =>
                        moment(od).isSame(moment(info.date), "day")
                      )
                    )
                  } else {
                    Modal.info({
                      title: "確認",
                      okText: "確認",
                      centered: true,
                      content: Commons.warnDateNotSelectableMsg,
                    })
                  }
                }}
                slotEventOverlap={false}
                displayEventTime={true}
                displayEventEnd={false}
                nowIndicator={true}
              />
            </CalendarWrapper>
            <div className="mt-4">
              <p className="text-xs">「-」選択できない日</p>
              <p className="text-xs">
                「
                <span>
                  <CustomBadge status="processing" />
                </span>
                」選択可能な日
              </p>
            </div>
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
                  className="px-12"
                  shape="round"
                  onClick={dateSelectHandler}
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

export default withRouter(OccurrenceDate)
