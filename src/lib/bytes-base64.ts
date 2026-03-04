export const base64ToBytes = (base64: string) => {
  const decoded = atob(base64)
  const bytes = new Uint8Array(decoded.length)

  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }

  return bytes
}

export const bytesToBase64 = (bytes: Uint8Array) => {
  let string = ""

  for (let i = 0; i < bytes.length; i++) {
    string += String.fromCharCode(bytes[i])
  }

  return btoa(string)
}
