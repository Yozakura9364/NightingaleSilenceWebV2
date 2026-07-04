export interface StoredZipFileEntry {
  name: string
  bytes: Uint8Array
}

interface CentralDirectoryEntry extends StoredZipFileEntry {
  crc: number
  localHeaderOffset: number
  nameBytes: Uint8Array
}

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50
const ZIP_END_SIGNATURE = 0x06054b50
const ZIP_VERSION_NEEDED = 20
const ZIP_ENCODER = new TextEncoder()
const CRC32_TABLE = createCrc32Table()

export function createStoredZipBlob(files: StoredZipFileEntry[]) {
  const chunks: Uint8Array[] = []
  const centralDirectory: CentralDirectoryEntry[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = ZIP_ENCODER.encode(file.name)
    const crc = crc32(file.bytes)
    const localHeader = createLocalFileHeader(nameBytes, file.bytes.length, crc)

    chunks.push(localHeader, file.bytes)
    centralDirectory.push({
      ...file,
      crc,
      localHeaderOffset: offset,
      nameBytes
    })
    offset += localHeader.length + file.bytes.length
  }

  const centralDirectoryOffset = offset
  for (const file of centralDirectory) {
    const centralHeader = createCentralDirectoryHeader(file)

    chunks.push(centralHeader)
    offset += centralHeader.length
  }

  chunks.push(
    createEndOfCentralDirectory(
      centralDirectory.length,
      offset - centralDirectoryOffset,
      centralDirectoryOffset
    )
  )

  return new Blob(chunks, { type: 'application/zip' })
}

function createLocalFileHeader(nameBytes: Uint8Array, size: number, crc: number) {
  const header = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_LOCAL_FILE_HEADER_SIGNATURE, true)
  view.setUint16(4, ZIP_VERSION_NEEDED, true)
  view.setUint16(6, 0x0800, true)
  view.setUint16(8, 0, true)
  view.setUint32(14, crc, true)
  view.setUint32(18, size, true)
  view.setUint32(22, size, true)
  view.setUint16(26, nameBytes.length, true)
  header.set(nameBytes, 30)

  return header
}

function createCentralDirectoryHeader(file: CentralDirectoryEntry) {
  const header = new Uint8Array(46 + file.nameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_CENTRAL_DIRECTORY_SIGNATURE, true)
  view.setUint16(4, ZIP_VERSION_NEEDED, true)
  view.setUint16(6, ZIP_VERSION_NEEDED, true)
  view.setUint16(8, 0x0800, true)
  view.setUint16(10, 0, true)
  view.setUint32(16, file.crc, true)
  view.setUint32(20, file.bytes.length, true)
  view.setUint32(24, file.bytes.length, true)
  view.setUint16(28, file.nameBytes.length, true)
  view.setUint32(42, file.localHeaderOffset, true)
  header.set(file.nameBytes, 46)

  return header
}

function createEndOfCentralDirectory(fileCount: number, centralSize: number, centralOffset: number) {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_END_SIGNATURE, true)
  view.setUint16(8, fileCount, true)
  view.setUint16(10, fileCount, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)

  return header
}

function createCrc32Table() {
  const table = new Uint32Array(256)

  for (let index = 0; index < table.length; index += 1) {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }

    table[index] = value >>> 0
  }

  return table
}

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff

  for (const byte of bytes) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8)
  }

  return (value ^ 0xffffffff) >>> 0
}
