export function uploadFormWithProgress(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      let payload: Record<string, unknown> = {}
      try {
        payload = JSON.parse(xhr.responseText) as Record<string, unknown>
      } catch {
        payload = {}
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload)
        return
      }
      reject(new Error(typeof payload.error === 'string' ? payload.error : 'Upload failed.'))
    }
    xhr.onerror = () => reject(new Error('Upload failed.'))
    xhr.send(form)
  })
}
