// 商城组件
import { getGameState, saveGameState } from '../utils/stateManager.js';
import { ITEM_TEMPLATES } from '../data/gameData.js';
import { createDeck } from '../utils/cardUtils.js';
import { renderPlayerHand } from './playerHand.js';
import { updatePreCalculationUI } from './preCalculation.js';
import { showToast } from './playerHand.js';

// 刷新商城商品
export function refreshShopItems(gameState) {
  gameState.shopRefreshCount = (gameState.shopRefreshCount || 0) + 1;
  gameState.shopItems = [];
  
  // 随机选择6个道具（避免重复）
  const shuffledTemplates = [...ITEM_TEMPLATES].sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffledTemplates.slice(0, 6);
  
  // 生成商品（价格随机浮动±20%）
  selectedTemplates.forEach(template => {
    const priceVariation = 0.8 + (Math.random() * 0.4); // 0.8-1.2
    const finalPrice = Math.round(template.basePrice * priceVariation);
    
    gameState.shopItems.push({
      ...template,
      price: finalPrice,
      sellPrice: Math.floor(finalPrice / 2) // 卖出半价
    });
  });
  
  // 保存状态
  saveGameState(gameState);
  
  // 渲染商城
  renderShopItems(gameState);
  showToast(`商城商品已刷新！（第${gameState.shopRefreshCount}次）`, 'info');
  
  return gameState;
}

// 渲染商城商品
export function renderShopItems(gameState) {
  const shopItemsEl = document.getElementById('shop-items');
  if (!shopItemsEl) return;

  shopItemsEl.innerHTML = '';

  if (!gameState.shopItems || gameState.shopItems.length === 0) return;

  gameState.shopItems.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
    
    // 检查是否已拥有
    const isOwned = gameState.ownedItems && gameState.ownedItems.some(owned => owned.id === item.id);
    
    itemEl.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="bg-shop/10 text-shop w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fa ${item.icon}"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-gray-800 flex items-center gap-2">
            ${item.name}
            ${isOwned ? '<span class="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">已拥有</span>' : ''}
          </h4>
          <p class="text-xs text-gray-600 mt-1">${item.desc}</p>
          <div class="flex justify-between items-center mt-3">
            <div>
              <span class="text-primary font-bold">${item.price}</span>
              <span class="text-xs text-gray-500">积分</span>
            </div>
            <div class="flex gap-2">
              ${!isOwned ? `
                <button class="buy-item bg-shop text-white text-xs px-3 py-1 rounded-lg hover:bg-shop/90 transition-all" data-id="${item.id}">
                  购买
                </button>
              ` : `
                <button class="sell-item bg-danger text-white text-xs px-3 py-1 rounded-lg hover:bg-danger/90 transition-all" data-id="${item.id}">
                  出售（${item.sellPrice}）
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
    
    shopItemsEl.appendChild(itemEl);
  });
  
  // 绑定购买/出售事件
  document.querySelectorAll('.buy-item').forEach(btn => {
    btn.addEventListener('click', (e) => buyItem(e.target.dataset.id));
  });
  
  document.querySelectorAll('.sell-item').forEach(btn => {
    btn.addEventListener('click', (e) => sellItem(e.target.dataset.id));
  });
}

// 渲染已拥有道具
export function renderOwnedItems(gameState) {
  const ownedItemsEl = document.getElementById('owned-items');
  if (!ownedItemsEl) return;
  
  ownedItemsEl.innerHTML = '';
  
  if (!gameState.ownedItems || gameState.ownedItems.length === 0) {
    ownedItemsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">暂无道具</p>';
    return;
  }
  
  gameState.ownedItems.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
    
    itemEl.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="bg-shop/10 text-shop w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fa ${item.icon || 'fa-magic'} text-sm"></i>
        </div>
        <div>
          <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
          <p class="text-xs text-gray-600 mt-1">${item.desc}</p>
          <div class="flex gap-2 mt-2 text-xs">
            <span class="bg-primary/10 text-primary px-2 py-0.5 rounded">购入：${item.buyPrice}积分</span>
            <span class="bg-danger/10 text-danger px-2 py-0.5 rounded">出售：${item.sellPrice}积分</span>
          </div>
        </div>
      </div>
      <button class="sell-item-sidebar text-danger hover:text-danger/80 p-1" data-id="${item.id}">
        <i class="fa fa-trash"></i>
      </button>
    `;
    
    ownedItemsEl.appendChild(itemEl);
  });
  
  // 绑定侧边栏出售事件
  document.querySelectorAll('.sell-item-sidebar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (confirm('确定要出售该道具吗？出售后将失去道具效果！')) {
        sellItem(e.target.closest('.sell-item-sidebar').dataset.id);
      }
    });
  });
}

// 购买道具
export function buyItem(itemId) {
  let gameState = getGameState();
  const item = gameState.shopItems.find(i => i.id === itemId);
  
  if (!item) return;
  
  // 检查积分
  if (gameState.totalScore < item.price) {
    showToast('积分不足，无法购买！', 'error');
    return;
  }
  
  // 检查是否已拥有
  if (gameState.ownedItems.some(owned => owned.id === itemId)) {
    // 检查是否是一次性购买的道具（价格为0且未拥有过）
    if (item.basePrice === 0) {
      // 检查是否已经购买过这类一次性道具
      const hasPurchasedWifeFund = gameState.ownedItems.some(i => i.id === 'wife_fund');
      const hasPurchasedCoffinFund = gameState.ownedItems.some(i => i.id === 'coffin_fund');
      
      if ((itemId === 'wife_fund' && hasPurchasedWifeFund) || 
          (itemId === 'coffin_fund' && hasPurchasedCoffinFund)) {
        showToast('该道具只能购买一次！', 'warning');
        return;
      }
    } else {
      showToast('已拥有该道具，无需重复购买！', 'warning');
      return;
    }
  }

  // 确保MAX_OWNED_ITEMS存在
  if (gameState.MAX_OWNED_ITEMS === undefined) {
    gameState.MAX_OWNED_ITEMS = 6;
  }

  // 确保ownedItemsCount存在
  if (gameState.ownedItemsCount === undefined) {
    gameState.ownedItemsCount = gameState.ownedItems ? gameState.ownedItems.length : 0;
  }

  // 检查道具持有数量限制（使用独立的计数变量）
  // 但允许购买一次性道具（价格为0的道具）
  if (item.basePrice > 0 && gameState.ownedItemsCount >= gameState.MAX_OWNED_ITEMS) {
    showToast(`道具栏已满！最多只能持有${gameState.MAX_OWNED_ITEMS}个道具。`, 'error');
    return;
  }

  // 扣除积分
  gameState.totalScore -= item.price;

  // 添加道具
  gameState.ownedItems.push({
    id: item.id,
    name: item.name,
    desc: item.desc,
    type: item.type,
    target: item.target,
    value: item.value,
    buyPrice: item.price,
    sellPrice: item.sellPrice,
    icon: item.icon
  });

  // 特殊处理：突破阈值道具增加最大道具持有数量
  if (item.id === 'break_threshold') {
    gameState.MAX_OWNED_ITEMS += item.value || 2;
  }

  // 特殊处理：贪婪的恶魔道具增加总局数
  if (item.id === 'greedy_demon') {
    // 这个效果在游戏逻辑中处理
  }

  // 特殊处理：一次性道具增加积分
  if (item.id === 'wife_fund' || item.id === 'coffin_fund') {
    gameState.totalScore += item.value || 0;
  }

  // 更新道具计数（不包括一次性道具）
  if (item.basePrice > 0) {
    gameState.ownedItemsCount = gameState.ownedItems.length;
  }

  // 保存状态
  saveGameState(gameState);

  // 更新UI
  document.getElementById('shop-balance').textContent = gameState.totalScore;
  document.getElementById('item-count').textContent = gameState.ownedItemsCount;
  // 更新最大道具数量信息
  const maxItemsInfoEl = document.getElementById('max-items-info');
  if (maxItemsInfoEl) {
    maxItemsInfoEl.textContent = `/ ${gameState.MAX_OWNED_ITEMS}`;
  }
  renderShopItems(gameState);
  renderOwnedItems(gameState);
  
  // 如果当前在游戏页，更新游戏相关UI
  if (!document.getElementById('game-page').classList.contains('hidden')) {
    // 重新创建牌堆（应用新道具效果）
    gameState.deck = createDeck(gameState);
    if (gameState.playerHand.length > 0) {
      // 根据道具调整手牌数量
      const handSize = gameState.playerHand.length; // 保持当前手牌数量
      gameState.playerHand = gameState.deck.splice(0, handSize);
    }
    saveGameState(gameState);
    renderPlayerHand(gameState);
    updatePreCalculationUI(gameState);
  }
  
  showToast(`成功购买【${item.name}】！消耗${item.price}积分`, 'success');
}

// 出售道具
export function sellItem(itemId) {
  let gameState = getGameState();
  const itemIndex = gameState.ownedItems.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) return;
  
  const item = gameState.ownedItems[itemIndex];
  
  // 添加积分
  gameState.totalScore += item.sellPrice;
  
  // 移除道具
  gameState.ownedItems.splice(itemIndex, 1);
  
  // 更新道具计数
  gameState.ownedItemsCount = gameState.ownedItems.length;
  
  // 确保MAX_OWNED_ITEMS存在
  if (gameState.MAX_OWNED_ITEMS === undefined) {
    gameState.MAX_OWNED_ITEMS = 6;
  }
  
  // 保存状态
  saveGameState(gameState);
  
  // 更新UI
  document.getElementById('shop-balance').textContent = gameState.totalScore;
  document.getElementById('item-count').textContent = gameState.ownedItemsCount;
  // 更新最大道具数量信息
  const maxItemsInfoEl = document.getElementById('max-items-info');
  if (maxItemsInfoEl) {
    maxItemsInfoEl.textContent = `/ ${gameState.MAX_OWNED_ITEMS}`;
  }
  renderShopItems(gameState);
  renderOwnedItems(gameState);
  
  // 如果当前在游戏页，更新游戏相关UI
  if (!document.getElementById('game-page').classList.contains('hidden')) {
    // 重新创建牌堆（移除道具效果）
    gameState.deck = createDeck(gameState);
    if (gameState.playerHand.length > 0) {
      // 根据道具调整手牌数量
      const handSize = gameState.playerHand.length; // 保持当前手牌数量
      gameState.playerHand = gameState.deck.splice(0, handSize);
    }
    saveGameState(gameState);
    renderPlayerHand(gameState);
    updatePreCalculationUI(gameState);
  }
  
  showToast(`成功出售【${item.name}】！获得${item.sellPrice}积分`, 'success');
}