// Deterministic Vietnamese (80%) and Foreign (20%) Name Generator

const VIETNAMESE_NAMES = [
  'Nguyễn Văn Nam',
  'Lê Thị Minh',
  'Trần Quốc Bảo',
  'Đặng Kim Ngân',
  'Phạm Đức Anh',
  'Vũ Thùy Linh',
  'Hoàng Gia Huy',
  'Bùi Minh Trí',
  'Đỗ Mai Phương',
  'Trịnh Khánh Linh',
  'Ngô Hoàng Nam',
  'Phan Thanh Hằng',
  'Hồ Đức Thắng',
  'Dương Kim Chi',
  'Đinh Văn Hùng',
  'Nguyễn Thảo Nhi',
  'Nguyễn Tuấn Kiệt',
  'Phạm Ngọc Mai',
  'Lê Hoàng Hải',
  'Vũ Thanh Tâm',
  'Đặng Phương Thảo',
  'Trần Minh Đức',
  'Nguyễn Hoàng Yến',
  'Phan Bảo Long',
  'Bùi Khánh Vân',
  'Ngô Đức Trí',
  'Hoàng Thị Ngọc',
  'Lê Văn Hùng',
]

const FOREIGN_NAMES = [
  'Gordon Ramsay',
  'Jamie Oliver',
  'Marco Pierre',
  'Chloe Bennett',
  'Alain Ducasse',
  'Thomas Keller',
  'Wolfgang Puck',
  'Paul Bocuse',
  'Massimo Bottura',
  'Heston Blumenthal',
]

/**
 * Returns a human-friendly Vietnamese (80%) or Foreign (20%) name given a userId or index.
 * Accepts string, number, null, or undefined.
 */
export function getVietnameseOrForeignName(
  userId?: number | string | null,
  originalName?: string | null,
): string {
  if (originalName && originalName.trim()) {
    const trimmed = originalName.trim()
    const isGeneric =
      /^\d+$/i.test(trimmed) ||
      /^User\s*#?\s*\d+$/i.test(trimmed) ||
      /^Đầu bếp\s*#?\s*\d+$/i.test(trimmed) ||
      /^Faker\s*#?\s*\d+$/i.test(trimmed) ||
      /^User\s*\d+$/i.test(trimmed) ||
      trimmed === 'Ẩn danh'

    if (!isGeneric) return trimmed
  }

  // Parse ID or hash string
  let numericId = 0
  if (typeof userId === 'number') {
    numericId = userId
  } else if (typeof userId === 'string') {
    numericId = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  } else if (originalName) {
    numericId = originalName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }

  if (!numericId) numericId = 42

  // 80% Vietnamese, 20% Foreign determination
  const isForeign = (numericId % 10) >= 8 // 8 and 9 (2 out of 10 = 20%)

  if (isForeign) {
    const foreignIndex = Math.abs(numericId) % FOREIGN_NAMES.length
    return FOREIGN_NAMES[foreignIndex]
  } else {
    const vnIndex = Math.abs(numericId) % VIETNAMESE_NAMES.length
    return VIETNAMESE_NAMES[vnIndex]
  }
}
