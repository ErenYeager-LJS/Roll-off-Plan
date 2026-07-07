# SQLite 本地同步设计

## 目标

把营养记录器从“单设备浏览器本地保存”升级为“电脑本地 SQLite 数据库 + 局域网网页端”。手机和电脑访问同一个 Node 服务，读写同一个 `server/nutrition.db`。

## 架构

- `server/server.js`：Node HTTP 静态文件服务和 JSON API。
- `server/nutrition.db`：SQLite 数据库文件，首次启动自动创建。
- `src/app.js`：前端继续作为 PWA 使用，但数据从 API 读写。
- `src/api.js`：封装 API 调用。
- `src/trends.js`：绘制体重、热量、蛋白质、碳水、脂肪趋势图。

## 数据

SQLite 表：

- `entries`：三餐食物记录。
- `custom_foods`：自定义食物库。
- `weights`：每日体重。
- `settings`：目标摄入范围。

## API

- `GET /api/state?date=YYYY-MM-DD`：读取某日记录、自定义食物、目标、体重。
- `POST /api/entries`：新增食物记录。
- `DELETE /api/entries/:id`：删除食物记录。
- `POST /api/custom-foods`：新增自定义食物。
- `POST /api/weights`：保存每日体重。
- `GET /api/history?days=30`：读取趋势图数据。
- `DELETE /api/day/:date`：清空某日记录。

## UI

首页保留深色高级圆角风格，新增：

- 体重录入卡片。
- 趋势卡片：体重、热量、蛋白质、碳水、脂肪折线图。
- 7 天 / 30 天切换。

## 运行

从 `营养记录PWA/` 运行：

```powershell
npm start
```

电脑打开：

```text
http://localhost:8080/
```

手机打开：

```text
http://电脑IPv4:8080/
```

