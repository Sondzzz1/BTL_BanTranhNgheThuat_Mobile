export {};
const mockResponseUse = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { create: () => ({
  interceptors: { request: { use: jest.fn() }, response: { use: mockResponseUse } },
}) } }));
// Load after defining the interceptor capture.
require('./api');
const reject = mockResponseUse.mock.calls[0][1];

afterEach(() => jest.restoreAllMocks());
test('only expected optional public-detail GET 404 bypasses error logging', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const missing = { response: { status: 404 }, config: { method: 'get', url: '/public/tac-pham/7/chi-tiet' } };
  await expect(reject(missing)).rejects.toBe(missing);
  expect(error).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
  const unrelated = { ...missing, config: { method: 'get', url: '/public/tranh/7' } };
  await expect(reject(unrelated)).rejects.toBe(unrelated);
  expect(error).toHaveBeenCalled();
});

test('500 and forbidden responses still use normal error handling', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  for (const status of [403, 500]) {
    const failure = { response: { status }, config: { method: 'get', url: '/public/tac-pham/7/chi-tiet' } };
    await expect(reject(failure)).rejects.toBe(failure);
  }
  expect(error).toHaveBeenCalledTimes(3); // 500 also logs its server-error diagnostic.
});
