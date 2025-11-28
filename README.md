# 小丑牌游戏 - 模块化版本

这是一个将原始单文件 HTML 游戏重构为模块化结构的版本。

## 项目结构

```
v1/
├── index.html              # 主页面
├── components/             # 游戏组件
│   ├── playerHand.js       # 玩家手牌组件
│   ├── gameLogic.js        # 游戏核心逻辑
│   ├── preCalculation.js   # 实时预计算组件
│   └── shop.js             # 商城组件
├── data/                   # 游戏数据
│   └── gameData.js         # 游戏核心数据定义
├── utils/                  # 工具函数
│   ├── cardUtils.js        # 卡牌相关工具函数
│   └── stateManager.js     # 游戏状态管理工具
└── pages/                  # 页面模板（预留）
```

## 运行方式

1. 在项目根目录启动一个 HTTP 服务器：
   ```bash
   cd v1
   python -m http.server 8000
   ```

2. 在浏览器中打开 `http://localhost:8000`

## 模块化特性

1. **数据与逻辑分离**：所有游戏数据都集中在 `data/gameData.js` 中，便于维护和修改。
2. **组件化开发**：将不同功能拆分为独立的组件文件。
3. **状态管理**：使用 `utils/stateManager.js` 统一管理游戏状态。
4. **可扩展性**：易于添加新功能和修改现有功能。

## 浏览器兼容性

由于使用了 ES6 模块系统，需要在 HTTP 服务器环境下运行，不能直接双击 HTML 文件打开。