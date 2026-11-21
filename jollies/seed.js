/* Starting data for the Jollies internal app.
   Taken from the "Our Bakeshop!" Drive folder (visible rows only; hidden rows skipped), 21 Nov 2026:
   [Jollies] Operations (Menu, Recipes, Inventory, Settings),
   [Jollies] Finance (Budget, Transaction - Make), [Jollies] Marketing (Targets),
   [Jollies] Management (Gantt).
   Sample/example rows from those sheets were left out on purpose. */
window.JOLLIES_SEED = {
  version: 2,
  settings: {
    bizName: 'Jollies',
    launchDate: '2026-12-03',
    shipDays: [1, 4],            // Mon, Thu (0 = Sun)
    cutoffDaysBefore: 1,         // cut-off is the evening before ship day
    cutoffTime: '20:00',
    shipTime: '12:00',
    countUnpaid: false,          // only paid orders reserve stock
    autoRecordPayments: true,    // marking an order Paid writes a Sales line in Finance
    salesAccount: 'scb',
    singlePack: { cost: 5, size: 4 },   // estimated packaging for single pieces: 5 THB per bag of up to 4
    activeShipOverride: '',
    accounts: [
      { id: 'kbank', name: 'KBank (Make) - investment', opening: 40000 },
      { id: 'scb', name: 'SCB - sales', opening: 0 }
    ],
    team: ['Fay', 'Didi', 'Nini', 'Niana', 'Ponnatcha', 'diditpn', 'meang_n'],
    deliveryMethods: ['Pickup', 'Grab Express', 'Thai Post', 'Other courier'],
    channels: ['Instagram', 'Facebook', 'TikTok', 'LINE OA', 'Friend / referral', 'Other'],
    incomeCategories: ['Sales', 'Shipping fee', 'Capital / other income']
  },

  // Visible rows of the Inventory tab. Pack prices are the real prices paid.
  inventory: [
    { id: 'butter', name: 'เนย Allowrie', unit: 'g', supplier: 'B-pack', packSize: 1000, packPrice: 190, opening: 1000, reorderPoint: 1000, target: 4000, leadDays: 1 },
    { id: 'lemonzest', name: 'ผิวเลม่อน', unit: 'g', supplier: '', packSize: 6, packPrice: 40, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'egg', name: 'ไข่', unit: 'g', supplier: '', packSize: 100, packPrice: 10.5, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'sugar', name: 'น้ำตาล', unit: 'g', supplier: '', packSize: 1000, packPrice: 40, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'honey', name: 'น้ำผึ้ง', unit: 'ml', supplier: '', packSize: 1000, packPrice: 199, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'realbutter', name: 'เนยแท้', unit: 'g', supplier: '', packSize: 1000, packPrice: 400, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'milk', name: 'นมสด', unit: 'ml', supplier: '', packSize: 450, packPrice: 28, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'cakeflour', name: 'แป้งเค้ก', unit: 'g', supplier: '', packSize: 1000, packPrice: 47, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'bakingpowder', name: 'ผงฟู', unit: 'g', supplier: '', packSize: 100, packPrice: 35, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'salt', name: 'เกลือ', unit: 'g', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'icing', name: 'ไอซิ่ง', unit: 'g', supplier: '', packSize: 1000, packPrice: 44, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'horlick', name: 'Horlick', unit: 'g', supplier: '', packSize: 270, packPrice: 269, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'hojicha', name: 'Hojicha', unit: 'g', supplier: '', packSize: 40, packPrice: 95, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'cookieflour', name: 'แป้งคุกกี้', unit: 'g', supplier: 'Shopee', packSize: 1000, packPrice: 80, opening: 1000, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'box', name: 'Packaging box', unit: 'pcs', supplier: 'Shopee', packSize: 60, packPrice: 1152, opening: 60, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'postbox', name: 'กล่องไปรษณีย์', unit: 'pcs', supplier: 'Shopee', packSize: 20, packPrice: 109, opening: 20, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'sticker', name: 'สติ๊กเกอร์ใส', unit: 'pcs', supplier: 'Shopee', packSize: 1440, packPrice: 49, opening: 1440, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'clearbag', name: 'ซองใส', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'paperbag', name: 'ถุงกระดาษ', unit: 'pcs', supplier: 'Shopee', packSize: 100, packPrice: 500, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'cookiebag', name: 'ซองขาวคุกกี้', unit: 'pcs', supplier: 'Shopee', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'card', name: 'การ์ด', unit: 'pcs', supplier: 'Tip', packSize: 1, packPrice: 2.25, opening: 0, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'logo', name: 'Sticker logo', unit: 'pcs', supplier: 'Tip', packSize: 1, packPrice: 2, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'label', name: 'Sticker label', unit: 'pcs', supplier: 'Tip', packSize: 1, packPrice: 1, opening: 0, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'parchmentcard', name: 'การ์ดกระดาษไข', unit: 'pcs', supplier: 'Tip', packSize: 1, packPrice: 1, opening: 0, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'eyelet', name: 'ตาไก่', unit: 'pcs', supplier: 'Local market', packSize: 100, packPrice: 35, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 },
    { id: 'wrap', name: 'กระดาษห่อขาว', unit: 'pcs', supplier: 'Local market', packSize: 800, packPrice: 650, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 }
  ],

  // estCost = estimated ingredient cost per piece (used for margins and P&L).
  // recipe = real raw materials per unit, used for stock tracking and the real-cost comparison.
  // A giftset's packCost is its estimated packaging; single pieces share bags (settings.singlePack).
  products: [
    { id: 'md-lemon', name: 'Madeleine Lemon (1 pc)', category: 'Madeleine', kind: 'single', price: 49, estCost: 5, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['lemonzest', 0.188]] },
    { id: 'md-jollies', name: 'Madeleine Jollies (1 pc)', category: 'Madeleine', kind: 'single', price: 49, estCost: 5, shelfLife: 5, maxPerBatch: 40, active: true, recipe: [] },
    { id: 'md-straw', name: 'Madeleine Strawberry (1 pc)', category: 'Madeleine', kind: 'single', price: 49, estCost: 5, shelfLife: 5, maxPerBatch: 40, active: true, recipe: [] },
    { id: 'md-earlgrey', name: 'Madeleine Earl Grey (1 pc)', category: 'Madeleine', kind: 'single', price: 49, estCost: 5, shelfLife: 5, maxPerBatch: 40, active: true, recipe: [] },
    { id: 'cookie', name: 'Cookie (1 pc)', category: 'Cookie', kind: 'single', price: 39, estCost: 2, shelfLife: 5, maxPerBatch: 40, active: true,
      notes: 'Egg is 0.667 g per cookie (2 eggs ≈ 100 g per 150 cookies).',
      recipe: [['cookieflour', 6.667], ['egg', 0.667], ['butter', 2.667]] },
    { id: 'giftset', name: 'Giftset (6 madeleines + 2 cookies)', category: 'Giftset', kind: 'box', price: 299, packCost: 40, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['box', 1], ['postbox', 1], ['sticker', 2]],
      box: { pieces: 6, pool: 'Madeleine', extras: [['cookie', 2]] } }
  ],

  orders: [],
  stockLog: [],

  transactions: [
    ['2026-10-15', 'ลองชิม Wondering', 'Taste test', 330],
    ['2026-10-17', 'ลองชิม Starbucks/1:2/Bowcake', 'Taste test', 354],
    ['2026-10-17', 'ลองชิม PS 2 กล่อง', 'Taste test', 459],
    ['2026-10-17', 'b-pack (แป้ง/น้ำตาล/เนย)', 'Trial making', 302],
    ['2026-10-17', 'เนย home fresh', 'Trial making', 402],
    ['2026-10-17', 'Chia seed', 'Trial making', 249],
    ['2026-10-17', 'Lemon', 'Trial making', 55],
    ['2026-10-26', 'Macadamia/ Matcha/Straw/ Lavender', 'Trial making', 805],
    ['2026-10-30', 'อุปกรณ์', 'Equipment', 315],
    ['2026-10-30', 'ค่ากล่อง (Test)', 'Trial Packaging', 122],
    ['2026-11-10', 'ตาไก่', 'Packaging', 345],
    ['2026-11-10', 'กล่องพัสดุ 20 กล่อง', 'Packaging', 92],
    ['2026-11-10', 'Sticker ใส 1,440 ดวง', 'Packaging', 49],
    ['2026-11-10', 'กล่องคุกกี้ 60 กล่อง', 'Packaging', 1152],
    ['2026-11-10', 'แป้งคุกกี้ 2 กก.', 'Ingredients', 144],
    ['2026-11-10', 'กระดาษรังผึ้ง', 'Trial Packaging', 88],
    ['2026-11-17', 'ถุงกระดาษขาว 100 ใบ', 'Packaging', 496],
    ['2026-11-17', 'กระดาษขาว 100 แผ่น', 'Packaging', 78],
    ['2026-11-19', 'Strawberry', 'Trial making', 231],
    ['2026-11-19', 'Hojicha', 'Trial making', 95],
    ['2026-11-19', 'Makro', 'Trial making', 128],
    ['2026-11-19', 'Horlick', 'Trial making', 269],
    ['2026-11-19', 'Honey', 'Trial making', 199],
    ['2026-11-19', 'เนย แป้ง น้ำตาล', 'Trial making', 466]
  ].map(function (r, i) {
    return { id: 't' + (i + 1), date: r[0], account: 'kbank', description: r[1], category: r[2], amountIn: 0, amountOut: r[3], orderId: '' };
  }),

  budget: [
    { category: 'Ingredients', note: 'Ingredients', amount: 10000 },
    { category: 'Packaging', note: 'Packaging / sticker / card', amount: 5000 },
    { category: 'Taste test', note: 'ลองชิม', amount: 1500 },
    { category: 'Equipment', note: 'Seal machine (เครื่อง seal) / etc.', amount: 1500 },
    { category: 'Trial making', note: 'ลองทำ', amount: 3500 },
    { category: 'Trial Packaging', note: 'ลอง packaging', amount: 500 },
    { category: 'Utilities', note: 'Electricity + water', amount: 3000 },
    { category: 'Marketing', note: 'Ads', amount: 2000 },
    { category: 'Miscellaneous', note: 'Miscellaneous', amount: 13000 }
  ],

  ads: [],
  posts: [],

  targets: { grossMargin: 0.667, targetRoas: 3, ctr: 0.01, engagement: 0.03, watchBand: 0.2 },

  tasks: [
    ['Baking', 'Bake + finalize cookies designs', 'Nini', true],
    ['Baking', 'สรุปสูตร วิธีทำ วิธีเก็บ cookies + balls', 'meang_n', false],
    ['Baking', 'สรุปต้นทุน cookies + balls', 'meang_n', false],
    ['Packaging', 'สั่ง packaging for cookies', 'Ponnatcha', false],
    ['Packaging', 'สรุป materials ตกแต่ง package', 'Nini', true],
    ['Packaging', 'research ร้านปริ้นท์', 'Ponnatcha', false],
    ['Packaging', 'ลอง pack (material จริง graphic จอ)', 'Nini', true],
    ['Packaging', 'finalize stickers/cards/ของตกแต่ง', 'Nini', true],
    ['Packaging', 'สั่งทำ stickers/cards กับร้านปริ้นท์', 'Ponnatcha', false],
    ['Branding', 'Moodboard 3 แบบให้เลือก', 'Nini', true],
    ['Branding', 'Marketing direction', 'Nini', true],
    ['Branding', 'finalize photoshoot direction', 'Nini', true],
    ['Branding', 'หาอุปกรณ์สำหรับ photoshoot', 'Nini', false],
    ['Branding', 'Photoshoot breakdown', 'diditpn', true],
    ['Branding', 'Photoshoot', 'Nini', true],
    ['Operation', 'Operation overview', 'Ponnatcha', false],
    ['Operation', 'Line OA', 'Ponnatcha', false],
    ['Operation', 'ลองส่งขนมทุก size', 'Ponnatcha', false],
    ['Strategy', 'Perceptual map', 'diditpn', true],
    ['Strategy', 'SWOT analysis', 'diditpn', true],
    ['Strategy', 'Customer journey mapping', 'diditpn', true],
    ['Marketing', 'Content planner', 'diditpn', true],
    ['Marketing', 'Content creation workshop', 'Nini', false]
  ].map(function (r, i) {
    return { id: 'k' + (i + 1), section: r[0], title: r[1], owner: r[2], due: '', done: r[3] };
  })
};
