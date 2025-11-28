// 玩家手牌组件
import { createCardElement, getSuitSymbol } from '../utils/cardUtils.js';
import { getGameState, saveGameState } from '../utils/stateManager.js';
import { updatePreCalculationUI } from './preCalculation.js';

// 渲染手牌
export function renderPlayerHand(gameState) {
  const playerHandEl = document.getElementById('player-hand');
  if (!playerHandEl) return;
  
  playerHandEl.innerHTML = '';
  
  if (!gameState.playerHand || gameState.playerHand.length === 0) {
    playerHandEl.innerHTML = `
      <div class="col-span-4 text-gray-400 text-center py-8">
        <i class="fa fa-card text-4xl mb-2"></i>
        <p>点击"开始游戏"发牌</p>
      </div>
    `;
    return;
  }

  gameState.playerHand.forEach((card, index) => {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'flex flex-col items-center relative';
    
    const cardEl = createCardElement(card);
    cardEl.classList.add('card-element'); // 添加card-element类名用于事件委托
    cardEl.dataset.index = index;
    
    // 选中状态
    const isSelected = gameState.selectedCards && gameState.selectedCards.some(selected => selected.id === card.id);
    if (isSelected) cardEl.classList.add('card-selected');
    
    // 可点击状态
    if (!gameState.isSubroundConfirmed && !gameState.isGameOver) {
      cardEl.classList.add('cursor-pointer');
    } else {
      cardEl.classList.add('opacity-70', 'cursor-not-allowed');
    }
    
    // 点数徽章（显示基础值+加成）
    const pointBadge = document.createElement('div');
    pointBadge.className = 'card-point-badge';
    
    if (card.pointBoost > 0) {
      pointBadge.innerHTML = `${card.finalPoint}分 <span class="text-success">+${card.pointBoost}</span>`;
    } else if (card.pointBoost < 0) {
      pointBadge.innerHTML = `${card.finalPoint}分 <span class="text-danger">${card.pointBoost}</span>`;
    } else {
      pointBadge.textContent = `${card.finalPoint}分`;
    }
    
    cardContainer.appendChild(cardEl);
    cardContainer.appendChild(pointBadge);
    playerHandEl.appendChild(cardContainer);
  });
}

// 切换牌选择状态
export function toggleCardSelection(index) {
  console.log('toggleCardSelection called with index:', index);
  let gameState = getGameState();
  
  if (gameState.isGameOver || gameState.isSubroundConfirmed) return;
  
  const card = gameState.playerHand[index];
  if (!card) return;
  
  const isSelected = gameState.selectedCards && gameState.selectedCards.some(selected => selected.id === card.id);
  console.log('Card:', card, 'Is selected:', isSelected);
  
  if (isSelected) {
    // 取消选择
    gameState.selectedCards = gameState.selectedCards.filter(selected => selected.id !== card.id);
  } else {
    // 检查是否已选满5张
    if (gameState.selectedCards && gameState.selectedCards.length >= 5) {
      showToast('最多只能选择5张牌！', 'warning');
      return;
    }
    // 添加选择
    if (!gameState.selectedCards) gameState.selectedCards = [];
    gameState.selectedCards.push({...card}); // 深拷贝避免引用问题
  }
  
  // 保存状态
  saveGameState(gameState);
  
  // 更新UI
  renderPlayerHand(gameState);
  updateSelectedCardsUI(gameState);
  updatePreCalculationUI(gameState);
}

// 更新选中牌UI
export function updateSelectedCardsUI(gameState) {
  const selectedCardsEl = document.getElementById('selected-cards');
  const selectedCountEl = document.getElementById('selected-count');
  
  if (!selectedCardsEl || !selectedCountEl) return;
  
  selectedCardsEl.innerHTML = '';
  const selectedCount = (gameState.selectedCards && gameState.selectedCards.length) || 0;
  selectedCountEl.textContent = selectedCount;
  
  if (selectedCount === 0) {
    selectedCardsEl.innerHTML = `
      <div class="col-span-5 text-gray-400 text-center py-4">
        请选择牌组成牌型
      </div>
    `;
    return;
  }

  gameState.selectedCards.forEach(card => {
    // 创建一个包装器来包含牌和分数
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'flex flex-col items-center';
    
    // 牌元素
    const cardEl = document.createElement('div');
    cardEl.className = 'w-[40px] h-[60px] rounded-lg card-shadow overflow-hidden bg-white flex flex-col justify-center items-center p-1';
    
    const suitColor = card.isJoker ? 'text-joker' : `text-${card.suit}`;
    
    cardEl.innerHTML = `
      <span class="text-xs font-bold ${suitColor}">${card.rank}</span>
      <span class="${suitColor} text-sm">${getSuitSymbol(card.suit)}</span>
    `;
    
    // 分数元素
    const pointEl = document.createElement('div');
    pointEl.className = 'text-xs text-primary mt-1';
    
    let pointText = `${card.finalPoint}分`;
    if (card.pointBoost > 0) {
      pointText = `${card.finalPoint}分 <span class="text-success text-xs">+${card.pointBoost}</span>`;
    } else if (card.pointBoost < 0) {
      pointText = `${card.finalPoint}分 <span class="text-danger text-xs">${card.pointBoost}</span>`;
    }
    
    pointEl.innerHTML = pointText;
    
    // 将牌和分数添加到包装器中
    cardWrapper.appendChild(cardEl);
    cardWrapper.appendChild(pointEl);
    
    selectedCardsEl.appendChild(cardWrapper);
  });

  // 补空白
  const emptyCount = 5 - selectedCount;
  for (let i = 0; i < emptyCount; i++) {
    // 创建包装器
    const emptyWrapper = document.createElement('div');
    emptyWrapper.className = 'flex flex-col items-center';
    
    // 空白牌元素
    const emptyEl = document.createElement('div');
    emptyEl.className = 'w-[40px] h-[60px] rounded-lg border border-dashed border-gray-300 flex items-center justify-center';
    emptyEl.innerHTML = '<span class="text-gray-400 text-xs">空</span>';
    
    // 空白分数元素（保持一致的布局）
    const emptyPointEl = document.createElement('div');
    emptyPointEl.className = 'text-xs text-primary mt-1';
    emptyPointEl.innerHTML = '&nbsp;'; // 空白字符保持布局
    
    // 将空白牌和分数添加到包装器中
    emptyWrapper.appendChild(emptyEl);
    emptyWrapper.appendChild(emptyPointEl);
    
    selectedCardsEl.appendChild(emptyWrapper);
  }
}

// 显示提示消息
export function showToast(message, type = 'info') {
  // 移除已存在的toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-notification fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 transform translate-y-20 opacity-0`;
  
  // 设置不同类型的样式
  switch(type) {
    case 'success':
      toast.classList.add('bg-success', 'text-white');
      toast.innerHTML = `<i class="fa fa-check-circle"></i> ${message}`;
      break;
    case 'error':
      toast.classList.add('bg-danger', 'text-white');
      toast.innerHTML = `<i class="fa fa-times-circle"></i> ${message}`;
      break;
    case 'warning':
      toast.classList.add('bg-secondary', 'text-white');
      toast.innerHTML = `<i class="fa fa-exclamation-circle"></i> ${message}`;
      break;
    default:
      toast.classList.add('bg-primary', 'text-white');
      toast.innerHTML = `<i class="fa fa-info-circle"></i> ${message}`;
  }
  
  document.body.appendChild(toast);
  
  // 显示动画
  setTimeout(() => {
    toast.classList.remove('translate-y-20', 'opacity-0');
  }, 10);
  
  // 隐藏动画
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}