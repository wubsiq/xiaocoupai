// 游戏核心逻辑组件
import { createDeck, shuffleDeck } from '../utils/cardUtils.js';
import { getGameState, saveGameState } from '../utils/stateManager.js';
import { BASE_HAND_MULTIPLIERS, RANKS, ROUND_REQUIREMENTS, GAME_CONFIG } from '../data/gameData.js';
import { renderPlayerHand, updateSelectedCardsUI, showToast } from './playerHand.js';
import { updatePreCalculationUI } from './preCalculation.js';

// 获取小局数（根据是否拥有苟延残喘道具）
export function getSubroundsPerRound(gameState) {
  let subrounds = GAME_CONFIG.SUBROUNDS_PER_ROUND; // 默认3局
  
  // 检查是否有苟延残喘道具
  if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    const hasBarelyAlive = gameState.ownedItems.some(item => item.id === 'barely_alive');
    if (hasBarelyAlive) {
      subrounds = 4; // 增加到4局
    }
  }
  
  return subrounds;
}

// 初始化游戏
export function startGame() {
  let gameState = getGameState();
  
  // 获取当前小局数配置
  const subroundsPerRound = getSubroundsPerRound(gameState);
  
  // 重置状态（保留道具和积分）
  gameState = {
    ...gameState,
    deck: [],
    playerHand: [],
    selectedCards: [],
    currentSubround: 1,
    subroundScores: new Array(subroundsPerRound).fill(0), // 根据道具调整数组大小
    isSubroundConfirmed: false,
    isGameOver: false,
    gameStarted: true
  };
  
  // 更新UI配置
  const requiredScoreEl = document.getElementById('required-score');
  if (requiredScoreEl) requiredScoreEl.textContent = ROUND_REQUIREMENTS[gameState.currentRound - 1];
  
  const roundLabelEl = document.getElementById('round-label');
  if (roundLabelEl) roundLabelEl.textContent = gameState.currentRound;
  
  const nextRoundNumberEl = document.getElementById('next-round-number');
  if (nextRoundNumberEl) nextRoundNumberEl.textContent = gameState.currentRound + 1;
  
  const roundStatusEl = document.getElementById('round-status');
  if (roundStatusEl) {
    roundStatusEl.className = 'text-xs mt-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600';
    roundStatusEl.textContent = '未达标';
  }
  
  // 发牌
  gameState.deck = createDeck(gameState);
  shuffleDeck(gameState.deck);
  // 根据道具调整手牌数量
  const handSize = getHandSize(gameState);
  gameState.playerHand = gameState.deck.splice(0, handSize);
  
  // 保存状态
  saveGameState(gameState);
  
  // 渲染UI
  renderPlayerHand(gameState);
  updateSelectedCardsUI(gameState);
  updatePreCalculationUI(gameState);
  
  // 按钮状态
  document.getElementById('start-game').classList.add('hidden');
  document.getElementById('confirm-cards').classList.remove('hidden');
  
  showToast('游戏开始！请选择5张牌组成最优牌型', 'success');
}

// 获取手牌数量（根据道具调整）
function getHandSize(gameState) {
  let handSize = 8; // 默认手牌数量
  
  // 检查是否有鬼手道具
  if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    gameState.ownedItems.forEach(item => {
      if (item.type === 'hand_size_boost' && item.target === 'hand') {
        handSize += item.value || 0;
      }
    });
  }
  
  return handSize;
}

// 确认选牌并锁定得分
export function confirmSelectedCards() {
  let gameState = getGameState();
  
  const selectedCount = (gameState.selectedCards && gameState.selectedCards.length) || 0;
  if (selectedCount !== 5) {
    showToast(`请选择5张牌后再确认！当前已选${selectedCount}张`, 'error');
    return;
  }

  // 计算最终得分
  const pointSum = gameState.selectedCards.reduce((sum, card) => sum + (card.finalPoint || 0), 0);
  const bestHand = determineBestHand(gameState.selectedCards);
  const multiplierInfo = getFinalMultiplier(bestHand.name, gameState);
  const score = Math.round(pointSum * multiplierInfo.final);
  
  // 更新得分
  gameState.subroundScores[gameState.currentSubround - 1] = score;
  gameState.totalScore += score;
  
  // 更新状态
  gameState.isSubroundConfirmed = true;
  
  // 保存状态
  saveGameState(gameState);
  
  // 更新UI
  document.getElementById('current-subround-score').textContent = score;
  document.getElementById('total-score').textContent = gameState.totalScore;
  
  // 高亮确认状态
  document.getElementById('predicted-hand-name').classList.add('text-success');
  document.getElementById('predicted-total-score').classList.add('text-success');
  
  // 检查当前累计总分与当前大局要求的对比
  const required = ROUND_REQUIREMENTS[gameState.currentRound - 1];
  const roundStatusEl = document.getElementById('round-status');
  
  // 显示累计总分与当前大局要求的对比
  if (gameState.totalScore >= required) {
    roundStatusEl.className = 'text-xs mt-1 px-2 py-1 rounded-full bg-success/20 text-success';
    roundStatusEl.textContent = `已达标（${gameState.totalScore}/${required}）`;
  } else {
    roundStatusEl.className = 'text-xs mt-1 px-2 py-1 rounded-full bg-warning/20 text-warning';
    roundStatusEl.textContent = `未达标（${gameState.totalScore}/${required}）`;
  }
  
  // 获取当前小局数配置
  const subroundsPerRound = getSubroundsPerRound(gameState);
  
  // 按钮状态
  document.getElementById('confirm-cards').classList.add('hidden');
  
  // 最后一小局
  if (gameState.currentSubround === subroundsPerRound) { // 使用动态小局数
    // 检查累计总分是否达到要求（这才是真正的晋级条件）
    if (gameState.totalScore >= required) {
      const totalRounds = getTotalRounds(gameState);
      if (gameState.currentRound === totalRounds) {
        setTimeout(() => showGameResult(true, gameState.totalScore), 1000);
      } else {
        document.getElementById('next-round').classList.remove('hidden');
        showToast(`第${gameState.currentRound}大局完成！累计积分：${gameState.totalScore}`, 'success');
      }
    } else {
      // 玩家未达到晋级要求，游戏失败
      const totalRounds = getTotalRounds(gameState);
      if (gameState.currentRound === totalRounds) {
        setTimeout(() => showGameResult(false, gameState.totalScore, gameState.currentRound, gameState.totalScore, required), 1000);
      } else {
        // 显示失败信息，不允许进入下一局
        showToast(`第${gameState.currentRound}大局未完成！累计积分：${gameState.totalScore}（未达到${required}分要求）`, 'error');
        // 3秒后显示游戏结果
        setTimeout(() => showGameResult(false, gameState.totalScore, gameState.currentRound, gameState.totalScore, required), 3000);
      }
    }
  } else {
    document.getElementById('next-subround').classList.remove('hidden');
    showToast(`第${gameState.currentSubround}小局确认！得分：${score}（+${score}积分）`, 'success');
  }
  
  // 刷新手牌
  renderPlayerHand(gameState);
}

// 下一小局
export function nextSubround() {
  let gameState = getGameState();
  
  gameState.currentSubround++;
  gameState.selectedCards = [];
  gameState.isSubroundConfirmed = false;
  
  // 获取当前小局数配置
  const subroundsPerRound = getSubroundsPerRound(gameState);
  
  // 确保subroundScores数组大小正确
  if (gameState.subroundScores.length !== subroundsPerRound) {
    gameState.subroundScores = new Array(subroundsPerRound).fill(0);
  }
  
  // 重新发牌（应用最新道具效果）
  gameState.deck = createDeck(gameState);
  shuffleDeck(gameState.deck);
  // 根据道具调整手牌数量
  const handSize = getHandSize(gameState);
  gameState.playerHand = gameState.deck.splice(0, handSize);
  
  // 保存状态
  saveGameState(gameState);
  
  // 更新UI
  document.getElementById('current-subround').textContent = `第${gameState.currentSubround}小局`;
  document.getElementById('current-subround-score').textContent = '0';
  
  // 重置预计算
  renderPlayerHand(gameState);
  updateSelectedCardsUI(gameState);
  updatePreCalculationUI(gameState);
  
  // 按钮状态
  document.getElementById('next-subround').classList.add('hidden');
  document.getElementById('confirm-cards').classList.remove('hidden');
  
  showToast(`进入第${gameState.currentSubround}小局！`, 'info');
}

// 下一大局
export function nextRound() {
  let gameState = getGameState();
  
  gameState.currentRound++;
  gameState.currentSubround = 1;
  gameState.selectedCards = [];
  
  // 获取当前小局数配置
  const subroundsPerRound = getSubroundsPerRound(gameState);
  
  // 确保subroundScores数组大小正确
  gameState.subroundScores = new Array(subroundsPerRound).fill(0);
  gameState.isSubroundConfirmed = false;
  
  // 重新发牌
  gameState.deck = createDeck(gameState);
  shuffleDeck(gameState.deck);
  // 根据道具调整手牌数量
  const handSize = getHandSize(gameState);
  gameState.playerHand = gameState.deck.splice(0, handSize);
  
  // 保存状态
  saveGameState(gameState);
  
  // 更新UI
  document.getElementById('current-round').textContent = gameState.currentRound;
  document.getElementById('current-subround').textContent = `第${gameState.currentSubround}小局`;
  document.getElementById('required-score').textContent = ROUND_REQUIREMENTS[gameState.currentRound - 1];
  document.getElementById('round-label').textContent = gameState.currentRound;
  document.getElementById('next-round-number').textContent = gameState.currentRound + 1 > 8 ? '8' : gameState.currentRound + 1;
  
  // 更新当前进度显示（累计总分与当前大局要求的对比）
  const required = ROUND_REQUIREMENTS[gameState.currentRound - 1];
  const roundStatusEl = document.getElementById('round-status');
  if (gameState.totalScore >= required) {
    roundStatusEl.className = 'text-xs mt-1 px-2 py-1 rounded-full bg-success/20 text-success';
    roundStatusEl.textContent = `已达标（${gameState.totalScore}/${required}）`;
  } else {
    roundStatusEl.className = 'text-xs mt-1 px-2 py-1 rounded-full bg-warning/20 text-warning';
    roundStatusEl.textContent = `未达标（${gameState.totalScore}/${required}）`;
  }
  
  document.getElementById('current-subround-score').textContent = '0';
  
  // 重置预计算
  renderPlayerHand(gameState);
  updateSelectedCardsUI(gameState);
  updatePreCalculationUI(gameState);
  
  // 按钮状态
  document.getElementById('next-round').classList.add('hidden');
  document.getElementById('confirm-cards').classList.remove('hidden');
  
  // 显示累计总分进度和提示信息
  showToast(`进入第${gameState.currentRound}大局！当前累计积分：${gameState.totalScore}/${required}分（可通过购买道具增强能力）`, 'info');
}

// 获取总局数（考虑贪婪的恶魔道具）
export function getTotalRounds(gameState) {
  // 检查是否有贪婪的恶魔道具
  if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    const hasGreedyDemon = gameState.ownedItems.some(item => item.id === 'greedy_demon');
    if (hasGreedyDemon) {
      return 12; // 贪婪的恶魔道具将总局数增加到12
    }
  }
  return GAME_CONFIG.TOTAL_ROUNDS || 8;
}

// 获取牌型最终倍率
export function getFinalMultiplier(handName, gameState) {
  // 获取基础倍率（考虑对子恶魔道具）
  let baseMultiplier = getBaseMultiplier(handName, gameState);
  let finalMultiplier = baseMultiplier;
  let totalBoost = 1;
  let penalty = 1;
  
  // 应用倍率加成道具
  if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    gameState.ownedItems.forEach(item => {
      if (item.type === 'multiplier_boost') {
        if (item.target === 'all' || item.target === handName) {
          totalBoost *= item.value || 1;
        }
      }
      
      // 风险增益道具（西瓜芝麻）
      if (item.type === 'mixed_boost' && item.id === 'lucky_boost') {
        totalBoost *= item.value?.main || 1;
        // lucky_boost的penalty是数字，不是数组
        penalty *= 1 - (item.value?.penalty || 0) / 100;
      }
      
      // 其他mixed_boost道具
      if (item.type === 'mixed_boost' && item.id !== 'lucky_boost') {
        // 检查是否为数组类型的penalty
        if (item.value?.penalty && Array.isArray(item.value.penalty)) {
          // 检查当前牌型是否在penalty数组中
          if (item.value.penalty.includes(handName)) {
            penalty *= item.value.penaltyValue || 1;
          }
        }
        // 如果penalty是数字类型
        else if (typeof item.value?.penalty === 'number') {
          penalty *= 1 - (item.value.penalty || 0) / 100;
        }
        
        // 应用主要加成
        totalBoost *= item.value?.main || 1;
      }
      
      // 特殊混合倍率道具（如三条背刺、疯狂连对等）
      if (item.type === 'mixed_hand_boost') {
        if (item.target.includes(handName)) {
          totalBoost *= item.value[handName] || 1;
        }
      }
      
      // 塑料姐妹花道具
      if (item.type === 'plastic_boost') {
        if (handName === '同花') {
          penalty *= 0.2; // 同花倍率除以5
        } else {
          totalBoost *= item.value || 1; // 其他牌型倍率乘以2.5
        }
      }
      
      // 贪婪的恶魔道具
      if (item.type === 'greedy_boost') {
        totalBoost *= item.value || 1;
      }
    });
  }
  
  finalMultiplier = finalMultiplier * totalBoost * penalty;
  return {
    base: baseMultiplier,
    final: Math.round(finalMultiplier * 100) / 100,
    boost: Math.round((totalBoost - 1) * 100) / 100,
    penalty: Math.round((penalty - 1) * 100) / 100
  };
}

// 获取基础倍率（考虑对子恶魔道具）
function getBaseMultiplier(handName, gameState) {
  let baseMultiplier = BASE_HAND_MULTIPLIERS[handName] || 1;
  
  // 检查是否有对子恶魔道具
  if (handName === '对子' && gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
    gameState.ownedItems.forEach(item => {
      if (item.type === 'pair_multiplier_boost' && item.target === '对子') {
        baseMultiplier += item.value || 0;
      }
    });
  }
  
  return baseMultiplier;
}

// 判定最大牌型（修复版）
export function determineBestHand(cards) {
  if (!cards || cards.length !== 5) return { name: '单牌', multiplier: 1 };
  
  const jokers = cards.filter(card => card.isJoker);
  const normalCards = cards.filter(card => !card.isJoker);
  const jokerCount = jokers.length;
  
  // 快速判定：5张小丑牌直接算同花顺
  if (jokerCount === 5) {
    return { name: '同花顺', multiplier: 10 };
  }
  
  // 提取牌值和花色
  const rankMap = {};
  const suitMap = {};
  const ranks = [];
  const suits = [];
  
  normalCards.forEach(card => {
    ranks.push(card.rank);
    suits.push(card.suit);
    rankMap[card.rank] = (rankMap[card.rank] || 0) + 1;
    suitMap[card.suit] = (suitMap[card.suit] || 0) + 1;
  });
  
  // 统计牌型数量
  const rankCounts = Object.values(rankMap).sort((a, b) => b - a);
  const suitCounts = Object.values(suitMap).sort((a, b) => b - a);
  
  // 同花顺判定（优先级最高）
  if (isStraightFlushFixed(normalCards, jokerCount)) {
    return { name: '同花顺', multiplier: 10 };
  }
  
  // 四条
  if (rankCounts[0] + jokerCount >= 4) {
    return { name: '四条', multiplier: 8 };
  }
  
  // 葫芦
  if (isFullHouseFixed(rankCounts, jokerCount)) {
    return { name: '葫芦', multiplier: 7 };
  }
  
  // 同花
  if (suitCounts[0] + jokerCount >= 5) {
    return { name: '同花', multiplier: 6 };
  }
  
  // 顺子
  if (isStraightFixed(normalCards, jokerCount)) {
    return { name: '顺子', multiplier: 5 };
  }
  
  // 三条
  if (rankCounts[0] + jokerCount >= 3) {
    return { name: '三条', multiplier: 4 };
  }
  
  // 两对
  if (isTwoPairFixed(rankCounts, jokerCount)) {
    return { name: '两对', multiplier: 3 };
  }
  
  // 对子
  if (rankCounts[0] + jokerCount >= 2) {
    return { name: '对子', multiplier: 2 };
  }
  
  // 单牌
  return { name: '单牌', multiplier: 1 };
}

// 修复后的牌型判定辅助函数
function isStraightFlushFixed(cards, jokerCount) {
  // 同花判定
  const suits = cards.map(card => card.suit);
  const suitCounts = {};
  suits.forEach(suit => suitCounts[suit] = (suitCounts[suit] || 0) + 1);
  const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
  
  if (maxSuitCount + jokerCount < 5) return false;
  
  // 顺子判定
  return isStraightFixed(cards, jokerCount);
}

function isFullHouseFixed(countValues, jokerCount) {
  // 葫芦 = 3+2 组合
  if (countValues.length >= 2) {
    // 已有3+2
    if (countValues[0] === 3 && countValues[1] === 2) return true;
    // 2+2 + 1个小丑 = 3+2
    if (countValues[0] === 2 && countValues[1] === 2 && jokerCount >= 1) return true;
    // 3+1 + 1个小丑 = 3+2
    if (countValues[0] === 3 && countValues[1] === 1 && jokerCount >= 1) return true;
    // 2+1+1 + 2个小丑 = 3+2
    if (countValues[0] === 2 && jokerCount >= 2) return true;
  }
  // 1+1+1+1 + 3个小丑 = 3+2
  if (countValues.length >= 4 && jokerCount >= 3) return true;
  
  return false;
}

function isStraightFixed(cards, jokerCount) {
  if (cards.length + jokerCount < 5) return false;
  
  // 获取唯一牌值并转换为数字索引
  const uniqueRanks = [...new Set(cards.map(card => card.rank))];
  const rankIndices = uniqueRanks.map(rank => RANKS.indexOf(rank)).sort((a, b) => a - b);
  
  // 特殊情况：只有小丑牌
  if (rankIndices.length === 0 && jokerCount >= 5) return true;
  
  // 检查普通顺子
  if (canFormStraight(rankIndices, jokerCount)) return true;
  
  // 检查A作为1使用的特殊情况（A,2,3,4,5）
  if (rankIndices.includes(11)) { // A的索引是11
    // 创建一个新的数组，将A视为索引-1（代表1）
    const modifiedIndices = rankIndices.map(idx => idx === 11 ? -1 : idx).sort((a, b) => a - b);
    if (canFormStraight(modifiedIndices, jokerCount)) return true;
  }
  
  return false;
}

// 检查是否能组成顺子的辅助函数
function canFormStraight(indices, jokerCount) {
  if (indices.length === 0) return jokerCount >= 5;
  
  // 定义所有可能的顺子模式
  // 标准顺子: 0-4, 1-5, 2-6, 3-7, 4-8, 5-9, 6-10, 7-11, 8-12
  // 特殊顺子: A(当作1),2,3,4,5 -> -1,0,1,2,3
  
  // 检查标准顺子
  for (let start = 0; start <= 8; start++) { // RANKS长度为13，顺子长度为5，所以最多检查到索引8
    let missingCards = 0;
    for (let i = 0; i < 5; i++) {
      const targetIndex = start + i;
      if (!indices.includes(targetIndex)) {
        missingCards++;
      }
    }
    if (missingCards <= jokerCount) {
      return true;
    }
  }
  
  // 如果有A(索引11)，检查A当作1的特殊情况 (A,2,3,4,5)
  if (indices.includes(11)) {
    // 对应索引为: -1,0,1,2,3
    const specialStraight = [-1, 0, 1, 2, 3];
    let missingCards = 0;
    for (const targetIndex of specialStraight) {
      // 对于-1(A当作1)，需要特殊处理
      if (targetIndex === -1) {
        // A已经在indices中了
      } else if (!indices.includes(targetIndex)) {
        missingCards++;
      }
    }
    if (missingCards <= jokerCount) {
      return true;
    }
  }
  
  return false;
}

function isTwoPairFixed(countValues, jokerCount) {
  // 已有两对
  if (countValues.length >= 2 && countValues[0] === 2 && countValues[1] === 2) return true;
  // 一对 + 1个小丑 = 两对
  if (countValues[0] === 2 && jokerCount >= 1) return true;
  // 无对子 + 2个小丑 = 两对
  if (jokerCount >= 2) return true;
  
  return false;
}

// 显示游戏结果
export function showGameResult(isWin, totalScore, currentRound, currentScore, required) {
  let gameState = getGameState();
  gameState.isGameOver = true;
  saveGameState(gameState);
  
  const modalIcon = document.getElementById('modal-icon');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const finalTotalScoreEl = document.getElementById('final-total-score');
  
  finalTotalScoreEl.textContent = totalScore;
  
  if (isWin) {
    modalIcon.className = 'text-5xl mb-4 text-success';
    modalIcon.innerHTML = '<i class="fa fa-trophy"></i>';
    modalTitle.textContent = '游戏胜利！';
    modalDesc.textContent = `恭喜你完成所有8大局，最终总积分：${totalScore}分！`;
  } else {
    modalIcon.className = 'text-5xl mb-4 text-danger';
    modalIcon.innerHTML = '<i class="fa fa-times-circle"></i>';
    modalTitle.textContent = '游戏失败';
    modalDesc.textContent = `第${currentRound}大局未达标（需${required}分，实际${currentScore}分），最终总积分：${totalScore}分`;
  }
  
  document.getElementById('game-modal').classList.remove('hidden');
}