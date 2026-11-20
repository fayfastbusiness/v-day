/* Starting data for the Jollies internal app.
   Taken from the "Our Bakeshop!" Drive folder on 20 Nov 2026:
   [Jollies] Operations (Menu, Recipes, Inventory, Settings),
   [Jollies] Finance (Budget, Transaction - Make), [Jollies] Marketing (Targets),
   [Jollies] Management (Gantt).
   Sample/example rows from those sheets were left out on purpose. */
window.JOLLIES_SEED = {
  version: 1,
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

  inventory: [
    { id: 'flour', name: 'แป้งตราว่าว 1 kg', unit: 'g', supplier: 'B-pack', packSize: 1000, packPrice: 34, opening: 1000, reorderPoint: 1000, target: 6000, leadDays: 1 },
    { id: 'sugar', name: 'Sugar', unit: 'g', supplier: 'B-pack', packSize: 1000, packPrice: 37, opening: 1000, reorderPoint: 1000, target: 5000, leadDays: 1 },
    { id: 'butter', name: 'เนย Allowrie', unit: 'g', supplier: 'B-pack', packSize: 1000, packPrice: 190, opening: 1000, reorderPoint: 1000, target: 4000, leadDays: 1 },
    { id: 'vanilla', name: 'Vanilla extract', unit: 'ml', supplier: 'Makro', packSize: 473, packPrice: 113, opening: 473, reorderPoint: 200, target: 1000, leadDays: 2 },
    { id: 'chia', name: 'Chia seed', unit: 'g', supplier: 'Lemon Farm', packSize: 225, packPrice: 249, opening: 225, reorderPoint: 0, target: 0, leadDays: 2 },
    { id: 'macadamia', name: 'Macadamia', unit: 'g', supplier: 'Local market', packSize: 1000, packPrice: 880, opening: 1000, reorderPoint: 250, target: 1000, leadDays: 2 },
    { id: 'lavender', name: 'Lavender', unit: 'g', supplier: 'Local market', packSize: 60, packPrice: 99, opening: 0, reorderPoint: 0, target: 0, leadDays: 2 },
    { id: 'sesame', name: 'งาดำ', unit: 'g', supplier: 'Makro', packSize: 500, packPrice: 72, opening: 0, reorderPoint: 6, target: 30, leadDays: 1 },
    { id: 'strawberry', name: 'ผงสตอเบอรี่', unit: 'g', supplier: 'Local market', packSize: 25, packPrice: 55, opening: 100, reorderPoint: 20, target: 100, leadDays: 3 },
    { id: 'horlick', name: 'Horlick', unit: 'g', supplier: 'Local market', packSize: 400, packPrice: 380, opening: 400, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'matcha', name: 'Matcha', unit: 'g', supplier: 'Supermarket', packSize: 40, packPrice: 166, opening: 40, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'cookieflour', name: 'แป้งคุกกี้', unit: 'g', supplier: 'Shopee', packSize: 1000, packPrice: 80, opening: 1000, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'eggs', name: 'Eggs', unit: 'pcs', supplier: 'Local market', packSize: 1, packPrice: 5, opening: 60, reorderPoint: 30, target: 120, leadDays: 1 },
    { id: 'box', name: 'Packaging box', unit: 'pcs', supplier: 'Shopee', packSize: 60, packPrice: 1152, opening: 60, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'postbox', name: 'กล่องไปรษณีย์', unit: 'pcs', supplier: 'Shopee', packSize: 20, packPrice: 109, opening: 20, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'sticker', name: 'สติ๊กเกอร์ใส', unit: 'pcs', supplier: 'Shopee', packSize: 1440, packPrice: 49, opening: 1440, reorderPoint: 30, target: 200, leadDays: 3 },
    { id: 'clearbag', name: 'ซองใส', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'paperbag', name: 'ถุงกระดาษ', unit: 'pcs', supplier: '', packSize: 100, packPrice: 496, opening: 100, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'cookiebag', name: 'ซองน้ำตาลคุกกี้', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'card', name: 'การ์ด', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'label', name: 'Sticker label', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'parchment', name: 'กระดาษไข', unit: 'pcs', supplier: '', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 3 },
    { id: 'eyelet', name: 'ตาไก่', unit: 'pcs', supplier: 'Local market', packSize: 0, packPrice: 0, opening: 0, reorderPoint: 0, target: 0, leadDays: 1 }
  ],

  // kind: 'single' = one piece you bake; 'box' = a set made of pieces chosen from a category pool.
  products: [
    { id: 'sb-matcha', name: 'Snowball Matcha (1 pc)', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['flour', 4.912], ['butter', 3.965], ['vanilla', 0.175], ['sugar', 1.316], ['chia', 0.439], ['macadamia', 4.5], ['matcha', 0.526]] },
    { id: 'sb-straw', name: 'Snowball Strawberry (1 pc)', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['flour', 4.912], ['butter', 3.965], ['vanilla', 0.175], ['sugar', 1.316], ['chia', 0.439], ['macadamia', 4.5], ['strawberry', 1.754]] },
    { id: 'sb-sesame', name: 'Snowball Sesame (1 pc)', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['flour', 4.912], ['butter', 3.965], ['vanilla', 0.175], ['sugar', 1.316], ['chia', 0.439], ['macadamia', 4.5], ['sesame', 0.175]] },
    { id: 'sb-horlick', name: 'Snowball Horlick (1 pc)', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['flour', 4.912], ['butter', 3.965], ['vanilla', 0.175], ['sugar', 1.316], ['chia', 0.439], ['macadamia', 4.5], ['horlick', 7.018]] },
    { id: 'sb-lavender', name: 'Snowball Lavender (1 pc)', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['flour', 4.912], ['butter', 3.965], ['vanilla', 0.175], ['sugar', 1.316], ['chia', 0.439], ['macadamia', 4.5], ['lavender', 0.132]] },
    { id: 'cookie', name: 'Cookie (1 pc)', category: 'Cookie', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['cookieflour', 6.667], ['eggs', 0.013], ['butter', 2.667]] },
    { id: 'box-snowball', name: 'Boxset (6 snowballs + 2 cookies)', category: 'Boxset', kind: 'box', price: 240, shelfLife: 5, maxPerBatch: 40, active: true,
      recipe: [['postbox', 1], ['box', 1], ['sticker', 2]],
      box: { pieces: 6, pool: 'Snowball', extras: [['cookie', 2]] } },
    { id: 'box-madeleine', name: 'Boxset (6 madeleines + 2 cookies)', category: 'Boxset', kind: 'box', price: 299, shelfLife: 5, maxPerBatch: 40, active: false,
      notes: 'Earlier menu. No madeleine recipes yet.', recipe: [], box: { pieces: 6, pool: 'Madeleine', extras: [['cookie', 2]] } },
    { id: 'madeleine', name: 'Madeleine (1 pc)', category: 'Madeleine', kind: 'single', price: 49, shelfLife: 5, maxPerBatch: 40, active: false,
      notes: 'Earlier menu. Add a recipe before selling.', recipe: [] }
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
