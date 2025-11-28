// 实时预计算组件
import { BASE_HAND_MULTIPLIERS, ROUND_REQUIREMENTS } from '../data/gameData.js';
import { getGameState } from '../utils/stateManager.js';
import { determineBestHand, getFinalMultiplier } from './gameLogic.js';
import { getSuitSymbol } from '../utils/cardUtils.js';

// 更新实时预计算UI
export function updatePreCalculationUI(gameState) {
  // 计算总点数
  const selectedCards = gameState.selectedCards || [];
  const pointSum = selectedCards.reduce((sum, card) => sum + (card.finalPoint || 0), 0);
  const basePointSum = selectedCards.reduce((sum, card) => sum + (card.basePoint || 0), 0);
  const pointBoost = pointSum - basePointSum;
  
  const realTimePointSumEl = document.getElementById('real-time-point-sum');
  const pointBoostBadgeEl = document.getElementById('point-boost-badge');
  const pointEffectTextEl = document.getElementById('point-effect-text');
  
  if (realTimePointSumEl) realTimePointSumEl.textContent = pointSum;
  
  // 显示点数加成徽章
  if (pointBoostBadgeEl) {
    if (pointBoost !== 0) {
      pointBoostBadgeEl.classList.remove('hidden');
      pointBoostBadgeEl.textContent = pointBoost > 0 ? `+${pointBoost}` : `${pointBoost}`;
      if (pointEffectTextEl) pointEffectTextEl.classList.remove('hidden');
      
      // 生成点数效果说明
      let pointEffects = [];
      if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
        gameState.ownedItems.forEach(item => {
          if (item.type === 'point_boost' || (item.type === 'mixed_boost' && item.target === 'random')) {
            pointEffects.push(item.desc);
          }
        });
      }
      
      if (pointEffectTextEl) {
        pointEffectTextEl.textContent = pointEffects.length > 0 
          ? `道具加成：${pointEffects.join('；')}` 
          : `基础点数：${basePointSum} + 加成：${pointBoost} = 总计：${pointSum}`;
      }
    } else {
      pointBoostBadgeEl.classList.add('hidden');
      if (pointEffectTextEl) pointEffectTextEl.classList.add('hidden');
    }
  }
  
  // 选满5张显示牌型预判
  if (selectedCards.length === 5) {
    const bestHand = determineBestHand(selectedCards);
    const multiplierInfo = getFinalMultiplier(bestHand.name, gameState);
    const baseScore = basePointSum * multiplierInfo.base;
    const finalScore = Math.round(pointSum * multiplierInfo.final);
    
    // 更新预判UI
    const predictionTextEl = document.getElementById('prediction-text');
    const predictionDetailsEl = document.getElementById('prediction-details');
    const predictedHandNameEl = document.getElementById('predicted-hand-name');
    const predictedMultiplierEl = document.getElementById('predicted-multiplier');
    const predictedTotalScoreEl = document.getElementById('predicted-total-score');
    
    if (predictionTextEl) predictionTextEl.textContent = '最大牌型预判：';
    if (predictionDetailsEl) predictionDetailsEl.classList.remove('hidden');
    if (predictedHandNameEl) predictedHandNameEl.textContent = bestHand.name;
    
    // 显示倍率（基础+加成）
    if (predictedMultiplierEl) {
      let multiplierText = `（×${multiplierInfo.final}`;
      if (multiplierInfo.boost !== 0 || multiplierInfo.penalty !== 0) {
        multiplierText += ' [';
        if (multiplierInfo.boost > 0) multiplierText += `+${multiplierInfo.boost}倍`;
        if (multiplierInfo.penalty < 0) multiplierText += `${multiplierInfo.penalty}倍`;
        multiplierText += ']';
      }
      multiplierText += '）';
      predictedMultiplierEl.textContent = multiplierText;
    }
    
    // 显示最终得分
    if (predictedTotalScoreEl) predictedTotalScoreEl.textContent = finalScore;
    
    // 倍率加成徽章
    const multiplierBoostBadgeEl = document.getElementById('multiplier-boost-badge');
    const multiplierEffectTextEl = document.getElementById('multiplier-effect-text');
    
    if (multiplierBoostBadgeEl) {
      if (multiplierInfo.boost !== 0 || multiplierInfo.penalty !== 0) {
        multiplierBoostBadgeEl.classList.remove('hidden');
        multiplierBoostBadgeEl.textContent = `×${(multiplierInfo.final/multiplierInfo.base).toFixed(1)}`;
        if (multiplierEffectTextEl) multiplierEffectTextEl.classList.remove('hidden');
        
        // 生成倍率效果说明
        let multiplierEffects = [];
        if (gameState.ownedItems && Array.isArray(gameState.ownedItems)) {
          gameState.ownedItems.forEach(item => {
            if (item.type === 'multiplier_boost' || item.type === 'mixed_boost') {
              multiplierEffects.push(item.desc);
            }
          });
        }
        
        if (multiplierEffectTextEl) {
          multiplierEffectTextEl.textContent = multiplierEffects.length > 0 
            ? `道具加成：${multiplierEffects.join('；')}` 
            : `基础倍率：×${multiplierInfo.base} → 最终：×${multiplierInfo.final}`;
        }
      } else {
        multiplierBoostBadgeEl.classList.add('hidden');
        if (multiplierEffectTextEl) multiplierEffectTextEl.classList.add('hidden');
      }
    }
    
    // 最终得分加成徽章
    const finalScoreBoostBadgeEl = document.getElementById('final-score-boost-badge');
    const finalScoreCalcEl = document.getElementById('final-score-calc');
    
    const scoreBoost = baseScore > 0 ? Math.round(((finalScore / baseScore) - 1) * 100) : 0;
    if (finalScoreBoostBadgeEl) {
      if (scoreBoost !== 0) {
        finalScoreBoostBadgeEl.classList.remove('hidden');
        finalScoreBoostBadgeEl.textContent = scoreBoost > 0 ? `+${scoreBoost}%` : `${scoreBoost}%`;
      } else {
        finalScoreBoostBadgeEl.classList.add('hidden');
      }
    }
    
    // 最终得分计算说明
    if (finalScoreCalcEl) {
      finalScoreCalcEl.textContent = 
        `计算公式：(${basePointSum}基础点数 + ${pointBoost}加成) × ${multiplierInfo.final}倍率 = ${finalScore}分`;
    }
    
    // 确认状态高亮
    if (gameState.isSubroundConfirmed) {
      if (predictedHandNameEl) predictedHandNameEl.classList.add('text-success');
      if (predictedTotalScoreEl) predictedTotalScoreEl.classList.add('text-success');
    } else {
      if (predictedHandNameEl) predictedHandNameEl.classList.remove('text-success');
      if (predictedTotalScoreEl) predictedTotalScoreEl.classList.remove('text-success');
    }
  } else {
    // 未选满5张重置
    const predictionTextEl = document.getElementById('prediction-text');
    const predictionDetailsEl = document.getElementById('prediction-details');
    const predictedHandNameEl = document.getElementById('predicted-hand-name');
    const predictedMultiplierEl = document.getElementById('predicted-multiplier');
    const predictedTotalScoreEl = document.getElementById('predicted-total-score');
    
    if (predictionTextEl) predictionTextEl.textContent = '选满5张牌自动预判最大牌型';
    if (predictionDetailsEl) predictionDetailsEl.classList.add('hidden');
    if (predictedHandNameEl) predictedHandNameEl.textContent = '';
    if (predictedMultiplierEl) predictedMultiplierEl.textContent = '';
    if (predictedTotalScoreEl) predictedTotalScoreEl.textContent = '0';
    
    const multiplierBoostBadgeEl = document.getElementById('multiplier-boost-badge');
    const finalScoreBoostBadgeEl = document.getElementById('final-score-boost-badge');
    const multiplierEffectTextEl = document.getElementById('multiplier-effect-text');
    const finalScoreCalcEl = document.getElementById('final-score-calc');
    
    if (multiplierBoostBadgeEl) multiplierBoostBadgeEl.classList.add('hidden');
    if (finalScoreBoostBadgeEl) finalScoreBoostBadgeEl.classList.add('hidden');
    if (multiplierEffectTextEl) multiplierEffectTextEl.classList.add('hidden');
    if (finalScoreCalcEl) finalScoreCalcEl.textContent = '计算公式：总点数 × 牌型系数（道具加成已计入）';
  }
  
  // 更新各牌型当前倍率列表
  updateHandMultipliersList(gameState);
}

// 更新各牌型当前倍率列表
function updateHandMultipliersList(gameState) {
  const multipliersListEl = document.getElementById('hand-multipliers-list');
  if (!multipliersListEl) return;
  
  // 清空现有内容
  multipliersListEl.innerHTML = '';
  
  // 牌型列表（按倍率从高到低排序）
  const handTypes = [
    { name: '同花顺', baseMultiplier: 10 },
    { name: '四条', baseMultiplier: 8 },
    { name: '葫芦', baseMultiplier: 7 },
    { name: '同花', baseMultiplier: 6 },
    { name: '顺子', baseMultiplier: 5 },
    { name: '三条', baseMultiplier: 4 },
    { name: '两对', baseMultiplier: 3 },
    { name: '对子', baseMultiplier: 2 },
    { name: '单牌', baseMultiplier: 1 }
  ];
  
  // 为每个牌型计算当前倍率并显示
  handTypes.forEach(handType => {
    const multiplierInfo = getFinalMultiplier(handType.name, gameState);
    
    const itemEl = document.createElement('div');
    itemEl.className = 'flex justify-between items-center p-5 bg-white rounded border';
    
    // 牌型名称
    const nameEl = document.createElement('span');
    nameEl.className = 'font-medium';
    nameEl.textContent = handType.name;
    
    // 倍率显示
    const multiplierEl = document.createElement('span');
    multiplierEl.className = 'font-bold';
    
    // 如果有加成，显示详细信息
    if (multiplierInfo.boost !== 0 || multiplierInfo.penalty !== 0) {
      multiplierEl.innerHTML = `
        <span class="text-gray-500 line-through">${handType.baseMultiplier}</span>
        <span class="ml-1 ${multiplierInfo.final >= handType.baseMultiplier ? 'text-success' : 'text-danger'}">×${multiplierInfo.final.toFixed(2)}</span>
      `;
    } else {
      multiplierEl.textContent = `×${multiplierInfo.final}`;
    }
    
    itemEl.appendChild(nameEl);
    itemEl.appendChild(multiplierEl);
    multipliersListEl.appendChild(itemEl);
  });
}