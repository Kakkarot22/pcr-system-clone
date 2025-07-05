import React, { useEffect, useRef } from "react"
import axios from "axios"
import { Input } from "antd"

export const siteURL = process.env.REACT_APP_API_URL

export const baseURL = siteURL + "/api"
export const PRIVACY_POLICY_URL =
  "https://www.kowa.co.jp/privacy_policy/index.html"

export const ADMIN_ROLE = "manager"
export const CLIENT_ROLE = "customer"

export function GET_REDIRECT_LOGIN_ROUTE(role) {
  switch (role) {
    case ADMIN_ROLE:
      return adminLoginRoute
    case CLIENT_ROLE:
      return clientLoginRoute
    default:
      return notFoundRoute
  }
}

export function GET_REDIRECT_HOME_ROUTE(role) {
  switch (role) {
    case ADMIN_ROLE:
      return adminOccasionsRoute
    case CLIENT_ROLE:
      return clientOccasionsRoute
    default:
      return notFoundRoute
  }
}

/* ROUTES */
export const adminLoginRoute = "/sys/login"
export const adminOccasionsRoute = "/sys/occasions/"

export const clientLoginRoute = "/login"
export const clientRegisterRoute = "/register"
export const clientForgotRoute = "/forgot"
export const clientOccasionsRoute = "/occasions"
export const clientRegisteredOccasionsRoute = "/info"

export const notFoundRoute = "/not-found"

/* BACKEND API URLS */
export const apiCheckSession = baseURL + "/sess"
export const apiLogout = baseURL + "/logout"
export const apiAuth = baseURL + "/auth"
export const apiOccasions = baseURL + "/master/occasions"
export const apiOccurrences = baseURL + "/master/occurrences"
export const apiRegistrations = baseURL + "/master/registrations"
export const apiEvents = baseURL + "/master/events"

export const apiClientLogin = baseURL + "/login"
export const apiClientRegisterEmail = baseURL + "/email"
export const apiClientToken = baseURL + "/token"
export const apiClientSignUp = baseURL + "/signup"
export const apiClientResetEmail = baseURL + "/forgot"
export const apiClientResetPassword = baseURL + "/reset"
export const apiClientProfile = baseURL + "/u"
export const apiClientProfileChange = baseURL + "/u/personal"
export const apiClientOccasions = baseURL + "/u/events"
export const apiClientRegistrations = baseURL + "/u/registrations"

/* FULLCALENDAR KEY */
export const FKEY = "0671443620-fcs-1624419667"
export const BUSINESS_OPEN_TIME = "07:00:00"
export const BUSINESS_CLOSE_TIME = "21:00:00"
export const BUSINESS_INTERVAL_TIME_LABEL = "00:15:00"
export const BUSINESS_INTERVAL_TIME = "00:15:00"
export const BUSINESS_INTERVAL_TIME_VALUE = 15 //MUST BE MINUTE | 15 | 30 | 45 | 60

/* ALERT MESSAGES */
export const errorLoginMismatchMsg =
  "メールアドレスまたはパスワードが間違っています"
export const errorPasswordMismatchMsg = "パスワードが間違っています"
export const errorSystemMsg = "システムエラー"
export const errorSystemDetailMsg =
  "ご不便をおかけして申し訳ありません。 システムに障害が発生しました"
export const errorSessionMsg = "もう一度ログインしてください"
export const errorPermissionMsg = "許可が足りない"
export const error404Msg =
  "申し訳ありませんが、アクセスしたページは存在しません。"
export const errorLine403Msg = "LINEアプリからアクセスしてください"
export const errorUniqueMsg = "この電話番号はすでに登録されています "
export const errorQrWrongMsg = "QRコードが違います、再度ご確認ください"
export const errorQrAlreadyUsedMsg =
  "QRコードはすでに読み取られているため使えません"
export const errorQrNotExistMsg = "QRコードが存在しません"
export const warnRegistrationFullMsg =
  "ご不便をおかけして申し訳ありませんが、利用可能な空席が変更されたため、画面が自動的に更新されます"
export const warnRegistrationOverlapMsg =
  "別の予約時間と重なっているため、こちらの予約ができません"
export const warnRegistrationZeroMsg =
  "申し訳ございませんが、空席でのご参加はできません"
export const warnAlreadyParticipatedMsg =
  "ご不便をおかけして申し訳ありませんが、すでに参加されているため、画面は自動的にメイン画面に変わります"
export const warnNoAvailableSpaceMsg =
  "申し訳ありませんが、今は満員になりましたので、他の曜日または時間を選択してください"
export const warnNotEnoughAvailableSpaceMsg =
  "申し訳ございませんが、ご希望の人数では予約出来る時間帯が空いておりません"
export const warnNotEnoughMaxParticipantMsg =
  "参加可能最大人数は現在の登録した人数より少ないです"
export const warnNotZeroParticipantMsg =
  "参加可能最大人数は少なくとも0より大きくなければなりません"
export const warnNoSelectedReservationTimeMsg =
  "申し訳ございませんが、ご希望の時間を選択してください"
export const warnReservationOverLimitMsg =
  "予約者の人数は1台のテーブルに座れる最大人数を超えています"
export const warnNoMoreAvailableSeatMsg =
  "空席がありませんので、別の時間をお選びください"
export const warnTimeNotSelectedMsg = "検査時間を選択してください"
export const warnDateNotSelectableMsg =
  "この日は空席がありませんので、他の日を選択してください"
export const warnDateNotSelectedMsg = "検査日を選択してください"
export const warnAgreementNotCheckedMsg =
  "プライバシーポリシーに同意してください"
export const warnWrongPostalMsg = "郵便番号を確認してください"
export const warnEmailAlreadyExist = "メールアドレスはすでに存在します"
export const warnEmailNotExist = "メールアドレスは存在しません"
export const warnTokenUsed =
  "このトークンは利用できません。もう一度新しいものをリクエストしてください"
export const warnTooManyRequest =
  "短時間に送信されるリクエストが多すぎます。 しばらく待ってから、もう一度送信してください"
export const warnTooManyLoginRequest =
  "短時間にログインリクエストが多すぎます。 しばらく待ってから、もう一度ログインしてください"
export const warnSameDayReserveMsg = "同日にPCRと抗原検査の両方予約ができません"
export const successLoginMsg = "ログインしました。"
export const successLogoutMsg = "ログアウトしました。"
export const successMakeMsg = "作成成功"
export const successCreateMsg = "登録成功"
export const successCreateRegistrationMsg = "ユーザー情報登録成功"
export const successCreateParticipationMsg = "参加成功"
export const successUpdateMsg = "変更成功"
export const successSaveMsg = "保存成功"
export const successDeleteMsg = "削除成功"
export const successSentMsg = "確認メールを送信しました。"
export const successCancelMsg = "予約をキャンセルしました。"
export const successQrEventMsg = "QR読み取り成功"
export const successSyncAudienceMsg = "オーディエンス同期成功"
export const socketEventDeleteMsg = "別の管理者がこのイベントを削除しました"
export const socketOccurrenceUpdateMsg = "別の管理者がこの時間を変更しました"
export const socketLiffEventDeleteMsg =
  "ご不便をおかけして申し訳ありませんが、イベントを削除しました"
export const socketLiffEventUpdateMsg =
  "ご不便をおかけして申し訳ありませんが、イベントを変更しました"

export const getAddressByZipCode = (postalCode) => {
  const p3 = postalCode.substr(0, 3)

  return fetch(`https://yubinbango.github.io/yubinbango-data/data/${p3}.js`)
    .then((response) => response.text())
    .then((text) => text)
    .catch((error) => {})
}

export const checkIsEventFull = (expected, attended) => {
  return expected > 0 && attended > 0 && expected === attended
}

/* AXIOS CONFIG */
export const axiosInstance = axios.create({
  withCredentials: true,
  baseURL: baseURL,
})

/* CHECK MOUNTED REACT */
export function useIsMountedRef() {
  const isMountedRef = useRef(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => (isMountedRef.current = false)
  })

  return isMountedRef
}

export function insertCharacter(str, index, value) {
  return str.substr(0, index) + value + str.substr(index)
}

export class NumericInput extends React.Component {
  onChange = (e) => {
    const { value } = e.target
    const reg = /^-?\d*(\.\d*)?$/

    if ((!isNaN(value) && reg.test(value)) || value === "" || value === "-") {
      this.props.onChange(value)
    }
  }

  render() {
    return (
      <Input
        {...this.props}
        onChange={this.onChange}
        onPressEnter={(e) => e.preventDefault()}
      />
    )
  }
}

export const OCCASION_TYPE_PCR = "pcr"
export const OCCASION_TYPE_ANTIGEN = "antigen"

export const OCCASION_TYPE_PCR_TEXT = "PCR検査"
export const OCCASION_TYPE_ANTIGEN_TEXT = "抗原定性検査"

export const OCCASION_TYPES = [
  { label: "PCR検査", value: "pcr" },
  { label: "抗原定性検査", value: "antigen" },
]

export const GENDER = [
  { label: "男性", value: "male" },
  { label: "女性", value: "female" },
]

export const INSPECTION_PURPOSES = [
  {
    label: (
      <p>
        1.イベント・飲食・旅行・帰省等の経済社会活動を行うに当たり、必要であるため（ワクチン・検査パッケージ等）※
        2.に該当する場合を除く
      </p>
    ),
    value: 1,
    disable: true,
  },
  {
    label: "2.都道府県知事から要請を受けて、感染不安があるため",
    value: 2,
    disable: false,
  },
  {
    label: (
      <p>
        3.その他　<span className="text-red-600">（有料検査となります）</span>
      </p>
    ),
    value: 3,
    disable: false,
  },
]

export const VACCINATED_OPTIONS = [
  {
    label: "はい",
    value: 1,
  },
  {
    label: "いいえ",
    value: 2,
  },
]

export const UNVACCINATED_REASONS = [
  { label: "12歳未満である", value: 1 },
  { label: "健康上の理由（副反応等の為、2回目を断念された方。）", value: 2 },
  { label: "その他（自己の意思等）", value: 3 },
]

export const getTypeByValue = (value) => {
  switch (value) {
    case "pcr":
      return "PCR検査"
    case "antigen":
      return "抗原定性検査"
    default:
      return "ー"
  }
}

export const getGenderByValue = (value) => {
  switch (value) {
    case "male":
      return "男性"
    case "female":
      return "女性"
    default:
      return "ー"
  }
}

export const getInspectionPurposeByValue = (value) => {
  switch (value) {
    case 1:
      return "イベント・飲食・旅行・帰省等の経済社会活動を行うに当たり、必要であるため（ワクチン・検査パッケージ等）"
    case 2:
      return "都道府県知事から要請を受けて、感染不安があるため"
    case 3:
      return "その他"
    default:
      return "ー"
  }
}

export const getVaccinatedOptionByValue = (value) => {
  switch (value) {
    case 1:
      return "はい"
    case 2:
      return "いいえ"
    default:
      return "ー"
  }
}

export const getUnvaccinatedReasonByValue = (value) => {
  switch (value) {
    case 1:
      return "12歳未満である"
    case 2:
      return "健康上の理由（副反応等の為、2回目を断念された方。）"
    case 3:
      return "その他（自己の意思等）"
    default:
      return "ー"
  }
}

export const PREFECTURES = [
  { value: 1, label: "北海道" },
  { value: 2, label: "青森県" },
  { value: 3, label: "岩手県" },
  { value: 4, label: "宮城県" },
  { value: 5, label: "秋田県" },
  { value: 6, label: "山形県" },
  { value: 7, label: "福島県" },
  { value: 8, label: "茨城県" },
  { value: 9, label: "栃木県" },
  { value: 10, label: "群馬県" },
  { value: 11, label: "埼玉県" },
  { value: 12, label: "千葉県" },
  { value: 13, label: "東京都" },
  { value: 14, label: "神奈川県" },
  { value: 15, label: "新潟県" },
  { value: 16, label: "富山県" },
  { value: 17, label: "石川県" },
  { value: 18, label: "福井県" },
  { value: 19, label: "山梨県" },
  { value: 20, label: "長野県" },
  { value: 21, label: "岐阜県" },
  { value: 22, label: "静岡県" },
  { value: 23, label: "愛知県" },
  { value: 24, label: "三重県" },
  { value: 25, label: "滋賀県" },
  { value: 26, label: "京都府" },
  { value: 27, label: "大阪府" },
  { value: 28, label: "兵庫県" },
  { value: 29, label: "奈良県" },
  { value: 30, label: "和歌山県" },
  { value: 31, label: "鳥取県" },
  { value: 32, label: "島根県" },
  { value: 33, label: "岡山県" },
  { value: 34, label: "広島県" },
  { value: 35, label: "山口県" },
  { value: 36, label: "徳島県" },
  { value: 37, label: "香川県" },
  { value: 38, label: "愛媛県" },
  { value: 39, label: "高知県" },
  { value: 40, label: "福岡県" },
  { value: 41, label: "佐賀県" },
  { value: 42, label: "長崎県" },
  { value: 43, label: "熊本県" },
  { value: 44, label: "大分県" },
  { value: 45, label: "宮崎県" },
  { value: 46, label: "鹿児島県" },
  { value: 47, label: "沖縄県" },
]
