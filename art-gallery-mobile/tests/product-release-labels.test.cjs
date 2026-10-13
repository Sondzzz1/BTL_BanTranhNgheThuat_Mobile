const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const ts = require('typescript');

function loadUtility(relativePath, requireStub = name => { throw new Error(`Unexpected import: ${name}`); }) {
  const filename = path.join(__dirname, '..', relativePath);
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { require: requireStub, module, exports: module.exports }, { filename });
  return module.exports;
}

// Render the real JSX with host-component stubs; no native runtime or API calls.
function loadComponent(relativePath, { product, copyright = null } = {}) {
  const filename = path.join(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  let stateIndex = 0;
  const react = {
    ...React,
    useEffect() {},
    useState(initial) {
      // ProductDetailScreen: product, suggestions/latest/best/content,
      // copyright, then loading. Other state retains its initial value.
      const index = stateIndex++;
      const value = index === 0 ? product
        : index === 5 ? copyright
          : index === 6 ? false : initial;
      return [value, () => {}];
    },
  };
  const native = { StyleSheet: { create: value => value } };
  for (const name of ['View', 'Text', 'Image', 'TouchableOpacity', 'ScrollView', 'ActivityIndicator']) {
    native[name] = name;
  }
  const module = { exports: {} };
  const requireStub = name => {
    if (name === 'react') return react;
    if (name === 'react-native') return native;
    if (name.endsWith('/utils/currency')) return { formatVnd: value => `${value} đ` };
    if (name.endsWith('/utils/saleEligibility')) return loadUtility('utils/saleEligibility.ts');
    if (name.endsWith('/context/AuthContext')) {
      return { useAuth: () => ({ user: null, isAuthenticated: false }) };
    }
    if (name.includes('/components/') || name === './FavoriteButton') {
      return { __esModule: true, default: name.split('/').pop() };
    }
    if (name.includes('/services/') || name.endsWith('/constants/colors')) return {};
    throw new Error(`Unexpected import: ${name}`);
  };
  vm.runInNewContext(source, { require: requireStub, module, exports: module.exports }, { filename });
  return module.exports.default;
}

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  return textContent(node.props?.children);
}

const baseProduct = {
  maTacPham: 35,
  tenTacPham: 'Hạ bừng nở',
  tenHoaSi: 'Trịnh Tuấn',
  gia: 2000000,
  soLuong: 20,
  soLuongBanDau: 20,
  laTacPhamDocBan: false,
  canSell: true,
};

for (const quantity of [20, 0]) {
  test(`multiple-edition card has no declaration label, stock=${quantity}`, () => {
    const product = { ...baseProduct, soLuong: quantity };
    const Card = loadComponent('components/ProductCard.tsx');
    let pressed = false;
    const tree = Card({ product, onPress: () => { pressed = true; } });
    const text = textContent(tree);
    assert.doesNotMatch(text, /Khai báo|ban đầu/);
    assert.equal(text.includes('Hết hàng'), quantity === 0);
    tree.props.onPress();
    assert.equal(pressed, true);
  });

  test(`multiple-edition detail has no declaration label, stock=${quantity}`, () => {
    const product = { ...baseProduct, soLuong: quantity };
    const Detail = loadComponent('app/products/ProductDetailScreen.tsx', { product });
    const text = textContent(Detail({ route: { params: { id: 35 } }, navigation: {} }));
    assert.doesNotMatch(text, /Khai báo nhiều bản|Khai báo độc bản|ban đầu 20 bản/);
    assert.equal(text.includes('Hết hàng'), quantity === 0);
    assert.equal(text.includes('Mua ngay'), quantity > 0);
    assert.equal(text.includes('Thêm vào giỏ'), quantity > 0);
  });
}

test('exclusive card retains its declaration even when sold out', () => {
  const Card = loadComponent('components/ProductCard.tsx');
  const text = textContent(Card({
    product: { ...baseProduct, laTacPhamDocBan: true, soLuongBanDau: 1, soLuong: 0 },
    onPress() {},
  }));
  assert.match(text, /Khai báo độc bản/);
  assert.match(text, /Hết hàng/);
});

for (const verified of [false, true]) {
  test(`exclusive detail retains the correct verification label, verified=${verified}`, () => {
    const product = { ...baseProduct, laTacPhamDocBan: true, soLuongBanDau: 1, soLuong: 1 };
    const copyright = verified
      ? { trangThai: 'VERIFIED', laTacPhamDocBan: true, soLuongBanDau: 1 }
      : null;
    const Detail = loadComponent('app/products/ProductDetailScreen.tsx', { product, copyright });
    const text = textContent(Detail({ route: { params: { id: 35 } }, navigation: {} }));
    assert.match(text, verified ? /Độc bản đã xác minh/ : /Khai báo độc bản · chưa xác minh/);
    assert.doesNotMatch(text, /Khai báo nhiều bản/);
  });
}

test('missing edition flag does not imply an exclusive declaration', () => {
  const product = { ...baseProduct, laTacPhamDocBan: undefined };
  const Card = loadComponent('components/ProductCard.tsx');
  const Detail = loadComponent('app/products/ProductDetailScreen.tsx', { product });
  assert.doesNotMatch(textContent(Card({ product, onPress() {} })), /Khai báo/);
  assert.doesNotMatch(textContent(Detail({ route: { params: { id: 35 } }, navigation: {} })), /Khai báo/);
});

for (const permission of [false, undefined]) {
  test(`sale permission=${permission} hides buying controls but keeps the artwork visible`, () => {
    const product = { ...baseProduct, canSell: permission, saleReason: 'RIGHTS_PENDING', saleMessage: 'Đang hoàn thiện xác minh nguồn gốc và quyền sử dụng.' };
    const Detail = loadComponent('app/products/ProductDetailScreen.tsx', { product });
    const text = textContent(Detail({ route: { params: { id: 35 } }, navigation: {} }));
    assert.match(text, /Hạ bừng nở/);
    assert.match(text, /Đang hoàn thiện xác minh/);
    assert.doesNotMatch(text, /Mua ngay|Thêm vào giỏ/);
  });
}

test('unavailable or excessive-quantity cart lines cannot be selected for checkout', () => {
  const { canCheckoutItem } = loadUtility('utils/saleEligibility.ts');
  const item = { canSell: true, canCheckout: true, soLuong: 1, soLuongTon: 3 };
  assert.equal(canCheckoutItem(item), true);
  assert.equal(canCheckoutItem({ ...item, canSell: false, canCheckout: false }), false);
  assert.equal(canCheckoutItem({ ...item, soLuong: 4 }), false);
  assert.equal(canCheckoutItem({ ...item, canCheckout: undefined }), false);
});

test('backend checkout rejection reaches the mobile UI as a readable error', async () => {
  const { orderService } = loadUtility('services/orderService.ts', name => {
    if (name === './api') return { __esModule: true, default: { post: async () => {
      throw { response: { status: 409, data: { message: 'Tác phẩm hiện không khả dụng để mua.' } } };
    } } };
    if (name === '../constants/api') return { API_ENDPOINTS: { ORDER_CREATE: '/don-hang/tao' } };
    throw new Error(name);
  });
  await assert.rejects(orderService.createOrder('Fixture', '0901234567', 'Address'), /Tác phẩm hiện không khả dụng để mua/);
});
