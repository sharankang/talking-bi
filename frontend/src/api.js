import axios from 'axios'

const BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://13.201.7.113:8000"

export const exploreData = () =>
  axios.get(`${BASE}/explore`)

export const analyseQuery = (query) =>
  axios.post(`${BASE}/analyse`, { query })

export const sendChat = (message, dashboardContext, history) =>
  axios.post(`${BASE}/chat`, {
    message,
    dashboard_context: dashboardContext,
    history
  })

export const getSessions = () =>
  axios.get(`${BASE}/sessions`)

export const getSession = (id) =>
  axios.get(`${BASE}/sessions/${id}`)

export const saveSession = (data) =>
  axios.post(`${BASE}/sessions`, data)

export const deleteSession = (id) =>
  axios.delete(`${BASE}/sessions/${id}`)