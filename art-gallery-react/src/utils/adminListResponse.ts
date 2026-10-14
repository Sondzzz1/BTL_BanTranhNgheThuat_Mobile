// These get-all APIs return a complete array, not a pagination envelope.
// Reject mismatched responses instead of rendering an undefined list or a
// silently truncated page as if it were the complete data set.
export function requireAdminList<T>(data: unknown): T[] {
  if (!Array.isArray(data)) {
    throw new Error('Dữ liệu danh sách từ máy chủ không hợp lệ. Vui lòng khởi động lại backend và thử lại.');
  }
  return data;
}
