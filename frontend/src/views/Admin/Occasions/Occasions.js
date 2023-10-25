import React, { useState, useCallback, useEffect, useRef } from "react"
import { withRouter, Link } from "react-router-dom"
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Steps,
  Switch,
  Tag,
  TimePicker,
  Badge,
} from "antd"
import {
  ClockCircleTwoTone,
  QuestionCircleOutlined,
  PlusOutlined,
  LeftOutlined,
  DoubleLeftOutlined,
  RightOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons"
import styled from "styled-components"
import Moment from "moment"
import "moment/locale/ja"
import { extendMoment } from "moment-range"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import momentPlugin from "@fullcalendar/moment"
import { isMobileOnly } from "react-device-detect"
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
    box-shadow: none !important;
  }

  .fc .fc-button-primary:focus {
    box-shadow: none !important;
  }

  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: #00bcd4 !important;
    border-color: #00bcd4 !important;
  }

  .fc .fc-toolbar-title {
    display: inline-block !important;
    vertical-align: middle !important;
    font-size: 2em !important;
    font-weight: bold !important;
    white-space: pre-wrap !important;
    text-align: center !important;
    color: #00bcd4 !important;
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

const StyledDashedButton = styled(Button)`
  &.ant-btn-dashed {
    border-color: #8c8c8c;
  }

  &.ant-btn-dashed:hover,
  .ant-btn-dashed:focus {
    border-color: #21acd7;
    color: #21acd7;
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

const steps = [
  {
    key: 0,
    title: "基本設定",
  },
  {
    key: 1,
    title: "日付設定",
  },
  {
    key: 2,
    title: "確認",
  },
]

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

const { TextArea } = Input
const { FormInstance } = Form
const { Step } = Steps
const { Option } = Select

const Occasions = (props) => {
  const { history, showLoadingPageSpin, hideLoadingPageSpin, auth } = props
  const isMountedRef = Commons.useIsMountedRef()
  const occurrenceManageCalendarRef = useRef()
  const occurrenceForm = useRef(FormInstance)
  const [occasionForm] = Form.useForm()

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [eventSubmitLoading, setEventSubmitLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [eventInterval, setEventInterval] = useState(
    Commons.BUSINESS_INTERVAL_TIME_VALUE
  )
  const [occasions, setOccasions] = useState([])
  const [occurrences, setOccurrences] = useState([])
  const [eventTemplates, setEventTemplates] = useState([])

  const fetchOccasionsOverview = useCallback(() => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
    }

    Commons.axiosInstance
      .get(Commons.apiOccasions + "/overview")
      .then((response) => {
        if (isMountedRef.current && response) {
          setOccasions(response.data || [])
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
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
  }, [isMountedRef, history, showLoadingPageSpin, hideLoadingPageSpin, auth])

  const fetchEventTemplates = useCallback(() => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
    }

    Commons.axiosInstance
      .get(Commons.apiEvents + "/list")
      .then((response) => {
        if (isMountedRef.current && response) {
          setEventTemplates(response.data || [])
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth?.role))
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
  }, [isMountedRef, history, showLoadingPageSpin, hideLoadingPageSpin, auth])

  const fetchEventTemplateDetail = (occasionId) => {
    if (isMountedRef.current) {
      showLoadingPageSpin()
    }

    Commons.axiosInstance
      .get(Commons.apiEvents + "/detail/" + occasionId)
      .then((response) => {
        if (isMountedRef.current && response) {
          if (response.data) {
            occasionForm.setFieldsValue({
              occasionRegisterName: response.data.title || "",
              occasionRegisterTelephone: response.data.telephone || "",
              occasionRegisterZipPostal: response.data.zipPostal || "",
              occasionRegisterAddress: response.data.address || "",
              occasionRegisterType: response.data.type || undefined,
              occasionRegisterLimitTime: response.data.limitTime ?? false,
              occasionRegisterLimitDay: response.data.limitDays ?? 1,
              occasionRegisterLimitHour: moment(
                `${response.data.limitHours ?? "18"}:${
                  response.data.limitMinutes ?? "00"
                }`,
                "HH:mm"
              ),
              occasionRegisterCancel: response.data.canCancel || false,
              occasionRegisterCancelTime: response.data.timeCancel || 0,
              occasionRegisterCancelMessage: response.data.textCancel || "",
              occasionRegisterRegisterMessage: response.data.regMessage || "",
              occasionRegisterCancelEmailMessage:
                response.data.cancelMessage || "",
              occasionRegisterRemindMessage: response.data.remindMessage || "",
              occasionRegisterRemind10Message:
                response.data.remindMessage1 || "",
            })
          }
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
        }
      })
  }

  const handleCreateSubmit = (data) => {
    setEventSubmitLoading(true)

    const postData = {
      title: occasionForm.getFieldValue("occasionRegisterName"),
      telephone: occasionForm.getFieldValue("occasionRegisterTelephone"),
      zipPostal: occasionForm.getFieldValue("occasionRegisterZipPostal"),
      address: occasionForm.getFieldValue("occasionRegisterAddress"),
      type: occasionForm.getFieldValue("occasionRegisterType"),
      limitTime: occasionForm.getFieldValue("occasionRegisterLimitTime"),
      limitDays: occasionForm.getFieldValue("occasionRegisterLimitTime")
        ? occasionForm.getFieldValue("occasionRegisterLimitDay")
        : undefined,
      limitHours: occasionForm.getFieldValue("occasionRegisterLimitTime")
        ? moment(
            occasionForm.getFieldValue("occasionRegisterLimitHour"),
            "HH:mm"
          ).format("HH")
        : undefined,
      limitMinutes: occasionForm.getFieldValue("occasionRegisterLimitTime")
        ? moment(
            occasionForm.getFieldValue("occasionRegisterLimitHour"),
            "HH:mm"
          ).format("mm")
        : undefined,
      canCancel: occasionForm.getFieldValue("occasionRegisterCancel"),
      timeCancel: occasionForm.getFieldValue("occasionRegisterCancel")
        ? occasionForm.getFieldValue("occasionRegisterCancelTime")
        : undefined,
      textCancel: occasionForm.getFieldValue("occasionRegisterCancelMessage"),
      regMessage: occasionForm.getFieldValue("occasionRegisterRegisterMessage"),
      cancelMessage: occasionForm.getFieldValue(
        "occasionRegisterCancelEmailMessage"
      ),
      remindMessage: occasionForm.getFieldValue(
        "occasionRegisterRemindMessage"
      ),
      remindMessage1: occasionForm.getFieldValue(
        "occasionRegisterRemind10Message"
      ),
      occurrences: occurrences.map((occurrence) => ({
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        maxAttendee: occurrence.maxAttendee,
      })),
    }

    Commons.axiosInstance
      .post(Commons.apiOccasions, postData)
      .then((response) => {
        if (isMountedRef.current && response) {
          occasionForm.resetFields()

          setCurrentStep(0)
          setOccurrences([])
          setEventInterval(Commons.BUSINESS_INTERVAL_TIME_VALUE)

          fetchOccasionsOverview()
          hideCreateModal()

          message.success(Commons.successCreateMsg)
        }
      })
      .catch((error) => {
        if (error.response.status === 403) {
          message.warning(Commons.errorSessionMsg)
          history.push(Commons.GET_REDIRECT_LOGIN_ROUTE(auth))
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

  useEffect(() => {
    fetchOccasionsOverview()
    fetchEventTemplates()

    return () => {
      Modal.destroyAll()
    }

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const socket = io(Commons.siteURL, { path: "/socket.io" })

    socket.on("newEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
        fetchEventTemplates()
      }
    })

    socket.on("updateEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
        fetchEventTemplates()
      }
    })

    socket.on("updateOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
      }
    })

    socket.on("deleteOccurrence", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
      }
    })

    socket.on("deleteEvent", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
        fetchEventTemplates()
      }
    })

    socket.on("newRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
      }
    })

    socket.on("cancelRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
      }
    })

    socket.on("confirmRegistration", (response) => {
      if (response !== undefined && Object.keys(response).length !== 0) {
        fetchOccasionsOverview()
      }
    })

    return () => {
      socket.off("newEvent")
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

  const nextStep = () => {
    occasionForm
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1)
      })
      .catch(() => {})
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const showCreateModal = () => {
    setCreateModalVisible(true)
  }

  const hideCreateModal = () => {
    setCreateModalVisible(false)
  }

  const clearOccurrence = () => {
    setOccurrences([])
  }

  const handleTemplateChange = (occasionId) => {
    fetchEventTemplateDetail(occasionId)
  }

  const postalSearchHandler = () => {
    const postalCode = occasionForm.getFieldValue("occasionRegisterZipPostal")

    if (postalCode.length === 7) {
      Commons.getAddressByZipCode(postalCode).then((text) => {
        const matcher = text.match(/({".*"]})/)

        if (matcher) {
          const json = JSON.parse(matcher[0])
          const address = json[postalCode]
          if (address && address[0] && address[1]) {
            const index = address[0] - 1

            occasionForm.setFieldsValue({
              occasionRegisterAddress: `${Commons.PREFECTURES[index]["label"]}${address[1]}${address[2]}`,
            })
          } else {
            message.warn(Commons.warnWrongPostalMsg)
          }
        }
      })
    }
  }

  const occasionView = (occasion) => {
    return (
      <Col xs={24} md={12} lg={8} xl={8} xxl={6} key={occasion.occasionId}>
        <Link to={`${Commons.adminOccasionsRoute}${occasion.occasionId}`}>
          <Badge.Ribbon text={Commons.getTypeByValue(occasion.type)}>
            <Card
              hoverable
              headStyle={{
                borderColor: "#21acd7",
              }}
              bodyStyle={{
                padding: "2rem",
              }}
              style={{
                borderColor: "#21acd7",
                height: "100%",
              }}
            >
              <p className="text-sm text-center font-bold">
                {occasion.title || "ー"}
              </p>
              <p className="text-xs text-center whitespace-pre-wrap">
                〒
                {occasion.zipPostal
                  ? Commons.insertCharacter(occasion.zipPostal, 3, "-")
                  : "ー"}{" "}
                {occasion.address || "ー"}
              </p>
              <p className="text-xs text-center whitespace-pre-wrap">
                {occasion.telephone || "ー"}
              </p>
              <Divider />
              <Row>
                <Col
                  span={12}
                  style={{
                    backgroundColor: Commons.checkIsEventFull(
                      occasion.maxCapacity || 0,
                      occasion.sumExpected || 0
                    )
                      ? "#7cc7d6"
                      : "#f0feff",
                    color: Commons.checkIsEventFull(
                      occasion.maxCapacity || 0,
                      occasion.sumExpected || 0
                    )
                      ? "#FFF"
                      : "#21acd7",
                    border: "1px solid #21acd7",
                    borderBottom: "none",
                  }}
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
                      : "#fff",
                    color: Commons.checkIsEventFull(
                      occasion.sumExpected || 0,
                      occasion.sumAttended || 0
                    )
                      ? "#FFF"
                      : "#52c41a",
                    border: "1px solid #21acd7",
                    borderLeft: "none",
                    borderBottom: "none",
                  }}
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
                    backgroundColor: "#f0feff",
                    color: "#21acd7",
                    border: "1px solid #21acd7",
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
              </Row>
              <Divider />
              <Row justify="center" gutter={[8, 8]} className="mb-4">
                <Col>
                  <Tag
                    color="#52c41a"
                    className="whitespace-pre-wrap text-center mr-0"
                  >
                    {occasion.start
                      ? `${moment(occasion.start).format(
                          "YYYY年M月D日"
                        )}\n${moment(occasion.start).format("HH:mm")}`
                      : "ー年ー月ー日\nー:ー"}
                  </Tag>
                </Col>
                <Col>
                  <Tag
                    color="#fa541c"
                    className="whitespace-pre-wrap text-center mr-0"
                  >
                    {occasion.end
                      ? `${moment(occasion.end).format(
                          "YYYY年M月D日"
                        )}\n${moment(occasion.end).format("HH:mm")}`
                      : "ー年ー月ー日\nー:ー"}
                  </Tag>
                </Col>
              </Row>
            </Card>
          </Badge.Ribbon>
        </Link>
      </Col>
    )
  }

  return (
    <>
      <Card
        title="予約管理"
        bordered={false}
        extra={
          <StyledDashedButton
            icon={<PlusOutlined />}
            type="dashed"
            onClick={showCreateModal}
          >
            新規会場
          </StyledDashedButton>
        }
      >
        <Row gutter={[16, 16]}>
          {occasions.map((occasion) => occasionView(occasion))}
        </Row>
      </Card>
      <Modal
        visible={createModalVisible}
        title="新規会場"
        onCancel={hideCreateModal}
        footer={null}
        width={720}
        centered
      >
        <div className="p-2">
          <Form
            form={occasionForm}
            layout="vertical"
            initialValues={{
              occasionRegisterName: "",
              occasionRegisterTelephone: "",
              occasionRegisterZipPostal: "",
              occasionRegisterAddress: "",
              occasionRegisterType: undefined,
              occasionRegisterLimitTime: false,
              occasionRegisterLimitDay: 1,
              occasionRegisterLimitHour: moment("18:00", "HH:mm"),
              occasionRegisterCancel: false,
              occasionRegisterCancelTime: 15,
              occasionRegisterCancelMessage: "",
              occasionRegisterRegisterMessage: "",
              occasionRegisterCancelEmailMessage: "",
              occasionRegisterRemindMessage: "",
              occasionRegisterRemind10Message: "",
              occurrenceMaxParticipation: 10,
              occurrenceTimeInterval: "" + Commons.BUSINESS_INTERVAL_TIME_VALUE,
            }}
            onFinish={handleCreateSubmit}
            requiredMark={true}
            scrollToFirstError
          >
            {currentStep === 0 ? (
              <>
                <Row justify="end" className="mb-4">
                  <Col>
                    <Select
                      placeholder="テンプレートを選択してください"
                      onChange={handleTemplateChange}
                      style={{ width: "300px", textAlign: "center" }}
                    >
                      {eventTemplates.map((template) => (
                        <Option
                          key={template.occasionId + ""}
                          value={template.occasionId + ""}
                        >
                          {template.title}のテンプレート
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="occasionRegisterName"
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
                      <Input
                        placeholder="例：１０９シネマズ名古屋"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="occasionRegisterTelephone"
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
                      name="occasionRegisterZipPostal"
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
                      name="occasionRegisterAddress"
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
                      name="occasionRegisterType"
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
                      name="occasionRegisterLimitTime"
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
                          prevValues.occasionRegisterLimitTime !==
                          currentValues.occasionRegisterLimitTime
                        )
                      }}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue("occasionRegisterLimitTime") ? (
                          <>
                            <Form.Item
                              name="occasionRegisterLimitDay"
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
                              name="occasionRegisterLimitHour"
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
                                  occasionForm.setFieldsValue({
                                    occasionRegisterLimitHour: time,
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
                      name="occasionRegisterCancel"
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
                          prevValues.occasionRegisterCancel !==
                          currentValues.occasionRegisterCancel
                        )
                      }}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue("occasionRegisterCancel") ? (
                          <Form.Item
                            name="occasionRegisterCancelTime"
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
                      name="occasionRegisterCancelMessage"
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
                      name="occasionRegisterRegisterMessage"
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
                      name="occasionRegisterCancelEmailMessage"
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
                      name="occasionRegisterRemindMessage"
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
                      name="occasionRegisterRemind10Message"
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
              </>
            ) : (
              ""
            )}
            {currentStep === 1 ? (
              <>
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
                          if (occurrenceForm.current) {
                            occurrenceForm.current.setFieldsValue({
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
                        occurrenceManageCalendarRef.current
                          .getApi()
                          .gotoDate(
                            moment(
                              occurrenceManageCalendarRef.current
                                .getApi()
                                .getDate()
                            )
                              .subtract(2, "week")
                              .toDate()
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
                        occurrenceManageCalendarRef.current
                          .getApi()
                          .gotoDate(
                            moment(
                              occurrenceManageCalendarRef.current
                                .getApi()
                                .getDate()
                            )
                              .subtract(1, "week")
                              .toDate()
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
                        occurrenceManageCalendarRef.current.getApi().today()
                      }}
                      type="dashed"
                    >
                      今週
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      onClick={() => {
                        occurrenceManageCalendarRef.current
                          .getApi()
                          .gotoDate(
                            moment(
                              occurrenceManageCalendarRef.current
                                .getApi()
                                .getDate()
                            )
                              .add(1, "week")
                              .toDate()
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
                        occurrenceManageCalendarRef.current
                          .getApi()
                          .gotoDate(
                            moment(
                              occurrenceManageCalendarRef.current
                                .getApi()
                                .getDate()
                            )
                              .add(2, "week")
                              .toDate()
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
                    ref={occurrenceManageCalendarRef}
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
                    events={occurrences.map((occurrence) => {
                      return {
                        groupId: "background",
                        display: "background",
                        backgroundColor: "#9ff0fc",
                        start: occurrence.startAt,
                        end: occurrence.endAt,
                      }
                    })}
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
                      }
                    }}
                    eventClick={(eventInfo) => {
                      if (eventInfo.event.groupId === "background") {
                        Modal.confirm({
                          title: "予約の時間削除",
                          icon: (
                            <QuestionCircleOutlined
                              style={{ color: "#f5222d" }}
                            />
                          ),
                          content: (
                            <Row
                              gutter={[0, 16]}
                              className="mt-4"
                              justify="center"
                            >
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
                            setOccurrences(
                              occurrences.filter(
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
                          <QuestionCircleOutlined
                            style={{ color: "#21acd7" }}
                          />
                        ),
                        content: (
                          <Row
                            gutter={[0, 16]}
                            className="mt-4"
                            justify="center"
                          >
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
                                ref={occurrenceForm}
                                layout="vertical"
                                initialValues={{
                                  occurrenceMaxParticipation:
                                    occasionForm.getFieldValue(
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
                          occurrenceForm.current
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

                              setOccurrences([
                                ...occurrences,
                                ...dateChunk.map((date) => ({
                                  maxAttendee:
                                    values.occurrenceMaxParticipation || 10,
                                  startAt:
                                    moment(date).format("YYYY-MM-DD HH:mm"),
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
              </>
            ) : (
              ""
            )}
            {currentStep === 2 ? (
              <Descriptions column={1} bordered layout="vertical">
                <Descriptions.Item label="会場名">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterName") || "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="電話番号">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterTelephone") ||
                      "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="郵便番号">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterZipPostal") ||
                      "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="住所">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterAddress") ||
                      "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="検査タイプ">
                  <span>
                    {Commons.getTypeByValue(
                      occasionForm.getFieldValue("occasionRegisterType")
                    )}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="登録すると送るメッセージ">
                  <span>
                    {occasionForm.getFieldValue(
                      "occasionRegisterRegisterMessage"
                    ) || "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="リマインドメッセージ（予約より3日前に届く）">
                  <span>
                    {occasionForm.getFieldValue(
                      "occasionRegisterRemindMessage"
                    ) || "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="リマインドメッセージ（予約より１０分前に届く）">
                  <span>
                    {occasionForm.getFieldValue(
                      "occasionRegisterRemind10Message"
                    ) || "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="予約時間制限">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterLimitTime")
                      ? "予約時間制限ある"
                      : "予約時間制限ない"}
                  </span>
                </Descriptions.Item>
                {occasionForm.getFieldValue("occasionRegisterLimitTime") ? (
                  <Descriptions.Item label="予約時間制限">
                    <span>
                      {occasionForm.getFieldValue("occasionRegisterLimitDay") >
                      0
                        ? `${occasionForm.getFieldValue(
                            "occasionRegisterLimitDay"
                          )}日前`
                        : ""}
                      {`${moment(
                        occasionForm.getFieldValue("occasionRegisterLimitHour"),
                        "HH:mm"
                      ).format("HH")}時${moment(
                        occasionForm.getFieldValue("occasionRegisterLimitHour"),
                        "HH:mm"
                      ).format("mm")}分まで予約可能`}
                    </span>
                  </Descriptions.Item>
                ) : (
                  ""
                )}
                <Descriptions.Item label="キャンセル機能">
                  <span>
                    {occasionForm.getFieldValue("occasionRegisterCancel")
                      ? "キャンセル可"
                      : "キャンセル不可"}
                  </span>
                </Descriptions.Item>
                {occasionForm.getFieldValue("occasionRegisterCancel") ? (
                  <Descriptions.Item label="キャンセル可能時間">
                    <span>
                      {occasionForm.getFieldValue(
                        "occasionRegisterCancelTime"
                      ) || "ー"}
                      分
                    </span>
                  </Descriptions.Item>
                ) : (
                  ""
                )}
                <Descriptions.Item label="キャンセルに関する説明文">
                  <span>
                    {occasionForm.getFieldValue(
                      "occasionRegisterCancelMessage"
                    ) || "ー"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="イベント一覧">
                  {occurrences.length > 0 ? (
                    <Row
                      gutter={[8, 8]}
                      style={{ overflow: "auto", maxHeight: "260px" }}
                    >
                      {occurrences.map((occurrence) => (
                        <Col span={8} key={occurrence.startAt}>
                          <Row>
                            <Col
                              span={24}
                              className="p-2 text-center border border-b-0 border-solid border-primary bg-primary text-white"
                            >
                              <span>
                                {moment(occurrence.startAt).format(
                                  "YYYY年M月D日"
                                )}
                              </span>
                            </Col>
                            <Col
                              span={12}
                              className="p-2 text-center border border-r-0 border-solid border-primary"
                            >
                              <span>
                                {moment(occurrence.startAt).format("HH:mm")}
                              </span>
                            </Col>
                            <Col
                              span={12}
                              className="p-2 text-center border border-solid border-primary"
                            >
                              <span>{occurrence.maxAttendee}人</span>
                            </Col>
                          </Row>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    "ー"
                  )}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              ""
            )}
            <Row gutter={[8, 8]} justify="center">
              {isMobileOnly ? (
                ""
              ) : (
                <Col span={24}>
                  <Steps progressDot current={currentStep} className="p-4">
                    {steps.map((step) => (
                      <Step key={step.key} title={step.title} />
                    ))}
                  </Steps>
                </Col>
              )}
              <Col>
                <Button key="back" onClick={hideCreateModal}>
                  閉じる
                </Button>
              </Col>
              <Col>
                {currentStep > 0 && (
                  <Button
                    style={{ margin: "0 8px" }}
                    onClick={() => prevStep()}
                  >
                    前のステップ
                  </Button>
                )}
              </Col>
              <Col>
                {currentStep < 2 && (
                  <Button type="primary" onClick={() => nextStep()}>
                    次のステップ
                  </Button>
                )}
              </Col>
              <Col>
                {currentStep === 2 && (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key="ok"
                    loading={eventSubmitLoading}
                  >
                    登録
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </>
  )
}

export default withRouter(Occasions)
