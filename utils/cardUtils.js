// 卡牌相关工具函数
import { SUITS, RANKS, JOKERS, BASE_POINT_VALUES, GAME_CONFIG } from '../data/gameData.js';

// 创建牌堆（应用道具效果）
export function createDeck(gameState) {
  const deck = [];
  
  // 确定小丑牌列表（根据是否拥有马戏团泄露道具）
  let jokerList = [...JOKERS];
  if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    const hasCircusLeak = gameState.ownedItems.some(item => item.id === 'circus_leak');
    if (hasCircusLeak) {
      jokerList = [...JOKERS, 'Joker3'];
    }
  }
  
  // 普通牌
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      // 计算最终点数（基础值 + 道具加成）
      let finalPoint = BASE_POINT_VALUES[rank];
      
      // 应用点数加成道具
      if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
        gameState.ownedItems.forEach(item => {
          if (item.type === 'point_boost') {
            if (item.target === 'all' || 
                (Array.isArray(item.target) && item.target.includes(rank)) || 
                item.target === rank) {
              finalPoint += item.value || 0;
            }
          }
          
          // 处理幸运加成的惩罚
          if (item.type === 'mixed_boost' && item.target === 'random' && Math.random() > 0.5) {
            finalPoint -= item.value.penalty || 0;
          }
        });
      }

      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        isJoker: false,
        basePoint: BASE_POINT_VALUES[rank],
        finalPoint: Math.max(1, finalPoint), // 确保点数至少为1
        pointBoost: finalPoint - BASE_POINT_VALUES[rank]
      });
    });
  });
  
  // 小丑牌
  jokerList.forEach(joker => {
    let finalPoint = BASE_POINT_VALUES['Joker'];
    
    // 应用小丑牌加成
    if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
      gameState.ownedItems.forEach(item => {
        if (item.type === 'point_boost' && (item.target === 'Joker' || item.target === 'all')) {
          finalPoint += item.value || 0;
        }
      });
    }

    deck.push({
      id: joker,
      suit: 'joker',
      rank: 'Joker',
      isJoker: true,
      basePoint: BASE_POINT_VALUES['Joker'],
      finalPoint: Math.max(1, finalPoint),
      pointBoost: finalPoint - BASE_POINT_VALUES['Joker']
    });
  });
  
  return deck;
}

// 洗牌
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// 获取花色符号
export function getSuitSymbol(suit) {
  switch(suit) {
    case 'club': return '♣';
    case 'diamond': return '♦';
    case 'heart': return '♥';
    case 'spade': return '♠';
    case 'joker': return '🃏';
    default: return '';
  }
}

// 创建牌元素
export function createCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.className = 'w-[60px] h-[90px] rounded-lg card-shadow overflow-hidden bg-white flex flex-col justify-between p-1 card-hover card-element';
  
  const suitColor = card.isJoker ? 'text-joker' : `text-${card.suit}`;
  
  cardEl.innerHTML = `
    <div class="flex justify-between items-start">
      <span class="text-sm font-bold ${suitColor}">${card.rank}</span>
      <span class="${suitColor} text-lg">${getSuitSymbol(card.suit)}</span>
    </div>
    <div class="text-center ${suitColor} text-xl">
      ${card.isJoker ? '🃏' : getSuitSymbol(card.suit)}
    </div>
    <div class="flex justify-between items-end">
      <span class="${suitColor} text-lg">${getSuitSymbol(card.suit)}</span>
      <span class="text-sm font-bold ${suitColor}">${card.rank}</span>
    </div>
  `;
  
  return cardEl;
}

// 创建小型牌元素（用于选中牌显示）
export function createSmallCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.className = 'w-[40px] h-[60px] rounded-lg card-shadow overflow-hidden bg-white flex flex-col justify-center items-center p-1';
  
  const suitColor = card.isJoker ? 'text-joker' : `text-${card.suit}`;
  
  let pointText = `${card.finalPoint}分`;
  if (card.pointBoost > 0) {
    pointText = `${card.finalPoint}分 <span class="text-success text-xs">+${card.pointBoost}</span>`;
  } else if (card.pointBoost < 0) {
    pointText = `${card.finalPoint}分 <span class="text-danger text-xs">${card.pointBoost}</span>`;
  }
  
  cardEl.innerHTML = `
    <span class="text-xs font-bold ${suitColor}">${card.rank}</span>
    <span class="${suitColor} text-sm">${getSuitSymbol(card.suit)}</span>
    <span class="text-xs text-primary mt-1">${pointText}</span>
  `;
  
  return cardEl;
}