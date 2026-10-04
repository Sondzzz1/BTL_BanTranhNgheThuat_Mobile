const vndFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Hiển thị tiền Việt thống nhất: 1.000.000 ₫. */
export const formatVnd = (value: unknown): string => {
  const amount = Number(value);
  return `${vndFormatter.format(Number.isFinite(amount) ? Math.round(amount) : 0)} ₫`;
};
