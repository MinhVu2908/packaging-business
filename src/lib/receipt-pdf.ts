import fs from 'fs'
import path from 'path'
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb, type PDFFont } from 'pdf-lib'

type PdfDocWithFontkit = {
  registerFontkit: (fk: typeof fontkit) => void
}

function registerFontkitOnDocument(pdf: PDFDocument): void {
  ;(pdf as unknown as PdfDocWithFontkit).registerFontkit(fontkit)
}

/**
 * One full Noto Sans TTF (Latin + Vietnamese + punctuation) embedded once.
 * Mixing multiple WOFF2 subset fonts and drawing char-by-char can produce wrong
 * PDF glyph→Unicode mapping (e.g. "a" → "U", "." → '"').
 */
const NOTO_SANS_REGULAR = path.join(
  process.cwd(),
  'node_modules',
  'notosans-fontface',
  'fonts',
  'NotoSans-Regular.ttf'
)

function wrapToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = words[0]!
  for (let i = 1; i < words.length; i++) {
    const word = words[i]!
    const test = `${current} ${word}`
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test
    } else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}

export type ReceiptLineInput = {
  stt: number
  poNumber: string
  quantity: number
  unitPrice: number
  lineTotal: number
  productName: string
}

export type ReceiptPdfInput = {
  vendorName: string
  customerCompany: string
  customerExtra?: string
  orderId: string
  orderDate: Date
  line: ReceiptLineInput
}

function formatMoney(n: number): string {
  const s = n.toLocaleString('vi-VN').replace(/\u202f|\u00a0/g, ' ')
  return `${s} đ`
}

export async function buildSingleLineReceiptPdf(input: ReceiptPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  registerFontkitOnDocument(pdf)

  const fontBytes = fs.readFileSync(NOTO_SANS_REGULAR)
  const font = await pdf.embedFont(fontBytes)

  const page = pdf.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const margin = 48
  let y = height - margin
  const lh = 16
  const textWidth = width - 2 * margin

  const line = (s: string, size = 11, color = rgb(0.12, 0.14, 0.18)) => {
    page.drawText(s, { x: margin, y, size, font, color })
    y -= lh
  }

  const block = (s: string, size: number, color: ReturnType<typeof rgb>, lineHeight: number) => {
    const lines = wrapToWidth(s.trim(), font, size, textWidth)
    page.drawText(lines.join('\n'), { x: margin, y, size, font, color, lineHeight })
    y -= lines.length * lineHeight
  }

  line(input.vendorName, 16, rgb(0, 0, 0))
  y -= 4
  line('Tên công ty khách hàng / thông tin:', 10, rgb(0.35, 0.38, 0.42))
  block(input.customerCompany, 12, rgb(0.12, 0.14, 0.18), lh)
  if (input.customerExtra?.trim()) {
    block(input.customerExtra.trim(), 10, rgb(0.12, 0.14, 0.18), 14)
  }
  y -= 8
  line(`Mã đơn: ${input.orderId}`, 10)
  line(`Ngày lập: ${input.orderDate.toLocaleDateString('vi-VN')}`, 10)
  y -= 12

  line('Bảng kê (1 dòng = 1 hóa đơn theo PO #)', 11, rgb(0, 0, 0))
  y -= 6

  const tableY = y
  const rowH = 22
  page.drawRectangle({
    x: margin,
    y: tableY - rowH - 28,
    width: width - 2 * margin,
    height: rowH + 52,
    borderColor: rgb(0.75, 0.78, 0.82),
    borderWidth: 1,
  })

  const hy = tableY - 14
  const headerColor = rgb(0.25, 0.28, 0.32)
  page.drawText('Stt', { x: margin + 8, y: hy, size: 9, font, color: headerColor })
  page.drawText('PO #', { x: margin + 44, y: hy, size: 9, font, color: headerColor })
  page.drawText('Số lượng', { x: margin + 248, y: hy, size: 9, font, color: headerColor })
  page.drawText('Đơn giá', { x: margin + 318, y: hy, size: 9, font, color: headerColor })
  page.drawText('Thành tiền', { x: margin + 410, y: hy, size: 9, font, color: headerColor })

  page.drawLine({
    start: { x: margin, y: tableY - rowH - 2 },
    end: { x: width - margin, y: tableY - rowH - 2 },
    thickness: 0.5,
    color: rgb(0.82, 0.84, 0.88),
  })

  const dy = tableY - rowH - 18
  const bodyColor = rgb(0.12, 0.14, 0.18)
  page.drawText(String(input.line.stt), { x: margin + 8, y: dy, size: 10, font, color: bodyColor })
  page.drawText(input.line.poNumber, {
    x: margin + 44,
    y: dy,
    size: 8,
    font,
    color: bodyColor,
    maxWidth: 190,
    lineHeight: 10,
  })
  page.drawText(String(input.line.quantity), { x: margin + 248, y: dy, size: 10, font, color: bodyColor })
  page.drawText(formatMoney(input.line.unitPrice), { x: margin + 318, y: dy, size: 10, font, color: bodyColor })
  page.drawText(formatMoney(input.line.lineTotal), { x: margin + 410, y: dy, size: 10, font, color: bodyColor })

  y = tableY - rowH - 40
  const productBlock = `Sản phẩm: ${input.line.productName}`
  const productLines = wrapToWidth(productBlock, font, 9, textWidth - 16)
  page.drawText(productLines.join('\n'), {
    x: margin + 8,
    y,
    size: 9,
    font,
    color: rgb(0.35, 0.38, 0.42),
    lineHeight: 12,
  })
  y -= productLines.length * 12 + 16

  page.drawText('Tổng', { x: margin + 318, y, size: 12, font, color: bodyColor })
  page.drawText(formatMoney(input.line.lineTotal), { x: margin + 410, y, size: 12, font, color: bodyColor })

  page.drawText('Siêu Thị Giấy — Hóa đơn từng dòng (theo dõi bằng PO #)', {
    x: margin,
    y: 36,
    size: 8,
    font,
    color: rgb(0.5, 0.52, 0.55),
    maxWidth: textWidth,
    lineHeight: 10,
  })

  return pdf.save()
}
