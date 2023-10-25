const RESPONSE_SUCCESS = 200
const SYSTEM_ERROR = 500
const BAD_REQUEST = 400
const CONFLICT_ERROR = 409
const PERMISSION_ERROR = 401 //not enough authorization
const SESSION_ERROR = 403 //no-session
const NOT_ACCEPTABLE = 406 //not acceptable

const SESSION_EXPIRE_TIME = 86400000 //1 day
type occasionType ='pcr' | 'antigen'
export {
    RESPONSE_SUCCESS, SYSTEM_ERROR, BAD_REQUEST, CONFLICT_ERROR, PERMISSION_ERROR, SESSION_ERROR, NOT_ACCEPTABLE,
    SESSION_EXPIRE_TIME,
    occasionType
}