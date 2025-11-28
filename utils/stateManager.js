import { GAME_CONFIG } from '../data/gameData.js';

// 初始化游戏状态
export function initGameState() {
  const initialState = {
    deck: [],
    playerHand: [],
    selectedCards: [],
    currentRound: 1,
    currentSubround: 1,
    subroundScores: [0, 0, 0],
    totalScore: 0,
    gameStarted: false,
    isGameOver: false,
    isSubroundConfirmed: false,
    ownedItems: [],
    ownedItemsCount: 0,  // 添加道具计数变量
    MAX_OWNED_ITEMS: GAME_CONFIG.MAX_OWNED_ITEMS || 6,  // 最大道具持有数量，默认为6
    activeEffects: {},
    shopItems: [],
    shopRefreshCount: 0
  };
  
  sessionStorage.setItem('gameState', JSON.stringify(initialState));
  return initialState;
}

// 获取游戏状态
export function getGameState() {
  const state = sessionStorage.getItem('gameState');
  if (state) {
    const parsedState = JSON.parse(state);
    // 确保MAX_OWNED_ITEMS存在
    if (parsedState.MAX_OWNED_ITEMS === undefined) {
      parsedState.MAX_OWNED_ITEMS = GAME_CONFIG.MAX_OWNED_ITEMS || 6;
    }
    // 确保ownedItemsCount存在并正确初始化
    if (parsedState.ownedItemsCount === undefined) {
      parsedState.ownedItemsCount = parsedState.ownedItems ? parsedState.ownedItems.length : 0;
    }
    return parsedState;
  }
  return initGameState();
}

// 保存游戏状态
export function saveGameState(state) {
  // 确保在保存前正确设置ownedItemsCount
  if (state.ownedItems && state.ownedItemsCount !== state.ownedItems.length) {
    state.ownedItemsCount = state.ownedItems.length;
  }
  sessionStorage.setItem('gameState', JSON.stringify(state));
}

// 重置游戏状态
export function resetGameState() {
  sessionStorage.removeItem('gameState');
  return initGameState();
}