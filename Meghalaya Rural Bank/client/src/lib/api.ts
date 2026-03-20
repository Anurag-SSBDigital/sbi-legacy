import { paths } from '@/types/api/v1.js'
import createFetchClient, { Middleware } from 'openapi-fetch'
import createClient from 'openapi-react-query'
import { useAuthStore } from '@/stores/authStore.ts'

const BASE_URL = import.meta.env.VITE_APP_API_URL

const fetchClient = createFetchClient<paths>({
  baseUrl: BASE_URL,
})

const authMiddleWare: Middleware = {
  async onRequest({ request }) {
    const token = sessionStorage.getItem('token')
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      sessionStorage.removeItem('token')
      useAuthStore.setState({})
    }
  },
}

fetchClient.use(authMiddleWare)

const $api = createClient(fetchClient)

export { fetchClient, $api, BASE_URL }
