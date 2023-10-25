import React, { useState, useCallback, useEffect, useRef } from "react"
import { withRouter } from "react-router-dom"
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Radio,
  Descriptions,
  Checkbox,
  TimePicker,
} from "antd"
import {
  ClockCircleTwoTone,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  // MinusOutlined,
  StopTwoTone,
  StopOutlined,
  TeamOutlined,
  PlusOutlined,
  // UsergroupDeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LeftOutlined,
  DoubleLeftOutlined,
  RightOutlined,
  DoubleRightOutlined,
  ScheduleOutlined,
  DownloadOutlined,
} from "@ant-design/icons"
import styled from "styled-components"
import Moment from "moment"
import "moment/locale/ja"
import { extendMoment } from "moment-range"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import fileDownload from "js-file-download"
import momentPlugin from "@fullcalendar/moment"
import io from "socket.io-client"
import * as Commons from "common/common"

const moment = extendMoment(Moment)
moment.locale("ja")

const CalendarWrapper = styled.div`
  .fc .fc-button {
    padding: 0;
    background-color: #fff;
    color: #00bcd4;
    border-radius: 0;
    border: 1px solid #00bcd4;
    vertical-align: bottom;
    margin-bottom: 0.5rem;
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
    display: inline-block;
    vertical-align: middle;
    margin-left: 1em;
    margin-right: 1em;
    font-size: 2em;
    font-weight: bold;
    white-space: pre-wrap;
    text-align: center;
    color: #00bcd4;
  }

  .fc .fc-timeline-header-row-chrono .fc-timeline-slot-frame {
    justify-content: center;
  }

  .fc-datagrid-cell-frame {
    background-color: #00b3c4;
    color: white;
    font-weight: bold;
  }

  .fc .fc-resource-timeline-divider {
    width: 0;
  }

  .fc .fc-datagrid-cell-cushion {
    padding-top: 20px;
    padding-bottom: 20px;
    text-align: center;
  }

  .fc .fc-timeline-overlap-enabled .fc-timeline-lane-frame .fc-timeline-events {
    padding-bottom: 0;
  }

  .fc-CustomPrevMonth-button,
  .fc-CustomNextMonth-button,
  .fc-CustomPrevWeek-button,
  .fc-CustomThisWeek-button,
  .fc-CustomNextWeek-button {
    padding: 0.25rem !important;
    margin: 0.25rem !important;
  }

  .fc-day-sat {
    color: #00c2ff;
  }

  .fc-day-sun {
    color: #c40055;
  }

  .fc .fc-bg-event {
    opacity: 0.7;
    font-weight: bold;
  }

  .fc-timegrid-slot {
    height: 2em !important;
    border-bottom: 0 !important;
  }

  .fc .fc-timegrid-col.fc-day-past {
    background-color: rgba(195, 195, 195, 0.2);
  }

  .fc .fc-timegrid-col.fc-day-today {
    background-color: rgba(255, 220, 40, 0.05);
    background-color: var(--fc-today-bg-color, rgba(255, 220, 40, 0.05));
  }

  .fc-timegrid-event {
    border-radius: 0;
  }

  .fc-direction-ltr .fc-timegrid-col-events {
    margin: 0;
  }
`

const StyledProgressBar = styled(Progress)`
  .ant-progress-text {
    white-space: pre;
    color: #595959 !important;
    font-size: 14px;
  }
`

const StyledTable = styled(Table)`
  td {
    word-break: break-all;
  }

  .ant-table-thead > tr > th {
    background-color: #21acd7 !important;
    color: #fff !important;
  }

  .ant-table-thead th.ant-table-column-has-sorters:hover {
    background-color: #46c4e3 !important;
  }
`

const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background-color: #ff7875;
  }

  &.ant-switch-checked:focus {
    -webkit-box-shadow: 0 0 0 2px #fff1f0;
    box-shadow: 0 0 0 2px #fff1f0;
  }
`

const findPercentage = (x, max) => {
  return Math.round((x / max) * 100)
}

const cardGridStyle = {
  width: "100%",
  textAlign: "center",
  color: "#21acd7",
  padding: "16px",
}

const deleteCardGridStyle = {
  width: "100%",
  textAlign: "center",
  color: "#f5222d",
  padding: "16px",
}

const { FormInstance } = Form
const { TextArea } = Input
const { Option } = Select

const OccasionDetail = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const occasionId = parseInt(props.match.params.id)
  const isMountedRef = Commons.useIsMountedRef()
  const occurrenceCreateCalendarRef = useRef()
  const currentOccurrenceRef = useRef()
  const bookingViewFromRef = useRef()
  const bookingViewToRef = useRef()
  const occurrenceCreateForm = useRef(FormInstance)
  const [occurrenceForm] = Form.useForm()
  const [occasionUpdateForm] = Form.useForm()
  const [createParticipationForm] = Form.useForm()
  const [updateParticipationForm] = Form.useForm()
  const [confirmParticipationForm] = Form.useForm()
  const [updateOccurrenceForm] = Form.useForm()
  const [passwordConfirmForm] = Form.useForm()

  const [eventInterval, setEventInterval] = useState(
    Commons.BUSINESS_INTERVAL_TIME_VALUE
  )
  const [eventSubmitLoading, setEventSubmitLoading] = useState(false)
  const [csvDownloadLoading, setCSVDownloadLoading] = useState(false)
  const [participationLoading, setParticipationLoading] = useState(false)
  const [eventUpdateLoading, setEventUpdateLoading] = useState(false)
  const [occurrenceUpdateLoading, setOccurrenceUpdateLoading] = useState(false)
  const [
    occurrenceVisibilityUpdateLoading,
    setOccurrenceVisibilityUpdateLoading,
  ] = useState(false)

  const [occurrenceModalVisible, setOccurrenceModalVisible] = useState(false)
  const [createOccurrenceModalVisible, setCreateOccurrenceModalVisible] =
    useState(false)
  const [createParticipationModalVisible, setCreateParticipationModalVisible] =
    useState(false)
  const [updateParticipationModalVisible, setUpdateParticipationModalVisible] =
    useState(false)
  const [
    confirmParticipationModalVisible,
    setConfirmParticipationModalVisible,
  ] = useState(false)
  const [updateOccurrenceModalVisible, setUpdateOccurrenceModalVisible] =
    useState(false)
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [participantInfoModalVisible, setParticipantInfoModalVisible] =
    useState(false)
  const [passwordConfirmModalVisible, setPasswordConfirmModalVisible] =
    useState(false)

  const [occasion, setOccasion] = useState({})
  const [calendarOccurrences, setCalendarOccurrences] = useState({})
  const [occurrences, setOccurrences] = useState([])
  const [tmpOccurrences, setTmpOccurrences] = useState([])
  const [currentOccurrence, setCurrentOccurrence] = useState({})
  const [currentRegistration, setCurrentRegistration] = useState(undefined)

  const [bookingViewDuration, setBookingViewDuration] = useState("month")
  const [bookingViewFrom, setBookingViewFrom] = useState(
    moment().startOf("month").hours(0).minutes(0).format("YYYY-MM-DD HH:mm")
  )
  const [bookingViewTo, setBookingViewTo] = useState(
    moment().endOf("month").hours(23).minutes(59).format("YYYY-MM-DD HH:mm")
  )

  const showOccurrenceModal = () => {
    setOccurrenceModalVisible(true)
  }

  const hideOccurrenceModal = () => {
    setCurrentOccurrence({})
    setOccurrenceModalVisible(false)
  }

  const showCreateOccurrenceModal = () => {
    fetchCalendarOccurrencesData(
      moment().startOf("week").hours(0).minutes(0).format("YYYY-MM-DD"),
      moment().endOf("week").hours(23).minutes(59).format("YYYY-MM-DD")
    )
  }

  const hideCreateOccurrenceModal = () => {
    setCalendarOccurrences([])
    setCreateOccurrenceModalVisible(false)
  }

  const showCreateParticipationModal = () => {
    setCreateParticipationModalVisible(true)
  }

  const hideCreateParticipationModal = () => {
    setCreateParticipationModalVisible(false)
  }

  const showUpdateParticipationModal = (registration) => {
    setUpdateParticipationModalVisible(true)

    updateParticipationForm.setFieldsValue({
      participationLastName: registration.lastName || "",
      participationFirstName: registration.firstName || "",
      participationTelephone: registration.telephone || "",
      participationId: registration.registrationId || null,
    })
  }

  const hideUpdateParticipationModal = () => {
    setUpdateParticipationModalVisible(false)
  }

  const showConfirmParticipationModal = (registration) => {
    setConfirmParticipationModalVisible(true)

    confirmParticipationForm.setFieldsValue({
      participationLastName: registration.lastName || "",
      participationFirstName: registration.firstName || "",
      participationTelephone: registration.telephone || "",
      participationAttended: registration.attended ? "1" : "0",
      participationId: registration.registrationId || null,
    })
  }

  const hideConfirmParticipationModal = () => {
    setConfirmParticipationModalVisible(false)
  }

  const showUpdateModal = () => {
    occasionUpdateForm.setFieldsValue({
      occasionUpdateName: occasion.title || "",
      occasionUpdateTelephone: occasion.telephone || "",
      occasionUpdateZipPostal: occasion.zipPostal || "",
      occasionUpdateAddress: occasion.address || "",
      occasionUpdateType: occasion.type || undefined,
      occasionUpdateLimitTime: occasion.limitTime ?? false,
      occasionUpdateLimitDay: occasion.limitDays ?? 1,
      occasionUpdateLimitHour: moment(
        `${occasion.limitHours ?? "18"}:${occasion.limitMinutes ?? "00"}`,
        "HH:mm"
      ),
      occasionUpdateCancel: occasion.canCancel || false,
      occasionUpdateCancelTime: occasion.timeCancel || 0,
      occasionUpdateCancelMessage: occasion.textCancel || "",
      occasionUpdateRegisterMessage: occasion.regMessage || "",
      occasionUpdateCancelEmailMessage: occasion.cancelMessage || "",
      occasionUpdateRemindMessage: occasion.remindMessage || "",
      occasionUpdateRemind10Message: occasion.remindMessage1 || "",
    })
    setUpdateModalVisible(true)
  }

  const hideUpdateModal = () => {
    setUpdateModalVisible(false)
  }

  const showUpdateOccurrenceModal = () => {
    setUpdateOccurrenceModalVisible(true)

    updateOccurrenceForm.setFieldsValue({
      occurrenceMaxParticipation: currentOccurrence.maxAttendee || "",
    })
  }

  const hideUpdateOccurrenceModal = () => {
    setUpdateOccurrenceModalVisible(false)
  }

  const showParticipantInfoModal = (registration) => {
    setCurrentRegistration(registration)
    setParticipantInfoModalVisible(true)
  }

  const hideParticipantInfoModal = () => {
    setCurrentRegistration(undefined)
    setParticipantInfoModalVisible(false)
  }

  const showPasswordConfirmModal = () => {
    setPasswordConfirmModalVisible(true)
  }

  const hidePasswordConfirmModal = () => {
    setPasswordConfirmModalVisible(false)
  }

  const handleOccasionDelete = () => {
    Modal.confirm({
      title: "確認",
      icon: <ExclamationCircleOutlined />,
      content: "この会場を削除してもよろしいですか？",
      okText: "削除",
      okType: "danger",
      cancelText: "閉じる",
      centered: true,
      onOk() {
        occasionDelete()
      },
    })
  }

  const handleOccurrenceDelete = () => {
    Modal.confirm({
      title: "確認",
      icon: <ExclamationCircleOutlined />,
      content: "この時間を削除してもよろしいですか？",
      okText: "削除",
      okType: "danger",
      cancelText: "閉じる",
      centered: true,
      onOk() {
        occurrenceDelete()
      },
    })
  }

  const clearOccurrence = () => {
    setTmpOccurrences([])
  }

  const socketCheckOccasion = (response) => {
    if (response.occasionId && response.occasionId === occasionId) {
      return true
    } else {
      return false
    }
  }

  const socketCheckOccurrence = (response) => {
    if (
      currentOccurrenceRef.current.occurrenceId &&
      response.occurrenceId &&
      response.occurrenceId === currentOccurrenceRef.current.occurrenceId
    ) {
      return true
    } else {
      return false
    }
  }

  useEffect(() => {
    bookingViewFromRef.current = bookingViewFrom
    bookingViewToRef.current = bookingViewTo

    fetchOccasionData()

    return () => {
      Modal.destroyAll()
    }

    // eslint-disable-next-line
  }, [bookingViewFrom, bookingViewTo])

  useEffect(() => {
    currentOccurrenceRef.current = currentOccurrence
  }, [currentOccurrence])

  useEffect(() => {
    const socket = io(Commons.siteURL, { path: "/socket.io" })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()
        }
      }
    })

    socket.on("updateOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()

          if (socketCheckOccurrence(response)) {
            handleOccurrenceDetail(response.occurrenceId)
          }
        }
      }
    })

    socket.on("deleteOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()
          hideOccurrenceModal()
        }
      }
    })

    socket.on("deleteEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          history.push(Commons.adminOccasionsRoute)
        }
      }
    })

    socket.on("newRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()

          if (socketCheckOccurrence(response)) {
            handleOccurrenceDetail(response.occurrenceId)
          }
        }
      }
    })

    socket.on("cancelRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()

          if (socketCheckOccurrence(response)) {
            handleOccurrenceDetail(response.occurrenceId)
          }
        }
      }
    })

    socket.on("confirmRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        if (socketCheckOccasion(response)) {
          fetchOccasionData()

          if (socketCheckOccurrence(response)) {
            handleOccurrenceDetail(response.occurrenceId)
          }
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
      socket.off("confirmRegistration")

      socket.disconnect()
    }

    // eslint-disable-next-line
  }, [])

  const fetchOccasionData = useCallback(() => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
    }

    const params = {
      params: {
        from: moment(bookingViewFromRef?.current || bookingViewFrom).format(
          "YYYY-MM-DD"
        ),
        to: moment(bookingViewToRef?.current || bookingViewTo).format(
          "YYYY-MM-DD"
        ),
      },
    }

    Commons.axiosInstance
      .get(Commons.apiOccasions + "/" + occasionId, params)
      .then((response) => {
        if (isMountedRef.current && response) {
          if (response.data) {
            setOccasion(response.data)

            if (response.data.occurrences) {
              // this gives an object with dates as keys
              const groups = response.data.occurrences.reduce(
                (groups, occurrence) => {
                  // const date = moment(occurrence.startAt).format("YYYY/M/D")

                  if (!groups[occurrence.groupDate]) {
                    groups[occurrence.groupDate] = []
                  }

                  groups[occurrence.groupDate].push(occurrence)

                  return groups
                },
                {}
              )

              // Edit: to add it in the array format instead
              const groupArrays = Object.keys(groups).map((date) => {
                return {
                  date,
                  occurrences: groups[date],
                }
              })

              setOccurrences(groupArrays)
            }
          } else {
            setOccasion({})
            setOccurrences([])
          }
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          hideLoadingPageSpin()
        }
      })
  }, [
    isMountedRef,
    occasionId,
    history,
    showLoadingPageSpin,
    hideLoadingPageSpin,
    auth,
    bookingViewFrom,
    bookingViewTo,
  ])

  const fetchCalendarOccurrencesData = useCallback(
    (from, to) => {
      if (isMountedRef.current) {
        showLoadingPageSpin()
      }

      const params = {
        params: {
          from: from,
          to: to,
        },
      }

      Commons.axiosInstance
        .get(Commons.apiOccasions + "/" + occasionId + "/schedule", params)
        .then((response) => {
          if (isMountedRef.current && response) {
            if (response.data) {
              setCalendarOccurrences(response.data)
            } else {
              setCalendarOccurrences([])
            }

            setCreateOccurrenceModalVisible(true)
          }
        })
        .catch((error) => {
          if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            hideLoadingPageSpin()
          }
        })
    },
    [
      isMountedRef,
      occasionId,
      history,
      showLoadingPageSpin,
      hideLoadingPageSpin,
      auth,
    ]
  )

  const handleOccurrenceDetail = (occurrenceId) => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
    }

    Commons.axiosInstance
      .get(Commons.apiOccurrences + "/" + occurrenceId)
      .then((response) => {
        if (isMountedRef.current && response) {
          if (response.data) {
            setCurrentOccurrence(response.data)
            showOccurrenceModal()
          } else {
            setCurrentOccurrence({})
          }
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          hideLoadingPageSpin()
        }
      })
  }

  const occasionDelete = () => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .delete(Commons.apiOccasions + "/" + occasionId)
      .then((response) => {
        if (isMountedRef.current && response) {
          message.success(Commons.successDeleteMsg)
          history.push(Commons.adminOccasionsRoute)
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          hideLoadingPageSpin()
        }
      })
  }

  const handleOccurrenceCreateSubmit = (values) => {
    setEventSubmitLoading(true)

    const postData = {
      occasionId: occasionId,
      occurrences: tmpOccurrences.map((occurrence) => ({
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        maxAttendee: occurrence.maxAttendee,
      })),
    }

    Commons.axiosInstance
      .post(Commons.apiOccurrences, postData)
      .then((response) => {
        if (isMountedRef.current && response) {
          occurrenceForm.resetFields()
          setTmpOccurrences([])
          setEventInterval(Commons.BUSINESS_INTERVAL_TIME_VALUE)

          fetchOccasionData()
          hideCreateOccurrenceModal()

          message.success(Commons.successCreateMsg)
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setEventSubmitLoading(false)
        }
      })
  }

  const occurrenceDelete = () => {
    showLoadingPageSpin()

    Commons.axiosInstance
      .delete(Commons.apiOccurrences + "/" + currentOccurrence.occurrenceId)
      .then((response) => {
        if (isMountedRef.current && response) {
          message.success(Commons.successDeleteMsg)
          fetchOccasionData()
          hideOccurrenceModal()
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          hideLoadingPageSpin()
        }
      })
  }

  const handleUpdateSubmit = (values) => {
    setEventUpdateLoading(true)

    const putData = {
      title: values.occasionUpdateName || "",
      telephone: values.occasionUpdateTelephone || "",
      zipPostal: values.occasionUpdateZipPostal || "",
      address: values.occasionUpdateAddress || "",
      type: values.occasionUpdateType || undefined,
      limitTime: values.occasionUpdateLimitTime ?? false,
      limitDays: values.occasionUpdateLimitTime
        ? values.occasionUpdateLimitDay ?? 1
        : undefined,
      limitHours: values.occasionUpdateLimitTime
        ? moment(values.occasionUpdateLimitHour ?? "18:00", "HH:mm").format(
            "HH"
          )
        : undefined,
      limitMinutes: values.occasionUpdateLimitTime
        ? moment(values.occasionUpdateLimitHour ?? "18:00", "HH:mm").format(
            "mm"
          )
        : undefined,
      canCancel: values.occasionUpdateCancel || false,
      timeCancel: values.occasionUpdateCancel
        ? values.occasionUpdateCancelTime || 15
        : undefined,
      textCancel: values.occasionUpdateCancelMessage || "",
      regMessage: values.occasionUpdateRegisterMessage || "",
      cancelMessage: values.occasionUpdateCancelEmailMessage || "",
      remindMessage: values.occasionUpdateRemindMessage || "",
      remindMessage1: values.occasionUpdateRemind10Message || "",
    }

    Commons.axiosInstance
      .put(Commons.apiOccasions + "/" + occasionId, putData)
      .then((response) => {
        if (isMountedRef.current && response) {
          occasionUpdateForm.resetFields()

          fetchOccasionData()
          hideUpdateModal()

          message.success(Commons.successUpdateMsg)
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setEventUpdateLoading(false)
        }
      })
  }

  const handleParticipationCancel = (registrationId, isLate = undefined) => {
    showLoadingPageSpin()

    const param = {
      data: {
        registrationId: registrationId,
        isLate: isLate,
      },
    }

    Commons.axiosInstance
      .delete(Commons.apiRegistrations + "/cancel", param)
      .then((response) => {
        fetchOccasionData()
        handleOccurrenceDetail(currentOccurrence.occurrenceId)

        if (isLate) {
          message.success(Commons.successUpdateMsg)
        } else {
          message.success(Commons.successCancelMsg)
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          hideLoadingPageSpin()
        }
      })
  }

  const handleParticipationCreateSubmit = (data) => {
    setParticipationLoading(true)

    const postData = {
      lastName: data.participationLastName || "",
      firstName: data.participationFirstName || "",
      telephone: data.participationPhone || "",
      consent1: data.participationAgreement1 || true,
      consent2: data.participationAgreement2 || true,
      occurrenceId: currentOccurrence.occurrenceId,
    }

    Commons.axiosInstance
      .post(Commons.apiRegistrations + "/new", postData)
      .then((response) => {
        hideCreateParticipationModal()
        fetchOccasionData()
        handleOccurrenceDetail(currentOccurrence.occurrenceId)

        message.success(Commons.successCreateMsg)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setParticipationLoading(false)
        }
      })
  }

  const handleParticipationUpdateSubmit = (data) => {
    setParticipationLoading(true)

    const putData = {
      lastName: data.participationLastName || "",
      firstName: data.participationFirstName || "",
      telephone: data.participationTelephone || "",
      consent1: data.participationAgreement1 || true,
      consent2: data.participationAgreement2 || true,
      registrationId: data.participationId,
    }

    Commons.axiosInstance
      .put(Commons.apiRegistrations + "/edit", putData)
      .then((response) => {
        hideUpdateParticipationModal()
        fetchOccasionData()
        handleOccurrenceDetail(currentOccurrence.occurrenceId)

        message.success(Commons.successUpdateMsg)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setParticipationLoading(false)
        }
      })
  }

  const handleParticipationConfirmSubmit = (data) => {
    setParticipationLoading(true)

    const putData = {
      attended: parseInt(data.participationAttended) || 0,
      registrationId: data.participationId,
    }

    Commons.axiosInstance
      .put(Commons.apiRegistrations + "/edit", putData)
      .then((response) => {
        hideConfirmParticipationModal()
        fetchOccasionData()
        handleOccurrenceDetail(currentOccurrence.occurrenceId)

        message.success(Commons.successSaveMsg)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setParticipationLoading(false)
        }
      })
  }

  const handleOccurrenceUpdateSubmit = (data) => {
    if (
      data.occurrenceMaxParticipation &&
      data.occurrenceMaxParticipation > 0
    ) {
      setOccurrenceUpdateLoading(true)

      const putData = {
        maxAttendee: data.occurrenceMaxParticipation || "",
      }

      Commons.axiosInstance
        .put(
          Commons.apiOccurrences + "/" + currentOccurrence.occurrenceId,
          putData
        )
        .then((response) => {
          hideUpdateOccurrenceModal()
          fetchOccasionData()
          handleOccurrenceDetail(currentOccurrence.occurrenceId)

          message.success(Commons.successUpdateMsg)
        })
        .catch((error) => {
          if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
          } else if (error.response.status === 409) {
            message.warning(Commons.warnNotEnoughMaxParticipantMsg)
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setOccurrenceUpdateLoading(false)
          }
        })
    } else {
      message.warning(Commons.warnNotZeroParticipantMsg)
    }
  }

  const handleOccurrenceVisibilityChange = (visibility) => {
    setOccurrenceVisibilityUpdateLoading(true)

    const putData = {
      isDisplayed: visibility,
    }

    Commons.axiosInstance
      .put(
        Commons.apiOccurrences + "/" + currentOccurrence.occurrenceId,
        putData
      )
      .then((response) => {
        fetchOccasionData()
        handleOccurrenceDetail(currentOccurrence.occurrenceId)

        message.success(Commons.successUpdateMsg)
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
        } else if (error.response.status === 409) {
          message.warning(Commons.warnNotEnoughMaxParticipantMsg)
        } else if (error.response.status === 500) {
          message.error(Commons.errorSystemMsg)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setOccurrenceVisibilityUpdateLoading(false)
        }
      })
  }

  const handleDownloadParticipantCSV = (data) => {
    setCSVDownloadLoading(true)

    const postData = {
      password: data.password,
    }

    if (currentOccurrence.occurrenceId) {
      Commons.axiosInstance
        .post(
          Commons.apiOccurrences +
            "/" +
            currentOccurrence.occurrenceId +
            "/csv",
          postData
        )
        .then((response) => {
          setCSVDownloadLoading(false)
          hidePasswordConfirmModal()
          fileDownload(
            "\uFEFF" + response.data,
            `${occasion.title}${
              currentOccurrence.startAt
                ? moment(currentOccurrence.startAt).format(
                    "YYYY年M月D日HH時mm分"
                  )
                : ""
            }の参加者リスト.csv`,
            "text/csv"
          )
        })
        .catch((error) => {
          if (error.response.status === 401) {
            message.warning(Commons.errorPasswordMismatchMsg)
          } else if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setCSVDownloadLoading(false)
          }
        })
    } else {
      Commons.axiosInstance
        .post(Commons.apiOccasions + "/" + occasionId + "/csv", postData)
        .then((response) => {
          setCSVDownloadLoading(false)
          hidePasswordConfirmModal()
          fileDownload(
            "\uFEFF" + response.data,
            `${occasion.title}（${Commons.getTypeByValue(
              occasion.type
            )}）の参加者リスト.csv`,
            "text/csv"
          )
        })
        .catch((error) => {
          if (error.response.status === 401) {
            message.warning(Commons.errorPasswordMismatchMsg)
          } else if (error.response.status === 403) {
            message.warning(Commons.errorSessionMsg)
            history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
          } else if (error.response.status === 500) {
            message.error(Commons.errorSystemMsg)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setCSVDownloadLoading(false)
          }
        })
    }
  }

  const showOccurrenceHandler = () => {
    handleOccurrenceVisibilityChange(true)
  }
  const hideOccurrenceHandler = () => {
    handleOccurrenceVisibilityChange(false)
  }

  const postalSearchHandler = () => {
    const postalCode = occasionUpdateForm.getFieldValue(
      "occasionUpdateZipPostal"
    )

    if (postalCode.length === 7) {
      Commons.getAddressByZipCode(postalCode).then((text) => {
        const matcher = text.match(/({".*"]})/)

        if (matcher) {
          const json = JSON.parse(matcher[0])
          const address = json[postalCode]
          if (address && address[0] && address[1]) {
            const index = address[0] - 1

            occasionUpdateForm.setFieldsValue({
              occasionUpdateAddress: `${Commons.PREFECTURES[index]["label"]}${address[1]}${address[2]}`,
            })
          } else {
            message.warn(Commons.warnWrongPostalMsg)
          }
        }
      })
    }
  }

  const styleExpected = {
    border: "1px solid #21acd7",
    color: "#21acd7",
    backgroundColor: "#f0feff",
    marginRight: 0,
  }

  const styleAttended = {
    border: "1px solid #52c41a",
    color: "#52c41a",
    backgroundColor: "#f6ffed",
    marginRight: 0,
  }

  const checkRegistrationStyle = (registration) => {
    if ((registration?.attended || 0) === 0) {
      return styleExpected
    } else {
      return styleAttended
    }
  }

  const columns = [
    {
      title: "氏名",
      dataIndex: "fullName",
      align: "center",
      render: (registration) =>
        `${registration?.lastName || "ー"} ${registration?.firstName || "ー"}`,
    },
    {
      title: "電話番号",
      dataIndex: "telephone",
      align: "center",
    },
    {
      title: "登録元",
      dataIndex: "source",
      align: "center",
      render: (registration) => (
        <>
          <Tag style={{ marginRight: 0 }}>
            {registration?.isManual === 1 ? "システム" : "ユーザー"}
          </Tag>
        </>
      ),
    },
    {
      title: "参加状況",
      dataIndex: "attended",
      align: "center",
      render: (registration) => (
        <>
          <Tag style={checkRegistrationStyle(registration)}>
            {registration?.attended > 0 ? "参加済み" : "予約済み"}
          </Tag>
        </>
      ),
    },
    {
      title: "",
      dataIndex: "action",
      align: "center",
      render: (registration) => (
        <>
          <Tooltip title="情報">
            <Button
              style={{ margin: "0.25rem" }}
              icon={<EyeOutlined />}
              onClick={() => showParticipantInfoModal(registration)}
              disabled={registration && registration?.isManual === 1}
            />
          </Tooltip>
          <Tooltip title="参加">
            <Button
              style={{ margin: "0.25rem" }}
              icon={<TeamOutlined />}
              onClick={() => showConfirmParticipationModal(registration)}
            />
          </Tooltip>
          <Tooltip title="予約変更">
            <Button
              style={{ margin: "0.25rem" }}
              icon={<EditOutlined />}
              onClick={() => showUpdateParticipationModal(registration)}
              disabled={registration && registration?.isManual === 0}
            />
          </Tooltip>

          {/* <Popconfirm
                title="予約を不参加にしてもよろしいでしょうか？"
                onConfirm={() =>
                  handleParticipationCancel(registration.registrationId, true)
                }
                okText="不参加"
                cancelText="閉じる"
                okType="danger"
                icon={<QuestionCircleOutlined style={{ color: "red" }} />}
              >
                <Tooltip title="不参加">
                  <Button
                    style={{ margin: "0.25rem" }}
                    icon={<UsergroupDeleteOutlined />}
                    danger
                  />
                </Tooltip>
              </Popconfirm> */}
          <Popconfirm
            title="予約をキャンセルしてもよろしいでしょうか？"
            onConfirm={() =>
              handleParticipationCancel(registration.registrationId)
            }
            okText="予約をキャンセル"
            cancelText="閉じる"
            okType="danger"
            disabled={registration && registration?.attended > 0}
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Tooltip title="予約をキャンセル">
              <Button
                style={{ margin: "0.25rem" }}
                icon={<StopOutlined />}
                disabled={registration && registration?.attended > 0}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </>
      ),
    },
  ]

  return (
    <>
      <Card
        title={`予約管理`}
        bordered={false}
        extra={
          <Button
            className="m-1"
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={showCreateOccurrenceModal}
          >
            予約時間設定
          </Button>
        }
      >
        <Row>
          <Col xl={8} lg={12} xs={24} className="border-r border-gray-200 p-4">
            <Row justify="end" className="mb-2">
              <Col>
                <Button icon={<EditOutlined />} onClick={showUpdateModal}>
                  会場情報変更
                </Button>
              </Col>
            </Row>
            <Descriptions
              column={1}
              layout="vertical"
              className="mb-8"
              bordered
            >
              <Descriptions.Item label="会場名">
                <p className="text-sm font-bold text-center">
                  {occasion.title || "ー"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="電話番号">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.telephone || "ー"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="住所">
                <p className="text-sm text-center whitespace-pre-wrap">
                  〒
                  {occasion.zipPostal
                    ? Commons.insertCharacter(occasion.zipPostal, 3, "-")
                    : "ー"}{" "}
                  {occasion.address || "ー"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="検査タイプ">
                <p className="text-sm text-center whitespace-pre-wrap">
                  <Tag color="#21acd7">
                    {Commons.getTypeByValue(occasion.type)}
                  </Tag>
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="予約時間制限">
                <div className="text-center">
                  <Tag
                    className="text-center whitespace-pre-wrap m-1"
                    style={{
                      backgroundColor: occasion.limitTime
                        ? "#fff2e8"
                        : "#f6ffed",
                      color: occasion.limitTime ? "#fa541c" : "#52c41a",
                      border: occasion.limitTime
                        ? "1px solid #fa541c"
                        : "1px solid #52c41a",
                    }}
                  >
                    {occasion.limitTime
                      ? "予約時間制限\nある"
                      : "予約時間制限\nない"}
                  </Tag>
                  {occasion.limitTime ? (
                    <Tag
                      icon={<ClockCircleOutlined />}
                      className="text-center whitespace-pre-wrap m-1"
                      style={{
                        backgroundColor: "#fff2e8",
                        color: "#fa541c",
                        border: "1px solid #fa541c",
                      }}
                    >
                      {occasion.limitDays > 0
                        ? `${occasion.limitDays}日前`
                        : ""}
                      {`${occasion.limitHours}時${occasion.limitMinutes}分まで\n予約可能`}
                    </Tag>
                  ) : (
                    ""
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="キャンセル">
                <div className="text-center">
                  <Tag
                    className="text-center whitespace-pre-wrap m-1"
                    style={{
                      backgroundColor: occasion.canCancel
                        ? "#f6ffed"
                        : "#fff2e8",
                      color: occasion.canCancel ? "#52c41a" : "#fa541c",
                      border: occasion.canCancel
                        ? "1px solid #52c41a"
                        : "1px solid #fa541c",
                    }}
                  >
                    {occasion.canCancel
                      ? "キャンセル\n可能"
                      : "キャンセル\n不可能"}
                  </Tag>
                  {occasion.canCancel ? (
                    <Tag
                      icon={<ClockCircleOutlined />}
                      className="text-center whitespace-pre-wrap m-1"
                      style={{
                        backgroundColor: "#f6ffed",
                        color: "#52c41a",
                        border: "1px solid #52c41a",
                      }}
                    >
                      {`キャンセル\n可能時間：${occasion.timeCancel || 0}分`}
                    </Tag>
                  ) : (
                    ""
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="キャンセルに関する説明文">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.textCancel || "メッセージが設定されていないです。"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="予約すると送るメッセージ">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.regMessage || "メッセージが設定されていないです。"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="予約をキャンセルすると送るメッセージ">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.cancelMessage ||
                    "メッセージが設定されていないです。"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="リマインドメッセージ（予約より3日前に届く）">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.remindMessage ||
                    "メッセージが設定されていないです。"}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="リマインドメッセージ（予約より1日前に届く）">
                <p className="text-sm text-center whitespace-pre-wrap">
                  {occasion.remindMessage1 ||
                    "メッセージが設定されていないです。"}
                </p>
              </Descriptions.Item>
            </Descriptions>
            <Row>
              <Col span={24}>
                <Row justify="center" gutter={[24, 24]}>
                  <Col span={24}>
                    <Row gutter={[16, 0]} justify="center">
                      <Col>
                        <Tooltip title="(予約人数/参加可能最大人数)*100">
                          <StyledProgressBar
                            type="dashboard"
                            strokeColor="#9ff0fc"
                            percent={findPercentage(
                              occasion.sumExpected || 0,
                              occasion.maxCapacity || 0
                            )}
                            format={(percent) =>
                              `予約率\u000A\u000A${percent}%`
                            }
                          />
                        </Tooltip>
                      </Col>
                      <Col>
                        <Tooltip title="(参加者数/予約人数)*100">
                          <StyledProgressBar
                            type="dashboard"
                            strokeColor="#b7eb8f"
                            percent={findPercentage(
                              occasion.sumAttended || 0,
                              occasion.sumExpected || 0
                            )}
                            format={(percent) =>
                              `参加者率\u000A\u000A${percent}%`
                            }
                          />
                        </Tooltip>
                      </Col>
                    </Row>
                  </Col>
                  <Col>
                    <Row>
                      <Col
                        span={12}
                        style={{
                          backgroundColor: Commons.checkIsEventFull(
                            occasion.maxCapacity || 0,
                            occasion.sumExpected || 0
                          )
                            ? "#7cc7d6"
                            : "#c9faff",
                          color: Commons.checkIsEventFull(
                            occasion.maxCapacity || 0,
                            occasion.sumExpected || 0
                          )
                            ? "#FFF"
                            : "#1286b0",
                          border: "1px solid #1286b0",
                        }}
                        className="border-b-0"
                      >
                        <Row>
                          <Col span={24} className="text-center">
                            <span>予約人数</span>
                          </Col>
                          <Col span={24} className="text-center">
                            <span className="text-xl font-bold">
                              {occasion.sumExpected || 0}
                            </span>
                            <span>人</span>
                          </Col>
                        </Row>
                      </Col>
                      <Col
                        span={12}
                        style={{
                          backgroundColor: Commons.checkIsEventFull(
                            occasion.sumExpected || 0,
                            occasion.sumAttended || 0
                          )
                            ? "#91c46e"
                            : "#FFF",
                          color: Commons.checkIsEventFull(
                            occasion.sumExpected || 0,
                            occasion.sumAttended || 0
                          )
                            ? "#FFF"
                            : "#389e0d",
                          border: "1px solid #1286b0",
                        }}
                        className="border-b-0 border-l-0"
                      >
                        <Row>
                          <Col span={24} className="text-center">
                            <span>参加者数</span>
                          </Col>
                          <Col span={24} className="text-center">
                            <span className="text-xl font-bold">
                              {occasion.sumAttended || 0}
                            </span>
                            <span>人</span>
                          </Col>
                        </Row>
                      </Col>
                      <Col
                        span={24}
                        style={{
                          backgroundColor: "#c9faff",
                          color: "#1286b0",
                          border: "1px solid #1286b0",
                        }}
                      >
                        <Row>
                          <Col span={24} className="text-center">
                            <span>参加可能最大人数</span>
                          </Col>
                          <Col span={24} className="text-center">
                            <span className="text-xl font-bold">
                              {occasion.maxCapacity || 0}
                            </span>
                            <span>人</span>
                          </Col>
                        </Row>
                      </Col>
                      <Divider />
                      <Col span={24}>
                        <Row justify="center">
                          <Col>
                            <Button
                              icon={<DownloadOutlined />}
                              loading={csvDownloadLoading}
                              onClick={showPasswordConfirmModal}
                            >
                              会場参加者CSV
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col xl={16} lg={12} xs={24} className="p-4">
            <Row className="mb-2" justify="end" align="middle">
              <Col>表示期間：</Col>
              <Col>
                <Select
                  onChange={(value) => {
                    setBookingViewDuration(value)

                    if (value === "week") {
                      setBookingViewFrom(
                        moment()
                          .startOf("week")
                          .hours(0)
                          .minutes(0)
                          .format("YYYY-MM-DD HH:mm")
                      )
                      setBookingViewTo(
                        moment()
                          .endOf("week")
                          .hours(23)
                          .minutes(59)
                          .format("YYYY-MM-DD HH:mm")
                      )
                    } else if (value === "month") {
                      setBookingViewFrom(
                        moment()
                          .startOf("month")
                          .hours(0)
                          .minutes(0)
                          .format("YYYY-MM-DD HH:mm")
                      )
                      setBookingViewTo(
                        moment()
                          .endOf("month")
                          .hours(23)
                          .minutes(59)
                          .format("YYYY-MM-DD HH:mm")
                      )
                    }
                  }}
                  value={bookingViewDuration}
                  size="large"
                >
                  <Option value="week">週次</Option>
                  <Option value="month">月次</Option>
                </Select>
              </Col>
            </Row>
            <Row
              justify="center"
              align="middle"
              gutter={[8, 8]}
              className="mb-8"
            >
              <Col>
                <Row className="mb-2" justify="center">
                  <Col>
                    <Tag
                      className="text-center whitespace-pre-wrap m-1 p-3"
                      style={{
                        backgroundColor: "#f0feff",
                        color: "#21acd7",
                        border: "1px solid #21acd7",
                        fontSize: "1em",
                        fontWeight: "bold",
                      }}
                    >
                      {moment(bookingViewFrom).format("YYYY年M月D日")}～
                      {moment(bookingViewTo).format("YYYY年M月D日")}
                    </Tag>
                  </Col>
                </Row>
                <Row justify="center" gutter={[8, 8]}>
                  {bookingViewDuration === "week" ? (
                    <>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .subtract(14, "days")
                                .startOf("week")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .subtract(14, "days")
                                .endOf("week")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <DoubleLeftOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .subtract(7, "days")
                                .startOf("week")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .subtract(7, "days")
                                .endOf("week")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <LeftOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment()
                                .startOf("week")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment()
                                .endOf("week")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          今週
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .add(7, "days")
                                .startOf("week")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .add(7, "days")
                                .endOf("week")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <RightOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .add(14, "days")
                                .startOf("week")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .add(14, "days")
                                .endOf("week")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <DoubleRightOutlined />
                        </Button>
                      </Col>
                    </>
                  ) : (
                    <>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .subtract(2, "month")
                                .startOf("month")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .subtract(2, "month")
                                .endOf("month")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <DoubleLeftOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .subtract(1, "month")
                                .startOf("month")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .subtract(1, "month")
                                .endOf("month")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <LeftOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment()
                                .startOf("month")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment()
                                .endOf("month")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          今月
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .add(1, "month")
                                .startOf("month")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .add(1, "month")
                                .endOf("month")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <RightOutlined />
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setBookingViewFrom(
                              moment(bookingViewFrom)
                                .add(2, "month")
                                .startOf("month")
                                .hours(0)
                                .minutes(0)
                                .format("YYYY-MM-DD HH:mm")
                            )
                            setBookingViewTo(
                              moment(bookingViewTo)
                                .add(2, "month")
                                .endOf("month")
                                .hours(23)
                                .minutes(59)
                                .format("YYYY-MM-DD HH:mm")
                            )
                          }}
                          type="dashed"
                        >
                          <DoubleRightOutlined />
                        </Button>
                      </Col>
                    </>
                  )}
                </Row>
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col span={24}>
                {occurrences.length > 0
                  ? occurrences.map((group) => (
                      <div key={group.date}>
                        <Row>
                          <Col span={24} className="mb-2 text-right">
                            <span
                              className={`font-bold text-xl ${
                                moment(group.date).isSameOrAfter(
                                  moment(),
                                  "day"
                                )
                                  ? ""
                                  : "text-gray-500"
                              }`}
                            >
                              {moment(group.date).format("YYYY年M月D日 (ddd)")}
                            </span>
                          </Col>
                          <Col span={24}>
                            <Row gutter={[8, 8]} justify="end">
                              {group.occurrences.map((occurrence) => (
                                <Col
                                  xxl={6}
                                  xl={8}
                                  sm={12}
                                  xs={24}
                                  key={occurrence.occurrenceId}
                                >
                                  <Card
                                    hoverable
                                    bordered={false}
                                    bodyStyle={{
                                      padding: 0,
                                      opacity: moment(group.date).isSameOrAfter(
                                        moment(),
                                        "day"
                                      )
                                        ? 1
                                        : 0.6,
                                    }}
                                    onClick={() =>
                                      handleOccurrenceDetail(
                                        occurrence.occurrenceId
                                      )
                                    }
                                  >
                                    <Row>
                                      <Col
                                        span={24}
                                        style={{
                                          backgroundColor:
                                            occurrence.isDisplayed
                                              ? "#f0feff"
                                              : "#ffffff",
                                          color: occurrence.isDisplayed
                                            ? "#21acd7"
                                            : "#bfbfbf",
                                          border: `1px solid ${
                                            occurrence.isDisplayed
                                              ? "#21acd7"
                                              : "#bfbfbf"
                                          }`,
                                          textAlign: "end",
                                          padding: "0.25rem",
                                        }}
                                        className="border-b-0"
                                      >
                                        <span className="font-bold">
                                          {occurrence.startAt
                                            ? moment(occurrence.startAt).format(
                                                "HH:mm"
                                              )
                                            : "ー：ー"}
                                        </span>
                                      </Col>
                                    </Row>
                                    <Row>
                                      <Col
                                        span={12}
                                        style={{
                                          backgroundColor:
                                            occurrence.isDisplayed
                                              ? Commons.checkIsEventFull(
                                                  occurrence.maxAttendee || 0,
                                                  occurrence.sumExpected || 0
                                                )
                                                ? "#7cc7d6"
                                                : "#f0feff"
                                              : "#ffffff",
                                          color: occurrence.isDisplayed
                                            ? Commons.checkIsEventFull(
                                                occurrence.maxAttendee || 0,
                                                occurrence.sumExpected || 0
                                              )
                                              ? "#FFF"
                                              : "#21acd7"
                                            : "#bfbfbf",
                                          border: `1px solid ${
                                            occurrence.isDisplayed
                                              ? "#21acd7"
                                              : "#bfbfbf"
                                          }`,
                                        }}
                                        className="border-b-0"
                                      >
                                        <Row>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span>予約人数</span>
                                          </Col>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span className="text-xl font-bold">
                                              {occurrence.sumExpected || 0}
                                            </span>
                                            <span>人</span>
                                          </Col>
                                        </Row>
                                      </Col>
                                      <Col
                                        span={12}
                                        style={{
                                          backgroundColor:
                                            occurrence.isDisplayed
                                              ? Commons.checkIsEventFull(
                                                  occurrence.sumExpected || 0,
                                                  occurrence.sumAttended || 0
                                                )
                                                ? "#91c46e"
                                                : "#fff"
                                              : "#ffffff",
                                          color: occurrence.isDisplayed
                                            ? Commons.checkIsEventFull(
                                                occurrence.sumExpected || 0,
                                                occurrence.sumAttended || 0
                                              )
                                              ? "#FFF"
                                              : "#52c41a"
                                            : "#bfbfbf",
                                          border: `1px solid ${
                                            occurrence.isDisplayed
                                              ? "#21acd7"
                                              : "#bfbfbf"
                                          }`,
                                        }}
                                        className="border-b-0 border-l-0"
                                      >
                                        <Row>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span>参加者数</span>
                                          </Col>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span className="text-xl font-bold">
                                              {occurrence.sumAttended || 0}
                                            </span>
                                            <span>人</span>
                                          </Col>
                                        </Row>
                                      </Col>
                                      <Col
                                        span={24}
                                        style={{
                                          backgroundColor:
                                            occurrence.isDisplayed
                                              ? "#f0feff"
                                              : "#ffffff",
                                          color: occurrence.isDisplayed
                                            ? "#21acd7"
                                            : "#bfbfbf",
                                          border: `1px solid ${
                                            occurrence.isDisplayed
                                              ? "#21acd7"
                                              : "#bfbfbf"
                                          }`,
                                        }}
                                      >
                                        <Row>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span>参加可能最大人数</span>
                                          </Col>
                                          <Col
                                            span={24}
                                            className="text-center"
                                          >
                                            <span className="text-xl font-bold">
                                              {occurrence.maxAttendee || 0}
                                            </span>
                                            <span>人</span>
                                          </Col>
                                        </Row>
                                      </Col>
                                    </Row>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </Col>
                          <Divider />
                        </Row>
                      </div>
                    ))
                  : ""}
              </Col>
            </Row>
          </Col>
          <Divider />
          <Col span={24} className="px-4 pb-4 pt-2">
            <Row justify="center">
              <Col>
                <Button
                  onClick={handleOccasionDelete}
                  icon={<DeleteOutlined />}
                  danger
                >
                  会場削除
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      <Modal
        visible={updateModalVisible}
        title="会場情報変更"
        onCancel={hideUpdateModal}
        footer={null}
        centered
      >
        <div className="p-2">
          <Form
            form={occasionUpdateForm}
            layout="vertical"
            initialValues={{
              occasionUpdateName: "",
              occasionUpdateTelephone: "",
              occasionUpdateZipPostal: "",
              occasionUpdateAddress: "",
              occasionUpdateType: undefined,
              occasionUpdateLimitTime: false,
              occasionUpdateLimitDay: 1,
              occasionUpdateLimitHour: moment("18:00", "HH:mm"),
              occasionUpdateCancel: false,
              occasionUpdateCancelTime: 15,
              occasionUpdateCancelMessage: "",
              occasionUpdateRegisterMessage: "",
              occasionUpdateCancelEmailMessage: "",
              occasionUpdateRemindMessage: "",
              occasionUpdateRemind10Message: "",
            }}
            onFinish={handleUpdateSubmit}
            requiredMark={true}
            scrollToFirstError
          >
            <>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateName"
                    label="会場名"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                    ]}
                  >
                    <Input placeholder="例：１０９シネマズ名古屋" allowClear />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateTelephone"
                    label="電話番号"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                    ]}
                  >
                    <TextArea placeholder="例：0570-052-109" autoSize />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateZipPostal"
                    label="郵便番号"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                      {
                        len: 7,
                        message: "",
                      },
                    ]}
                  >
                    <Commons.NumericInput
                      placeholder="例：4530872"
                      maxLength={7}
                      allowClear
                      onPressEnter={(e) => {
                        e.preventDefault()
                        postalSearchHandler()
                      }}
                      onChange={(e) => {
                        postalSearchHandler()
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateAddress"
                    label="住所"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                    ]}
                  >
                    <TextArea
                      placeholder="例：愛知県名古屋市中村区平池町４－６０－１４　マーケットスクエアささしま２Ｆ"
                      autoSize
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateType"
                    label="検査タイプ"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                    ]}
                  >
                    <Select placeholder="会場の検査タイプを選択してください">
                      {Commons.OCCASION_TYPES.map((ot) => (
                        <Option key={ot.value} value={ot.value}>
                          {ot.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateLimitTime"
                    label="予約時間制限"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                      return (
                        prevValues.occasionUpdateLimitTime !==
                        currentValues.occasionUpdateLimitTime
                      )
                    }}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("occasionUpdateLimitTime") ? (
                        <>
                          <Form.Item
                            name="occasionUpdateLimitDay"
                            label="日数（予約より何日前まで予約可能）"
                            rules={[
                              {
                                required: true,
                                message: "必須です",
                              },
                            ]}
                          >
                            <InputNumber
                              placeholder="例：1"
                              addonBefore="予約より"
                              addonAfter="日前"
                              min={0}
                              type="number"
                              onPressEnter={(e) => {
                                e.preventDefault()
                              }}
                            />
                          </Form.Item>
                          <Form.Item
                            name="occasionUpdateLimitHour"
                            label="時間（何時何分まで予約可能）"
                            rules={[
                              {
                                required: true,
                                message: "必須です",
                              },
                            ]}
                          >
                            <TimePicker
                              placeholder="時間"
                              popupClassName="hide-timepicker-footer"
                              format="HH:mm"
                              inputReadOnly
                              showNow={false}
                              hideDisabledOptions={true}
                              minuteStep={5}
                              onSelect={(time) => {
                                occasionUpdateForm.setFieldsValue({
                                  occasionUpdateLimitHour: time,
                                })
                              }}
                            />
                          </Form.Item>
                        </>
                      ) : (
                        ""
                      )
                    }
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateCancel"
                    label="キャンセル機能"
                    valuePropName="checked"
                  >
                    <StyledSwitch />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                      return (
                        prevValues.occasionUpdateCancel !==
                        currentValues.occasionUpdateCancel
                      )
                    }}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("occasionUpdateCancel") ? (
                        <Form.Item
                          name="occasionUpdateCancelTime"
                          label="キャンセル可能時間（予約より何分前）"
                          rules={[
                            {
                              required: true,
                              message: "必須です",
                            },
                          ]}
                        >
                          <InputNumber
                            placeholder="キャンセル可能時間"
                            min={1}
                            type="number"
                            onPressEnter={(e) => {
                              e.preventDefault()
                            }}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      ) : (
                        ""
                      )
                    }
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateCancelMessage"
                    label="キャンセルに関する説明文"
                    rules={[
                      {
                        required: true,
                        message: "必須です",
                      },
                      {
                        whitespace: true,
                        message: "必須です",
                      },
                    ]}
                  >
                    <TextArea
                      placeholder="例：下にある予約キャンセルボタンを押して予約をキャンセルできます"
                      autoSize
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Alert
                    message="キャンセルに関する説明文をONとOFFに合わせて内容を変更してください"
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateRegisterMessage"
                    label="予約すると送るメッセージ"
                    className="whitespace-pre-wrap"
                    help={`※設定されていない場合は、メールでメッセージが送信されません。\n※メッセージに[DATE]を入力すると、予約日時に変換されます。\n※メッセージに[NAME]を入力すると、予約者の名前に変換されます。`}
                    style={{ marginBottom: 0 }}
                  >
                    <TextArea
                      placeholder={`例：[NAME]様\nご利用ありがとうございます。\n予約完了になりました。\n検査の当日[DATE]にQRコードをスタッフに見せてください。\n\nリンク：${Commons.siteURL}`}
                      autoSize
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateCancelEmailMessage"
                    label="予約をキャンセルすると送るメッセージ"
                    className="whitespace-pre-wrap"
                    help={`※設定されていない場合は、メールでメッセージが送信されません。\n※メッセージに[DATE]を入力すると、予約日時に変換されます。\n※メッセージに[NAME]を入力すると、予約者の名前に変換されます。`}
                    style={{ marginBottom: 0 }}
                  >
                    <TextArea
                      placeholder={`例：[NAME]様\n[DATE]に予約がキャンセルされました。\nご利用ありがとうございます。改めてご予約の場合は下記のリンクをを押してください。\n\nリンク：${Commons.siteURL}`}
                      autoSize
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateRemindMessage"
                    label="リマインドメッセージ（予約より3日前に届く）"
                    className="whitespace-pre-wrap"
                    help={`※設定されていない場合は、メールでメッセージが送信されません。\n※メッセージに[DATE]を入力すると、予約日時に変換されます。\n※メッセージに[NAME]を入力すると、予約者の名前に変換されます。\n※3日過ぎた後の予約は直ぐに届きます。`}
                    style={{ marginBottom: 0 }}
                  >
                    <TextArea
                      placeholder={`例：[NAME]様\nPCR検査のリマインダーです。\nご予約[DATE]まではあと3日です。\n\nリンク：${Commons.siteURL}`}
                      autoSize
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="occasionUpdateRemind10Message"
                    label="リマインドメッセージ（予約より1日前に届く）"
                    className="whitespace-pre-wrap"
                    help={`※設定されていない場合は、メールでメッセージが送信されません。\n※メッセージに[DATE]を入力すると、予約日時に変換されます。\n※メッセージに[NAME]を入力すると、予約者の名前に変換されます。`}
                    style={{ marginBottom: 0 }}
                  >
                    <TextArea
                      placeholder={`例：[NAME]様\nPCR検査のリマインダーです。\nももなく[DATE]に検査が行います。QRコードをスタッフに見せてください。\n\nリンク：${Commons.siteURL}`}
                      autoSize
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row justify="center">
                <Col>
                  <Button
                    type="primary"
                    htmlType="submit"
                    key="ok"
                    loading={eventUpdateLoading}
                  >
                    変更
                  </Button>
                </Col>
              </Row>
            </>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={occurrenceModalVisible}
        title="予約詳細"
        onCancel={hideOccurrenceModal}
        footer={null}
        width={720}
        centered
      >
        <Row gutter={[0, 16]} justify="center">
          <Col span={24}>
            <Row className="mb-4" justify="center">
              <Col>
                {currentOccurrence.isDisplayed ? (
                  <Tag
                    icon={<EyeOutlined />}
                    className="p-2"
                    style={{
                      backgroundColor: "#f6ffed",
                      color: "#52c41a",
                      border: "1px solid #52c41a",
                      fontSize: "1em",
                    }}
                  >
                    表示中
                  </Tag>
                ) : (
                  <Tag
                    icon={<EyeInvisibleOutlined />}
                    className="p-2"
                    style={{
                      backgroundColor: "#fff2e8",
                      color: "#fa541c",
                      border: "1px solid #fa541c",
                      fontSize: "1em",
                    }}
                  >
                    非表示中
                  </Tag>
                )}
              </Col>
            </Row>
            <Row justify="space-between">
              <Col>
                {currentOccurrence.isDisplayed ? (
                  <Button
                    icon={<EyeInvisibleOutlined />}
                    onClick={hideOccurrenceHandler}
                    loading={occurrenceVisibilityUpdateLoading}
                    className="mb-1"
                    danger
                  >
                    この時間を非表示にする
                  </Button>
                ) : (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={showOccurrenceHandler}
                    loading={occurrenceVisibilityUpdateLoading}
                    className="mb-1"
                  >
                    この時間を表示する
                  </Button>
                )}
              </Col>
              <Col>
                <Button
                  onClick={showUpdateOccurrenceModal}
                  className="mb-1"
                  icon={<EditOutlined />}
                >
                  参加可能最大人数変更
                </Button>
              </Col>
            </Row>
            <Row>
              <Col
                span={24}
                style={{
                  backgroundColor: currentOccurrence.isDisplayed
                    ? "#f0feff"
                    : "#ffffff",
                  color: currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf",
                  border: `1px solid ${
                    currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf"
                  }`,
                  textAlign: "end",
                  padding: "0.5rem",
                }}
                className="border-b-0"
              >
                <Row justify="center" gutter={[8, 0]}>
                  <Col>
                    <span className="font-bold">
                      {moment(currentOccurrence.startAt).format("YYYY年M月D日")}
                    </span>
                  </Col>
                  <Col>
                    <span className="font-bold">
                      {moment(currentOccurrence.startAt).format("HH:mm")}
                    </span>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col
                span={12}
                style={{
                  backgroundColor: currentOccurrence.isDisplayed
                    ? Commons.checkIsEventFull(
                        currentOccurrence.maxAttendee || 0,
                        currentOccurrence.sumExpected || 0
                      )
                      ? "#7cc7d6"
                      : "#f0feff"
                    : "#ffffff",
                  color: currentOccurrence.isDisplayed
                    ? Commons.checkIsEventFull(
                        currentOccurrence.maxAttendee || 0,
                        currentOccurrence.sumExpected || 0
                      )
                      ? "#FFF"
                      : "#21acd7"
                    : "#bfbfbf",
                  border: `1px solid ${
                    currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf"
                  }`,
                }}
                className="border-b-0"
              >
                <Row>
                  <Col span={24} className="text-center">
                    <span>予約人数</span>
                  </Col>
                  <Col span={24} className="text-center">
                    <span className="text-xl font-bold">
                      {currentOccurrence.sumExpected || 0}
                    </span>
                    <span>人</span>
                  </Col>
                </Row>
              </Col>
              <Col
                span={12}
                style={{
                  backgroundColor: currentOccurrence.isDisplayed
                    ? Commons.checkIsEventFull(
                        currentOccurrence.sumExpected || 0,
                        currentOccurrence.sumAttended || 0
                      )
                      ? "#91c46e"
                      : "#fff"
                    : "#ffffff",
                  color: currentOccurrence.isDisplayed
                    ? Commons.checkIsEventFull(
                        currentOccurrence.sumExpected || 0,
                        currentOccurrence.sumAttended || 0
                      )
                      ? "#FFF"
                      : "#52c41a"
                    : "#bfbfbf",
                  border: `1px solid ${
                    currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf"
                  }`,
                }}
                className="border-b-0 border-l-0"
              >
                <Row>
                  <Col span={24} className="text-center">
                    <span>参加者数</span>
                  </Col>
                  <Col span={24} className="text-center">
                    <span className="text-xl font-bold">
                      {currentOccurrence.sumAttended || 0}
                    </span>
                    <span>人</span>
                  </Col>
                </Row>
              </Col>
              <Col
                span={24}
                style={{
                  backgroundColor: currentOccurrence.isDisplayed
                    ? "#f0feff"
                    : "#ffffff",
                  color: currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf",
                  border: `1px solid ${
                    currentOccurrence.isDisplayed ? "#21acd7" : "#bfbfbf"
                  }`,
                }}
              >
                <Row>
                  <Col span={24} className="text-center">
                    <span>参加可能最大人数</span>
                  </Col>
                  <Col span={24} className="text-center">
                    <span className="text-xl font-bold">
                      {currentOccurrence.maxAttendee || 0}
                    </span>
                    <span>人</span>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col className="w-full">
            <Row justify="end">
              <Col>
                <Button
                  onClick={showCreateParticipationModal}
                  className="mb-1"
                  icon={<PlusOutlined />}
                >
                  新規予約
                </Button>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={24}>
                {currentOccurrence.isDisplayed ? (
                  <StyledTable
                    columns={columns}
                    dataSource={
                      currentOccurrence.registrations
                        ? currentOccurrence.registrations.map(
                            (registration) => {
                              return {
                                key: registration.registrationId,
                                fullName: registration,
                                telephone: registration.telephone,
                                attended: registration,
                                source: registration,
                                action: registration,
                              }
                            }
                          )
                        : []
                    }
                    bordered={true}
                    size="small"
                    scroll={{ x: "max-content" }}
                  />
                ) : (
                  <Table
                    columns={columns}
                    dataSource={
                      currentOccurrence.registrations
                        ? currentOccurrence.registrations.map(
                            (registration) => {
                              return {
                                key: registration.registrationId,
                                fullName: registration,
                                telephone: registration.telephone,
                                attended: registration,
                                source: registration,
                                action: registration,
                              }
                            }
                          )
                        : []
                    }
                    bordered={true}
                    size="small"
                    scroll={{ x: "max-content" }}
                  />
                )}
              </Col>
            </Row>
          </Col>
          <Col>
            <Row gutter={[16, 16]}>
              <Col>
                <Tooltip title="(予約人数/参加可能最大人数)*100">
                  <StyledProgressBar
                    type="dashboard"
                    strokeColor="#9ff0fc"
                    percent={findPercentage(
                      currentOccurrence.sumExpected || 0,
                      currentOccurrence.maxAttendee || 0
                    )}
                    format={(percent) => `予約率\u000A\u000A${percent}%`}
                  />
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title="(参加者数/予約人数)*100">
                  <StyledProgressBar
                    type="dashboard"
                    strokeColor="#b7eb8f"
                    percent={findPercentage(
                      currentOccurrence.sumAttended || 0,
                      currentOccurrence.sumExpected || 0
                    )}
                    format={(percent) => `参加者率\u000A\u000A${percent}%`}
                  />
                </Tooltip>
              </Col>
            </Row>
          </Col>
          <Divider />
          <Col>
            <Row gutter={[8, 8]} justify="center">
              <Col>
                <Button onClick={hideOccurrenceModal}>閉じる</Button>
              </Col>
              {/* <Col>
                <Button
                  icon={<DownloadOutlined />}
                  loading={csvDownloadLoading}
                  onClick={showPasswordConfirmModal}
                >
                  参加者CSV
                </Button>
              </Col> */}
              <Col>
                <Button
                  onClick={handleOccurrenceDelete}
                  icon={<DeleteOutlined />}
                  danger
                >
                  時間削除
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Modal>
      <Modal
        visible={createParticipationModalVisible}
        title="新規予約"
        onCancel={hideCreateParticipationModal}
        footer={null}
        centered
        destroyOnClose={true}
      >
        <div className="p-2">
          <Form
            form={createParticipationForm}
            preserve={false}
            layout="vertical"
            initialValues={{
              participationLastName: "",
              participationFirstName: "",
              participationPhone: "",
              participationAgreement1: false,
              participationAgreement2: false,
            }}
            onFinish={handleParticipationCreateSubmit}
          >
            <Row justify="center" gutter={[8, 8]}>
              <Col xs={12}>
                <Form.Item
                  name="participationLastName"
                  label="氏（漢字）"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：山田"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item
                  name="participationFirstName"
                  label="名（漢字）"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：太郎"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="participationPhone"
                  label="電話番号"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：080-0000-0000"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <p>【確認事項】</p>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="participationAgreement1"
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
                  name="participationAgreement2"
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
            </Row>
            <Divider />
            <Row justify="center">
              <Col span={24}>
                <Row gutter={[8, 8]} justify="center" className="m-4">
                  <Col>
                    <Button onClick={hideCreateParticipationModal}>
                      閉じる
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={participationLoading}
                    >
                      登録
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={updateParticipationModalVisible}
        title="予約変更"
        onCancel={hideUpdateParticipationModal}
        footer={null}
        centered
        destroyOnClose={true}
      >
        <div className="p-2">
          <Form
            form={updateParticipationForm}
            preserve={false}
            layout="vertical"
            initialValues={{
              participationLastName: "",
              participationFirstName: "",
              participationTelephone: "",
              participationAgreement1: false,
              participationAgreement2: false,
              participationId: "",
            }}
            onFinish={handleParticipationUpdateSubmit}
          >
            <Row justify="center" gutter={[8, 8]}>
              <Col xs={24}>
                <Form.Item name="participationId" label="ID" hidden={true}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item
                  name="participationLastName"
                  label="氏（漢字）"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：山田"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item
                  name="participationFirstName"
                  label="名（漢字）"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：太郎"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="participationTelephone"
                  label="電話番号"
                  rules={[
                    {
                      required: true,
                      message: "必須です",
                    },
                    {
                      whitespace: true,
                      message: "必須です",
                    },
                  ]}
                >
                  <Input
                    allowClear
                    placeholder="例：080-0000-0000"
                    onPressEnter={(e) => e.preventDefault()}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <p>【確認事項】</p>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="participationAgreement1"
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
                  name="participationAgreement2"
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
            </Row>
            <Divider />
            <Row justify="center">
              <Col span={24}>
                <Row gutter={[8, 8]} justify="center" className="m-4">
                  <Col>
                    <Button onClick={hideUpdateParticipationModal}>
                      閉じる
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={participationLoading}
                    >
                      変更
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={confirmParticipationModalVisible}
        title="予約参加"
        onCancel={hideConfirmParticipationModal}
        footer={null}
        centered
        destroyOnClose={true}
      >
        <div className="p-2">
          <Form
            form={confirmParticipationForm}
            preserve={false}
            layout="vertical"
            initialValues={{
              participationLastName: "",
              participationFirstName: "",
              participationTelephone: "",
              participationAttended: "0",
              participationId: "",
            }}
            onFinish={handleParticipationConfirmSubmit}
          >
            <Row justify="center" gutter={[8, 8]}>
              <Col xs={24}>
                <Form.Item name="participationId" label="ID" hidden={true}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item name="participationLastName" label="氏（漢字）">
                  <Input disabled={true} />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item name="participationFirstName" label="名（漢字）">
                  <Input disabled={true} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="participationTelephone" label="電話番号">
                  <Input disabled={true} />
                </Form.Item>
              </Col>
              <Divider className="my-4">予約状況</Divider>
              <Col>
                <Form.Item name="participationAttended">
                  <Radio.Group buttonStyle="outline">
                    <Radio.Button value="0">予約済み</Radio.Button>
                    <Radio.Button value="1">参加済み</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Row justify="center" gutter={[8, 8]}>
              <Col>
                <Button onClick={hideConfirmParticipationModal}>閉じる</Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={participationLoading}
                >
                  変更
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={createOccurrenceModalVisible}
        title="新規予約時間"
        onCancel={hideCreateOccurrenceModal}
        footer={null}
        width={720}
        centered
        destroyOnClose
      >
        <div className="p-2">
          <Form
            form={occurrenceForm}
            layout="vertical"
            initialValues={{
              occurrenceMaxParticipation: 10,
              occurrenceTimeInterval: "" + Commons.BUSINESS_INTERVAL_TIME_VALUE,
            }}
            preserve={false}
            onFinish={handleOccurrenceCreateSubmit}
          >
            <Row justify="space-between">
              <Col>
                <Form.Item
                  name="occurrenceMaxParticipation"
                  label="既定参加可能最大人数"
                  rules={[
                    {
                      required: true,
                      message: "既定参加可能最大人数は必須です",
                    },
                  ]}
                >
                  <Commons.NumericInput
                    autoFocus
                    placeholder="既定参加可能最大人数を入力してください"
                    onPressEnter={(e) => {
                      e.preventDefault()
                    }}
                    onChange={(value) => {
                      if (occurrenceCreateForm.current) {
                        occurrenceCreateForm.current.setFieldsValue({
                          occurrenceMaxParticipation: value,
                        })
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col>
                <Form.Item name="occurrenceTimeInterval" label="時間期間">
                  <Select
                    onChange={(value) => {
                      setEventInterval(parseInt(value))
                      clearOccurrence()
                    }}
                  >
                    <Option value="10">10分</Option>
                    <Option value="15">15分</Option>
                    <Option value="20">20分</Option>
                    <Option value="25">25分</Option>
                    <Option value="30">30分</Option>
                    <Option value="35">35分</Option>
                    <Option value="40">40分</Option>
                    <Option value="45">45分</Option>
                    <Option value="50">50分</Option>
                    <Option value="55">55分</Option>
                    <Option value="60">60分</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Row justify="center" gutter={[8, 8]} className="mb-4">
              <Col>
                <Button
                  onClick={() => {
                    occurrenceCreateCalendarRef.current
                      .getApi()
                      .gotoDate(
                        moment(
                          occurrenceCreateCalendarRef.current.getApi().getDate()
                        )
                          .subtract(2, "week")
                          .toDate()
                      )

                    fetchCalendarOccurrencesData(
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .startOf("week")
                        .format("YYYY-MM-DD"),
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .endOf("week")
                        .format("YYYY-MM-DD")
                    )
                  }}
                  type="dashed"
                >
                  <DoubleLeftOutlined />
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    occurrenceCreateCalendarRef.current
                      .getApi()
                      .gotoDate(
                        moment(
                          occurrenceCreateCalendarRef.current.getApi().getDate()
                        )
                          .subtract(1, "week")
                          .toDate()
                      )

                    fetchCalendarOccurrencesData(
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .startOf("week")
                        .format("YYYY-MM-DD"),
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .endOf("week")
                        .format("YYYY-MM-DD")
                    )
                  }}
                  type="dashed"
                >
                  <LeftOutlined />
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    occurrenceCreateCalendarRef.current.getApi().today()

                    fetchCalendarOccurrencesData(
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .startOf("week")
                        .format("YYYY-MM-DD"),
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .endOf("week")
                        .format("YYYY-MM-DD")
                    )
                  }}
                  type="dashed"
                >
                  今週
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    occurrenceCreateCalendarRef.current
                      .getApi()
                      .gotoDate(
                        moment(
                          occurrenceCreateCalendarRef.current.getApi().getDate()
                        )
                          .add(1, "week")
                          .toDate()
                      )

                    fetchCalendarOccurrencesData(
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .startOf("week")
                        .format("YYYY-MM-DD"),
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .endOf("week")
                        .format("YYYY-MM-DD")
                    )
                  }}
                  type="dashed"
                >
                  <RightOutlined />
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    occurrenceCreateCalendarRef.current
                      .getApi()
                      .gotoDate(
                        moment(
                          occurrenceCreateCalendarRef.current.getApi().getDate()
                        )
                          .add(2, "week")
                          .toDate()
                      )

                    fetchCalendarOccurrencesData(
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .startOf("week")
                        .format("YYYY-MM-DD"),
                      moment(
                        occurrenceCreateCalendarRef.current.getApi().getDate()
                      )
                        .endOf("week")
                        .format("YYYY-MM-DD")
                    )
                  }}
                  type="dashed"
                >
                  <DoubleRightOutlined />
                </Button>
              </Col>
            </Row>
            <CalendarWrapper>
              <FullCalendar
                locale="ja"
                ref={occurrenceCreateCalendarRef}
                plugins={[timeGridPlugin, interactionPlugin, momentPlugin]}
                initialView="timeGridWeek"
                height="64.7vh"
                headerToolbar={{
                  left: "",
                  center: "title",
                  right: "",
                }}
                titleFormat={(date) => {
                  return moment(date.date).format("YYYY年M月")
                }}
                businessHours={false}
                allDaySlot={false}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  omitZeroMinute: false,
                }}
                slotDuration={`00:${eventInterval}:00`}
                slotMinTime={Commons.BUSINESS_OPEN_TIME}
                slotMaxTime={Commons.BUSINESS_CLOSE_TIME}
                slotLabelInterval={`00:${eventInterval}:00`}
                dayHeaderFormat={(date) => {
                  return moment(date.date).format("D（ddd）")
                }}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: false,
                }}
                slotEventOverlap={false}
                displayEventTime={true}
                displayEventEnd={false}
                nowIndicator={true}
                selectable={true}
                selectOverlap={false}
                unselectAuto={true}
                selectAllow={(selectInfo) =>
                  moment().isBefore(selectInfo.start)
                }
                events={[
                  ...(calendarOccurrences.length > 0
                    ? calendarOccurrences.map((occurrence) => {
                        return {
                          groupId: "event",
                          display: "background",
                          backgroundColor: "#ffd591",
                          start: moment(occurrence.startAt).format(
                            "YYYY-MM-DD HH:mm"
                          ),
                          end: moment(occurrence.startAt)
                            .add(eventInterval, "minutes")
                            .format("YYYY-MM-DD HH:mm"),
                        }
                      })
                    : []),
                  ...(tmpOccurrences
                    ? tmpOccurrences.map((occurrence) => {
                        return {
                          groupId: "background",
                          display: "background",
                          backgroundColor: "#9ff0fc",
                          start: moment(occurrence.startAt).format(
                            "YYYY-MM-DD HH:mm"
                          ),
                          end: moment(occurrence.startAt)
                            .add(eventInterval, "minutes")
                            .format("YYYY-MM-DD HH:mm"),
                        }
                      })
                    : []),
                ]}
                eventContent={(arg) => {
                  if (arg.event.groupId === "background") {
                    return (
                      <Row justify="center" className="cursor-pointer">
                        <Col>
                          <ClockCircleTwoTone
                            twoToneColor="#21acd7"
                            className="text-lg p-1"
                          />
                        </Col>
                      </Row>
                    )
                  } else if (arg.event.groupId === "event") {
                    return (
                      <Row justify="center" className="cursor-pointer">
                        <Col>
                          <StopTwoTone
                            twoToneColor="#fa8c16"
                            className="text-lg p-1"
                          />
                        </Col>
                      </Row>
                    )
                  }
                }}
                eventClick={(eventInfo) => {
                  if (eventInfo.event.groupId === "background") {
                    Modal.confirm({
                      title: "予約の時間削除",
                      icon: (
                        <QuestionCircleOutlined style={{ color: "#f5222d" }} />
                      ),
                      content: (
                        <Row gutter={[0, 16]} className="mt-4" justify="center">
                          <Col span={24}>
                            <Card
                              bodyStyle={{
                                maxHeight: "50vh",
                                overflow: "auto",
                              }}
                            >
                              <Card.Grid
                                hoverable={false}
                                style={deleteCardGridStyle}
                              >
                                {`${moment(eventInfo.event.start).format(
                                  "YYYY年M月D日 HH:mm"
                                )}`}
                              </Card.Grid>
                            </Card>
                          </Col>
                        </Row>
                      ),
                      okText: "削除",
                      okButtonProps: {
                        danger: true,
                      },
                      onOk: () => {
                        setTmpOccurrences(
                          tmpOccurrences.filter(
                            (occurrence) =>
                              occurrence.startAt !==
                              moment(eventInfo.event.start).format(
                                "YYYY-MM-DD HH:mm"
                              )
                          )
                        )
                      },
                      cancelText: "閉じる",
                    })
                  }
                }}
                select={(selectInfo) => {
                  Modal.confirm({
                    title: "予約の時間登録",
                    icon: (
                      <QuestionCircleOutlined style={{ color: "#21acd7" }} />
                    ),
                    content: (
                      <Row gutter={[0, 16]} className="mt-4" justify="center">
                        <Col span={24}>
                          <Card
                            bodyStyle={{
                              maxHeight: "50vh",
                              overflow: "auto",
                            }}
                          >
                            {Array.from(
                              moment
                                .range(selectInfo.start, selectInfo.end)
                                .by("minutes", {
                                  step: eventInterval,
                                  excludeEnd: true,
                                })
                            ).map((chunk) => (
                              <Card.Grid
                                hoverable={false}
                                style={cardGridStyle}
                                key={chunk}
                              >
                                {moment(chunk).format("YYYY年M月D日 HH:mm")}
                              </Card.Grid>
                            ))}
                          </Card>
                        </Col>
                        <Col>
                          <Form
                            ref={occurrenceCreateForm}
                            layout="vertical"
                            initialValues={{
                              occurrenceMaxParticipation:
                                occurrenceForm.getFieldValue(
                                  "occurrenceMaxParticipation"
                                ) || 10,
                            }}
                            size="small"
                            requiredMark={true}
                            scrollToFirstError
                          >
                            <Form.Item
                              name="occurrenceMaxParticipation"
                              label="参加可能最大人数"
                              rules={[
                                {
                                  required: true,
                                  message: "参加可能最大人数は必須です",
                                },
                              ]}
                            >
                              <Commons.NumericInput
                                autoFocus
                                placeholder="参加可能最大人数を入力してください"
                                onPressEnter={(e) => {
                                  e.preventDefault()
                                }}
                              />
                            </Form.Item>
                          </Form>
                        </Col>
                      </Row>
                    ),
                    okText: "登録",
                    onOk: () => {
                      occurrenceCreateForm.current
                        .validateFields()
                        .then((values) => {
                          const dateRange = moment.range(
                            selectInfo.start,
                            selectInfo.end
                          )

                          const dateChunk = Array.from(
                            dateRange.by("minutes", {
                              step: eventInterval,
                              excludeEnd: true,
                            })
                          )

                          setTmpOccurrences([
                            ...tmpOccurrences,
                            ...dateChunk.map((date) => ({
                              maxAttendee:
                                values.occurrenceMaxParticipation || 10,
                              startAt: moment(date).format("YYYY-MM-DD HH:mm"),
                              endAt: moment(date)
                                .add(eventInterval - 1, "minutes")
                                .format("YYYY-MM-DD HH:mm"),
                            })),
                          ])
                        })
                        .catch((error) => {})
                    },
                    cancelText: "閉じる",
                  })
                }}
              />
            </CalendarWrapper>
            <Row justify="center mt-4">
              <Col>
                <Button
                  style={{ margin: "0 8px" }}
                  onClick={() => clearOccurrence()}
                >
                  すべての日付選択をクリア
                </Button>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[8, 8]} justify="center">
              <Col>
                <Button key="back" onClick={hideCreateOccurrenceModal}>
                  閉じる
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  key="ok"
                  loading={eventSubmitLoading}
                >
                  登録
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={updateOccurrenceModalVisible}
        title="参加可能最大人数変更"
        onCancel={hideUpdateOccurrenceModal}
        footer={null}
        centered
      >
        <div className="p-2">
          <Form
            form={updateOccurrenceForm}
            preserve={false}
            layout="vertical"
            initialValues={{
              occurrenceMaxParticipation: "",
            }}
            onFinish={handleOccurrenceUpdateSubmit}
          >
            <Row justify="center">
              <Col xs={24}>
                <Form.Item
                  name="occurrenceMaxParticipation"
                  label="参加可能最大人数"
                  rules={[
                    {
                      required: true,
                      message: "参加可能最大人数は必須です",
                    },
                  ]}
                >
                  <Commons.NumericInput
                    autoFocus
                    placeholder="参加可能最大人数を入力してください"
                    onPressEnter={(e) => {
                      e.preventDefault()
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[8, 8]} justify="center">
              <Col>
                <Button key="back" onClick={hideUpdateOccurrenceModal}>
                  閉じる
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  key="ok"
                  loading={occurrenceUpdateLoading}
                >
                  変更
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
      <Modal
        visible={participantInfoModalVisible}
        title="予約者情報"
        onCancel={hideParticipantInfoModal}
        footer={null}
        centered
        destroyOnClose
      >
        <Descriptions
          column={1}
          size="small"
          labelStyle={{ width: "150px" }}
          bordered
        >
          <Descriptions.Item label="氏名（漢字）">{`${
            currentRegistration?.lastName || "ー"
          } ${currentRegistration?.firstName || "ー"}`}</Descriptions.Item>
          <Descriptions.Item label="氏名（フリガナ）">{`${
            currentRegistration?.lastNameKana || "ー"
          } ${currentRegistration?.firstNameKana || "ー"}`}</Descriptions.Item>
          <Descriptions.Item label="生年月日">
            {currentRegistration?.dateOfBirth || "ー"}
          </Descriptions.Item>
          <Descriptions.Item label="性別">
            {Commons.getGenderByValue(currentRegistration?.gender)}
          </Descriptions.Item>
          <Descriptions.Item label="メールアドレス">
            {currentRegistration?.email || "ー"}
          </Descriptions.Item>
          <Descriptions.Item label="電話番号">
            {currentRegistration?.telephone || "ー"}
          </Descriptions.Item>
          <Descriptions.Item label="住所">
            〒
            {currentRegistration?.zipPostal
              ? Commons.insertCharacter(currentRegistration.zipPostal, 3, "-")
              : "ー"}{" "}
            {currentRegistration?.prefecture || "ー"}
            {currentRegistration?.city || "ー"}
            {currentRegistration?.address || "ー"}
          </Descriptions.Item>
          <Descriptions.Item label="検査利用回数">
            {currentRegistration?.q2inspectionCount || "ー"}回
          </Descriptions.Item>
          <Descriptions.Item label="検査目的">
            {Commons.getInspectionPurposeByValue(
              currentRegistration?.q3inspectionPurpose
            )}
          </Descriptions.Item>
          {currentRegistration?.q3inspectionPurpose === 1 ? (
            <Descriptions.Item label="ワクチンの接種の有無">
              {Commons.getVaccinatedOptionByValue(
                currentRegistration?.q4isVaccinated
              )}
            </Descriptions.Item>
          ) : (
            ""
          )}
          {currentRegistration?.q4isVaccinated === 2 ? (
            <Descriptions.Item label="ワクチン未接種の理由">
              {Commons.getUnvaccinatedReasonByValue(
                currentRegistration?.q5unvaccinatedReason
              )}
            </Descriptions.Item>
          ) : (
            ""
          )}
        </Descriptions>
        <Divider />
        <Row justify="center" align="middle" gutter={[8, 8]}>
          <Col>
            <Button onClick={hideParticipantInfoModal}>閉じる</Button>
          </Col>
        </Row>
      </Modal>
      <Modal
        visible={passwordConfirmModalVisible}
        title="パスワード確認"
        onCancel={hidePasswordConfirmModal}
        footer={null}
        centered
        destroyOnClose
      >
        <Alert
          message="確認のためにログインパスワードを入力してください"
          className="text-center mb-8"
          type="info"
        />
        <Form
          form={passwordConfirmForm}
          preserve={false}
          layout="vertical"
          initialValues={{
            password: "",
          }}
          onFinish={handleDownloadParticipantCSV}
        >
          <Form.Item
            name="password"
            label="ログインパスワード"
            rules={[
              {
                required: true,
                message: "パスワードを入力してください",
              },
            ]}
          >
            <Input.Password placeholder="パスワードを入力してください" />
          </Form.Item>
          <Divider />
          <Row justify="center" align="middle" gutter={[8, 8]}>
            <Col>
              <Button onClick={hidePasswordConfirmModal}>閉じる</Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                loading={csvDownloadLoading}
              >
                確認
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default withRouter(OccasionDetail)
