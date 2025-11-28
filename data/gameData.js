// 游戏核心数据定义
export const SUITS = ['club', 'diamond', 'heart', 'spade'];
export const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const JOKERS = ['Joker1', 'Joker2'];

export const BASE_POINT_VALUES = {
  '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
  '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13,
  'Joker': 10
};

export const BASE_HAND_MULTIPLIERS = {
  '单牌': 1, '对子': 2, '两对': 3, '三条': 4,
  '顺子': 5, '同花': 6, '葫芦': 7, '四条': 8, '同花顺': 10
};

export const ROUND_REQUIREMENTS = [150, 300, 600, 1200, 6000, 12000, 96000, 192000];

export const ITEM_TEMPLATES = [
  // 点数提升道具
  {
    id: 'joker_point_boost',
    name: '胖子小丑★',
    desc: '小丑牌点数+5（基础10→15）',
    type: 'point_boost',
    target: 'Joker',
    value: 5,
    basePrice: 50,
    icon: 'fa-star'
  },
  {
    id: 'high_card_boost',
    name: '膨胀★★',
    desc: 'A/2/K/Q/J点数+3',
    type: 'point_boost',
    target: ['A', '2', 'K', 'Q', 'J'],
    value: 3,
    basePrice: 180,
    icon: 'fa-arrow-up'
  },
  {
    id: 'all_card_boost',
    name: '青铜增幅★',
    desc: '所有牌点数+1',
    type: 'point_boost',
    target: 'all',
    value: 1,
    basePrice: 90,
    icon: 'fa-plus'
  },
  // 倍率提升道具
  {
    id: 'straight_flush_boost',
    name: '同花顺★★★',
    desc: '同花顺倍率×2（基础10→20）',
    type: 'multiplier_boost',
    target: '同花顺',
    value: 2,
    basePrice: 666,
    icon: 'fa-trophy'
  },
  {
    id: 'four_of_a_kind_boost',
    name: '四条崛起★★',
    desc: '四条倍率×1.5（基础8→12）',
    type: 'multiplier_boost',
    target: '四条',
    value: 1.5,
    basePrice: 200,
    icon: 'fa-dice-four'
  },
  {
    id: 'all_hand_boost',
    name: '火力全开★★★★★',
    desc: '所有牌型倍率×2',
    type: 'multiplier_boost',
    target: 'all',
    value: 2,
    basePrice: 1000,
    icon: 'fa-magic'
  },
  {
    id: 'half_hand_boost',
    name: '加农炮★★★',
    desc: '所有牌型倍率×1.5',
    type: 'multiplier_boost',
    target: 'all',
    value: 1.5,
    basePrice: 500,
    icon: 'fa-magic'
  },
  // 双刃剑道具

  {
    id: 'lucky_boost',
    name: '西瓜芝麻★',
    desc: '所有牌型上涨20%，但每张牌随机点数-2',
    type: 'mixed_boost',
    target: 'random',
    value: { main: 1.2, penalty: 2 },
    basePrice: 90,
    icon: 'fa-leaf'
  },
  // 新增道具
  {
    id: 'ghost_hand2',
    name: '鬼手7★★★★★',
    desc: '手牌数量+2',
    type: 'hand_size_boost',
    target: 'hand',
    value: 2,
    basePrice: 2888,
    icon: 'fa-hand-rock'
  },
  {
    id: 'ghost_hand',
    name: '鬼手★★★★',
    desc: '手牌数量+1（8→9）',
    type: 'hand_size_boost',
    target: 'hand',
    value: 1,
    basePrice: 888,
    icon: 'fa-hand-rock'
  },
  {
    id: 'pair_demon',
    name: '对子恶魔★★',
    desc: '基础对子倍率+2（2→4）',
    type: 'pair_multiplier_boost',
    target: '对子',
    value: 2,
    basePrice: 300,
    icon: 'fa-dragon'
  },
  {
    id: 'gold_boost',
    name: '黄金增幅★★★',
    desc: '所有牌点数+5',
    type: 'point_boost',
    target: 'all',
    value: 5,
    basePrice: 550,
    icon: 'fa-coins'
  },
  {
    id: 'iron_boost',
    name: '黑铁增幅★★',
    desc: '所有牌点数+2',
    type: 'point_boost',
    target: 'all',
    value: 2,
    basePrice: 230,
    icon: 'fa-mountain'
  },
  {
    id: 'diamond_boost',
    name: '钻石增幅★★★★★',
    desc: '所有牌点数+10',
    type: 'point_boost',
    target: 'all',
    value: 10,
    basePrice: 1550,
    icon: 'fa-gem'
  },
  {
    id: 'single_bomb',
    name: '单牌炸弹★★★★★',
    desc: '单牌倍率+5（1→6）',
    type: 'multiplier_boost',
    target: '单牌',
    value: 6,
    basePrice: 1000,
    icon: 'fa-bomb'
  },
  // 继续新增道具
  {
    id: 'odd_boost',
    name: '奇数强化★',
    desc: '{1,3,5,7,9}牌点数+1',
    type: 'point_boost',
    target: ['3', '5', '7', '9'],
    value: 1,
    basePrice: 100,
    icon: 'fa-sort-numeric-asc'
  },
  {
    id: 'even_boost',
    name: '偶数强化★',
    desc: '{2,4,6,8,10}牌点数+2',
    type: 'point_boost',
    target: ['4', '6', '8', '10', '2'],
    value: 2,
    basePrice: 120,
    icon: 'fa-sort-numeric-desc'
  },
  {
    id: 'prime_boost',
    name: '素数强化★★',
    desc: '{2,3,5,7}牌点数+3',
    type: 'point_boost',
    target: ['2', '3', '5', '7'],
    value: 3,
    basePrice: 200,
    icon: 'fa-cube'
  },
  {
    id: 'three_backstab',
    name: '颠三倒四★★',
    desc: '三条倍率×2，四条倍率÷2',
    type: 'mixed_hand_boost',
    target: ['三条', '四条'],
    value: { '三条': 2, '四条': 0.5 },
    basePrice: 330,
    icon: 'fa-chain-broken'
  },
  {
    id: 'barely_alive',
    name: '苟延残喘★★★',
    desc: '每大局小局数从3增加到4',
    type: 'subround_boost',
    target: 'subround',
    value: 1,
    basePrice: 555,
    icon: 'fa-heartbeat'
  },
  {
    id: 'circus_leak',
    name: '马戏团出逃★★',
    desc: '小丑牌+1',
    type: 'joker_boost',
    target: 'joker',
    value: 1,
    basePrice: 300,
    icon: 'fa-smile-o'
  },
  {
    id: 'circus_leak2',
    name: '马戏团通缉★★★★★',
    desc: '小丑牌+2',
    type: 'joker_boost',
    target: 'joker',
    value: 2,
    basePrice: 1200,
    icon: 'fa-smile-o'
  },
  {
    id: 'crazy_pairs',
    name: '连对肘击★★',
    desc: '两对倍率×2，对子倍率÷2',
    type: 'mixed_hand_boost',
    target: ['两对', '对子'],
    value: { '两对': 2, '对子': 0.5 },
    basePrice: 350,
    icon: 'fa-retweet'
  },
  {
    id: 'sixty_six_straight',
    name: '六六大顺★★★★★',
    desc: '顺子倍率×6',
    type: 'multiplier_boost',
    target: '顺子',
    value: 6,
    basePrice: 1666,
    icon: 'fa-sort-amount-desc'
  },
  {
    id: 'plastic_sisters',
    name: '塑料姐妹花★★★',
    desc: '同花倍率÷5，其他牌型倍率×2.5',
    type: 'plastic_boost',
    target: 'all',
    value: 2.5,
    basePrice: 700,
    icon: 'fa-venus'
  }
];

// 游戏配置
export const GAME_CONFIG = {
  HAND_SIZE: 8,           // 手牌数量
  SELECTED_CARDS_COUNT: 5, // 选牌数量
  SUBROUNDS_PER_ROUND: 3,  // 每大局的小局数（默认为3）
  TOTAL_ROUNDS: 8,         // 总大局数
  MAX_OWNED_ITEMS: 6,      // 玩家最大道具持有数量
  DEFAULT_STATE: {
    deck: [],
    playerHand: [],
    selectedCards: [],
    currentRound: 1,
    currentSubround: 1,
    subroundScores: [0, 0, 0], // 默认3个小局
    totalScore: 0,
    gameStarted: false,
    isGameOver: false,
    isSubroundConfirmed: false,
    ownedItems: [],
    activeEffects: {},
    shopItems: [],
    shopRefreshCount: 0
  }
};