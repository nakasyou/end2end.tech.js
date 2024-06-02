/**
 * result for uploading
 */
export interface UploadResultSuccess {
  /**
   * Is Success
   */
  success: true
  /**
   * File ID
   */
  id: string
  /**
   * File name
   */
  name: string

  /**
   * Hash by SHA256
   */
  sha256: string

  /**
   * Password for deleting
   */
  deletePassword: string
}
/**
 * Upload result when error
 */
export interface UploadResultError {
  /**
   * Is Success
   */
  success: false
  /**
   * Error message
   */
  error: string
}
/**
 * Upload Init
 */
export interface UploadOpts {
  /**
   * Server blocks VPN and Tor request when this flag is true.
   */
  blockVPN?: boolean

  /**
   * You can set Download limit by download count. Limit is infinity when this option is undefined.
   */
  countLimit?: number

  /**
   * You can set Download limit by date. Limit is infinity when this option is undefined.
   */
  dateLimit?: Date
}

interface UploadFunction {
  (
    file: ArrayBuffer | Blob | Response | Uint8Array,
    opts?: UploadOpts,
  ): Promise<UploadResultSuccess | UploadResultError>
}

/**
 * Upload File
 * @param file Target file
 */
export const upload: UploadFunction = async (
  file,
  opts = {},
) => {
  const data = new FormData()

  const blob: Blob = file instanceof Blob ? file : file instanceof Response ? await file.blob() : new Blob([file])
  data.append('file', blob)

  if (opts.blockVPN) {
    data.append('blockVPN', 'on')
  }
  if (opts.countLimit) {
    data.append('setLimitDownload', 'on')
    data.append('maxDownloadCount', opts.countLimit.toString())
  }
  if (opts.dateLimit) {
    data.append('setDateLimit', 'on')
    data.append('DownloadLimit', opts.dateLimit.toISOString())
  }

  const json = await fetch('https://api.end2end.tech/upload', {
    body: data,
    method: 'POST'
  }).then((res) => res.json())

  if ('Error' in json) {
    return {
      error: json.Error,
      success: false
    }
  }
  // Success
  return {
    success: true,
    
    deletePassword: json.RemovePassword,
    sha256: json.SHA256,
    id: json.FileID,
    name: json.FileName
  }
}

interface RemoveFunction {
  (successData: UploadResultSuccess): Promise<void>
  (id: string, deletePassword: string): Promise<void>
}

/**
 * Remove File
 */
export const remove: RemoveFunction = async (arg1: string | UploadResultSuccess, deletePwd?: string) => {
  const isReceiveId = typeof arg1 === 'string'
  const id = isReceiveId ? arg1 : (arg1 as UploadResultSuccess).id
  const pwd = isReceiveId ? (deletePwd as string) : (arg1 as UploadResultSuccess).deletePassword
  await fetch(`https://api.end2end.tech/delete?id=${id}&password=${pwd}`)
}

/**
 * Download File
 */
export const download = async (from: string | UploadResultSuccess): Promise<Response> => {
  return await fetch(`https://api.end2end.tech/download?id=${typeof from === 'string' ? from : from.id}`)
}
