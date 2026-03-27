import axios from 'axios'

const BASE = 'http://localhost:8000'

export const exploreData = () =>
  axios.get(`${BASE}/explore`)

export const parseIntent = (userInput) =>
  axios.post(`${BASE}/parse-intent`, { user_input: userInput })

export const generateDashboards = (intent) =>
  axios.post(`${BASE}/generate-dashboards`, intent)

export const sendChat = (message, dashboardContext, history) =>
  axios.post(`${BASE}/chat`, {
    message,
    dashboard_context: dashboardContext,
    history
  })