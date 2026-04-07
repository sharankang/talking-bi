import axios from 'axios'

const BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://13.201.7.113:8000"


export const exploreData = (dbUrl) =>
  axios.post(`${BASE}/explore`, { db_url: dbUrl })

export const analyseQuery = (query, dbUrl) =>
  axios.post(`${BASE}/analyse`, { query, db_url: dbUrl })

export const sendChat = (message, dashboardContext, history, dbUrl) =>
  axios.post(`${BASE}/chat`, {
    message,
    dashboard_context: dashboardContext,
    history,
    db_url: dbUrl,
  })

export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${BASE}/upload`, formData)
}

export const getSessions = () =>
  axios.get(`${BASE}/sessions`)

export const getSession = (id) =>
  axios.get(`${BASE}/sessions/${id}`)

export const saveSession = (data) =>
  axios.post(`${BASE}/sessions`, data)

export const deleteSession = (id) =>
  axios.delete(`${BASE}/sessions/${id}`)