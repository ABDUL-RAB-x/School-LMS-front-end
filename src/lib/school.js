import endpoints from './api.js'

// School name/contact for document headers: fetched once, refreshed after Settings are saved
let schoolPromise = null

export function schoolInfo() {
  if (!schoolPromise) {
    schoolPromise = endpoints.settings
      .get()
      .then((res) => res.data?.school ?? {})
      .catch(() => ({}))
  }
  return schoolPromise
}

export function forgetSchoolInfo() {
  schoolPromise = null
}
