# ScriptMaster AI Backend

英语课程脚本自动化生成平台后端服务

## 功能特性

### 核心功能
- **用户管理**: 支持多角色用户系统（开发师、美术师、上传人员、管理员）
- **项目协作**: 课程项目的创建、编辑、协作管理
- **模板系统**: 预设的页面模板和课程流程模板
- **AI集成**: 基于Google Gemini的智能内容生成和优化
- **Excel导出**: 支持多角色的专业Excel导出功能
- **文件管理**: 安全的文件上传和资产管理系统

### 技术特性
- **RESTful API**: 完整的REST API接口设计
- **JWT认证**: 基于JWT的用户认证和授权
- **数据库**: MySQL数据库，支持复杂查询和关联
- **文件处理**: 支持多种媒体格式的上传和验证
- **安全性**: 完整的安全防护机制
- **日志**: 详细的操作日志记录

## 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，配置以下变量：
   ```env
   # 服务器配置
   PORT=3001
   NODE_ENV=development

   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=scriptmaster_ai

   # JWT配置
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key_here

   # 文件上传配置
   UPLOAD_MAX_SIZE=50MB
   UPLOAD_PATH=./uploads

   # Excel导出配置
   EXCEL_EXPORT_PATH=./exports
   ```

3. **设置数据库**
   ```bash
   # 创建数据库
   mysql -u root -p -e "CREATE DATABASE scriptmaster_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

   # 运行迁移
   npm run migrate

   # 运行种子数据
   npm run seed
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

服务器将在 http://localhost:3001 启动

## API文档

### 认证接口

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "developer",
  "email": "dev@example.com",
  "password": "Password123",
  "full_name": "开发师",
  "role": "DEVELOPER"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "dev@example.com",
  "password": "Password123"
}
```

### 项目管理

#### 创建项目
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Unit 1: Hello World",
  "description": "第一单元：你好世界",
  "course_preset_id": "cp1"
}
```

#### 获取项目列表
```http
GET /api/projects?page=1&limit=10&search=hello
Authorization: Bearer <token>
```

#### 获取项目详情
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

### Excel导出

#### 导出项目
```http
POST /api/export/excel
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "project-id",
  "export_type": "DEVELOPER",
  "include_comments": true,
  "include_assets": true
}
```

支持的三种导出类型：
- `DEVELOPER`: 开发师完整导出，包含所有字段
- `ARTIST`: 美术师专用导出，专注视觉需求
- `UPLOADER`: 上传人员清单，包含文件路径信息

### AI服务

#### 润色描述
```http
POST /api/ai/polish-descriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "assets": [
    {
      "id": "asset-1",
      "name": "背景图片",
      "description": "需要一个明亮的教室背景"
    }
  ]
}
```

#### 生成内容建议
```http
POST /api/ai/generate-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "segment_title": "Warm-up Activity",
  "template_type": "Interactive Scene",
  "target_audience": "6-8岁儿童",
  "additional_notes": "需要包含字母A的学习"
}
```

## 数据库结构

### 主要表结构

- **users**: 用户表，存储用户信息和角色
- **projects**: 项目表，存储课程项目信息
- **templates**: 模板表，存储页面模板定义
- **assets**: 资源表，存储项目中的素材信息
- **segments**: 页面表，存储项目中的页面内容
- **course_presets**: 课程预设表，存储课程流程模板
- **comments**: 评论表，存储协作评论和批注
- **export_history**: 导出历史表，记录Excel导出记录

## 角色权限

### 开发师 (DEVELOPER)
- 创建和管理自己的项目
- 编辑页面内容和脚本描述
- 使用AI优化功能
- 导出完整的开发数据

### 美术师 (ARTIST)
- 查看分配的项目
- 导出美术专用数据
- 上传和更新视觉素材
- 查看设计相关的评论

### 上传人员 (UPLOADER)
- 查看项目上传清单
- 导出上传任务清单
- 标记上传完成状态
- 查看文件路径信息

### 管理员 (ADMIN)
- 管理所有用户和项目
- 系统配置和维护
- 查看所有导出记录
- 管理模板和预设

## 部署说明

### 生产环境部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **环境配置**
   - 设置 `NODE_ENV=production`
   - 配置生产数据库连接
   - 设置安全的JWT密钥
   - 配置文件存储路径

3. **启动服务**
   ```bash
   npm start
   ```

4. **使用PM2管理进程**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 开发指南

### 添加新的API端点

1. 在 `src/routes/` 目录下创建路由文件
2. 在 `src/services/` 目录下实现业务逻辑
3. 在 `src/types/` 目录下定义类型
4. 在 `index.ts` 中注册路由

### 数据库迁移

```bash
# 创建新的迁移文件
npm run knex migrate:make create_new_table --knexfile src/config/database.ts

# 运行迁移
npm run migrate

# 回滚迁移
npm run knex migrate:rollback --knexfile src/config/database.ts
```

### 添加种子数据

1. 在 `src/database/seeds/` 目录下创建种子文件
2. 使用 `npm run seed` 运行种子

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息
   - 确认网络连接正常

2. **JWT认证失败**
   - 检查JWT_SECRET是否设置
   - 验证token格式是否正确
   - 确认token未过期

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认文件类型支持

4. **Excel导出失败**
   - 检查exports目录权限
   - 验证内存使用情况
   - 确认数据完整性

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License