# 编译时国际化系统

本项目使用基于AST转换的编译时国际化方案，在构建过程中直接将英文文本替换为目标语言的翻译文本。

## 系统特点

- **编译时翻译**: 在Webpack构建过程中进行文本替换，无运行时开销
- **基于目录结构**: 翻译文件按照页面目录结构组织，便于管理和维护
- **AST级别转换**: 使用Babel AST解析和转换，精确处理JavaScript/TypeScript/JSX代码
- **类型安全**: 支持TypeScript项目，不影响类型检查
- **构建集成**: 与Next.js构建流程深度集成

## 目录结构

```
web/i18n/
├── compiler/                    # 编译器核心代码
│   ├── ast-transformer.js       # AST转换器
│   └── webpack-translation-plugin.js  # Webpack插件
├── translations/                # 翻译文件
│   └── zh-CN/                   # 中文翻译
│       ├── pages/               # 按页面组织的翻译
│       │   └── project/
│       │       ├── settings.json    # 设置页面翻译
│       │       └── prompts.json     # 提示词页面翻译
│       ├── organizations.json   # 组织相关翻译
│       └── [other-modules].json # 其他模块翻译
└── README.md                    # 文档
```

## 翻译文件格式

翻译文件使用JSON格式，键为英文原文，值为翻译后的文本：

```json
{
  "Project Settings": "项目设置",
  "General": "常规",
  "API Keys": "API 密钥"
}
```

## 构建流程

1. **开发模式**: 直接使用英文原文，无翻译处理
2. **生产构建**:
   - Webpack加载指定语言的翻译文件
   - AST转换器解析源码，替换匹配的文本
   - 生成包含翻译文本的最终代码

## 构建命令

```bash
# 构建中文版本
NEXT_PUBLIC_LOCALE=zh-CN npm run build

# 构建英文版本（默认）
npm run build
```

## 如何添加新的翻译

### 步骤1: 识别需要翻译的文本

在源码中找到硬编码的英文字符串，例如：

```javascript
// 在 React 组件中
<h1>Project Settings</h1>
<p>Configure your project settings</p>
<button>Save Changes</button>
```

### 步骤2: 确定翻译文件位置

根据页面路径确定翻译文件的位置：

- 页面文件: `web/src/pages/project/[projectId]/settings/index.tsx`
- 翻译文件: `web/i18n/translations/zh-CN/pages/project/[projectId]/settings/index.json`

### 步骤3: 添加翻译条目

在相应的JSON文件中添加英文到中文的映射：

```json
{
  "Project Settings": "项目设置",
  "Configure your project settings": "配置您的项目设置",
  "Save Changes": "保存更改"
}
```

### 步骤4: 测试翻译效果

运行构建命令验证翻译是否正确应用：

```bash
# 构建中文版本
NEXT_PUBLIC_LOCALE=zh-CN npm run build

# 启动服务器查看效果
npm run start
```

### 步骤5: 验证翻译结果

检查构建后的文件中是否包含正确的中文字符：

```bash
# 搜索翻译后的文本
grep -r "项目设置" .next/static/chunks/
```

## 支持的代码模式

系统支持以下JavaScript/TypeScript代码模式：

### 字符串字面量

```javascript
const title = "Project Settings"; // 转换为: const title = "项目设置";
```

### JSX文本

```jsx
<h1>Project Settings</h1> // 转换为: <h1>项目设置</h1>
```

### 模板字面量

```javascript
const msg = `Settings for ${name}`; // 支持部分转换
```

## 技术架构

### AST转换器 (ast-transformer.js)

- 使用 `@babel/parser` 解析源码为AST
- 使用 `@babel/traverse` 遍历AST节点
- 识别字符串字面量、JSX文本等可翻译内容
- 使用 `@babel/generator` 生成转换后的代码

### Webpack插件 (webpack-translation-plugin.js)

- 集成到Next.js构建流程
- 在编译前加载翻译文件
- 拦截模块构建过程，应用AST转换
- 只处理指定扩展名的源码文件

## 配置

### Next.js配置 (next.config.mjs)

```javascript
// 编译时国际化插件
if (!dev && !isServer) {
  const locale = process.env.NEXT_PUBLIC_LOCALE || "zh-CN";

  import("./i18n/compiler/webpack-translation-plugin.js").then(
    ({ WebpackTranslationPlugin }) => {
      config.plugins.push(
        new WebpackTranslationPlugin({
          locale,
          translationsDir: "./i18n/translations",
        }),
      );
    },
  );
}
```

### TypeScript配置

```json
{
  "exclude": ["node_modules", "sdk", "i18n"]
}
```

## 优势

1. **性能优越**: 无运行时开销，翻译在构建时完成
2. **维护简单**: 不需要修改源码，只需维护翻译文件
3. **类型安全**: 保持TypeScript类型检查的完整性
4. **精确控制**: AST级别的转换，避免误替换
5. **构建集成**: 与现有构建流程无缝集成

## 翻译操作指南

### 完整翻译流程示例

假设我们要翻译 `web/src/pages/project/[projectId]/prompts/index.tsx` 页面：

#### 1. 分析源码文件

```bash
# 查看需要翻译的页面源码
cat web/src/pages/project/[projectId]/prompts/index.tsx
```

#### 2. 提取需要翻译的文本

从源码中识别所有硬编码的英文字符串：

```javascript
// 示例：从源码中找到的文本
"Prompts"; // 页面标题
"New prompt"; // 按钮文本
"Create new prompt"; // 按钮提示
"No prompts found"; // 空状态文本
```

#### 3. 创建翻译文件

```bash
# 创建翻译文件目录
mkdir -p web/i18n/translations/zh-CN/pages/project

# 创建翻译文件
touch web/i18n/translations/zh-CN/pages/project/prompts.json
```

#### 4. 编写翻译内容

```json
{
  "Prompts": "提示词",
  "New prompt": "新建提示词",
  "Create new prompt": "创建新提示词",
  "No prompts found": "未找到提示词"
}
```

#### 5. 构建和测试

```bash
# 构建中文版本
NEXT_PUBLIC_LOCALE=zh-CN npm run build

# 验证翻译是否生效
grep -r "提示词" .next/static/chunks/

# 启动服务器查看效果
npm run start
```

### 翻译文件组织原则

#### 按页面路径组织

```
web/i18n/translations/zh-CN/
├── pages/
│   └── project/
│       ├── settings.json      # /project/[projectId]/settings
│       └── prompts.json       # /project/[projectId]/prompts
├── features/
│   └── organizations.json     # 功能模块翻译
└── common.json               # 通用翻译
```

#### 翻译键命名规范

- 使用完整的英文句子作为键
- 保持大小写和标点符号一致
- 避免使用缩写或简写

```json
// ✅ 正确
{
  "Project Settings": "项目设置",
  "Configure your project settings": "配置您的项目设置"
}

// ❌ 错误
{
  "project_settings": "项目设置",
  "config_project": "配置您的项目设置"
}
```

### 常见问题和解决方案

#### 问题1: 翻译没有生效

**原因**: 翻译键不匹配或文件路径错误
**解决**:

```bash
# 检查翻译文件是否存在
ls web/i18n/translations/zh-CN/pages/project/settings.json

# 检查构建日志
NEXT_PUBLIC_LOCALE=zh-CN npm run build 2>&1 | grep "TranslationLoader"
```

#### 问题2: 显示Unicode转义序列

**原因**: Babel生成器配置问题
**解决**: 确保AST转换器使用正确的生成配置：

```javascript
const result = generate(ast, {
  retainLines: true,
  jsescOption: {
    minimal: true, // 保持中文字符原样
  },
});
```

#### 问题3: 部分文本没有翻译

**原因**: 文本格式不匹配或包含变量
**解决**:

- 检查空格和标点符号是否完全一致
- 对于包含变量的文本，考虑使用模板字面量处理

### 最佳实践

1. **翻译文件管理**
   - 按页面路径组织翻译文件
   - 使用有意义的文件名
   - 定期备份翻译文件

2. **翻译质量**
   - 保持翻译的一致性和准确性
   - 注意专业术语的翻译
   - 考虑用户体验和本地化习惯

3. **测试验证**
   - 每次添加翻译后都要测试构建
   - 验证翻译在浏览器中的显示效果
   - 检查是否有遗漏的文本

4. **版本控制**
   - 将翻译文件纳入版本控制
   - 记录翻译的更新历史
   - 与代码变更同步更新翻译

## 注意事项

1. **翻译文件完整性**: 确保所有需要翻译的文本都有对应的翻译条目
2. **文本精确匹配**: 翻译系统基于精确字符串匹配，注意空格和标点
3. **构建环境**: 只在生产构建时应用翻译，开发模式保持英文
4. **文件路径**: 翻译文件路径需要与配置中的路径一致
5. **Unicode处理**: 确保中文字符正确显示，避免Unicode转义序列
6. **测试覆盖**: 每次翻译后都要进行完整的测试验证

## 快速开始

### 环境准备

确保您的开发环境已经设置好：

```bash
# 安装依赖
npm install

# 确保项目可以正常构建
npm run build
```

### 第一次翻译

1. **选择目标页面**: 选择一个需要翻译的页面，例如设置页面
2. **查看源码**: 找到页面文件，识别需要翻译的文本
3. **创建翻译文件**: 按照页面路径创建对应的翻译文件
4. **添加翻译**: 在JSON文件中添加英文到中文的映射
5. **测试构建**: 运行构建命令验证翻译效果

### 常用命令

```bash
# 构建中文版本
NEXT_PUBLIC_LOCALE=zh-CN npm run build

# 构建英文版本（默认）
npm run build

# 启动开发服务器
npm run start

# 检查翻译是否生效
grep -r "中文文本" .next/static/chunks/
```

### 获取帮助

如果遇到问题，请检查：

1. 翻译文件路径是否正确
2. 翻译键是否与源码完全匹配
3. 构建日志中是否有错误信息
4. 浏览器控制台是否有JavaScript错误

## 国际化工作流程

### 功能组件翻译流程

对于 `web/src/features/` 目录下的功能组件，翻译文件应按照以下结构组织：

```
web/i18n/translations/zh-CN/features/
├── projects/
│   └── components/
│       ├── HostNameProject.json
│       └── RenameProject.json
├── public-api/
│   └── components/
│       └── LLMApiKeyList.json
└── [other-features]/
    └── components/
        └── [ComponentName].json
```

### 翻译工作步骤

#### 1. 分析源代码文件

首先查看需要翻译的组件文件，识别所有硬编码的英文字符串：

```bash
# 查看组件文件
cat web/src/features/[feature-name]/components/[ComponentName].tsx
```

#### 2. 识别需要翻译的文本

从源代码中提取所有需要翻译的文本，包括：

- 页面标题
- 按钮文本
- 提示信息
- 表格列标题
- 错误消息
- 确认对话框文本

#### 3. 创建翻译文件

按照功能模块的目录结构创建翻译文件：

```bash
# 创建目录结构
mkdir -p web/i18n/translations/zh-CN/features/[feature-name]/components

# 创建翻译文件
touch web/i18n/translations/zh-CN/features/[feature-name]/components/[ComponentName].json
```

#### 4. 编写翻译内容

在JSON文件中添加英文到中文的映射，注意保持精确匹配：

```json
{
  "Component Title": "组件标题",
  "Button Text": "按钮文本",
  "Description text": "描述文本"
}
```

#### 5. 处理特殊格式

对于包含换行符、缩进或多行文本，需要保持与源代码完全一致：

```json
{
  "Multi-line text with\n        indentation": "多行文本的翻译",
  "Text with special\n            formatting": "特殊格式文本的翻译"
}
```

### 实际翻译示例

#### 示例1: HostNameProject 组件

**源代码位置**: `web/src/features/projects/components/HostNameProject.tsx`

**翻译文件**: `web/i18n/translations/zh-CN/features/projects/components/HostNameProject.json`

**翻译内容**:

```json
{
  "Host Name": "主机名",
  "When connecting to Langfuse, use this hostname / baseurl.": "连接到 Langfuse 时，请使用此主机名 / 基础URL。"
}
```

#### 示例2: RenameProject 组件

**源代码位置**: `web/src/features/projects/components/RenameProject.tsx`

**翻译文件**: `web/i18n/translations/zh-CN/features/projects/components/RenameProject.json`

**翻译内容**:

```json
{
  "Project Name": "项目名称",
  "Your Project will be renamed from": "您的项目将从",
  "to": "重命名为",
  "Your Project is currently named": "您的项目当前名称为",
  "No access": "无权限",
  "Save": "保存"
}
```

#### 示例3: LLMApiKeyList 组件

**源代码位置**: `web/src/features/public-api/components/LLMApiKeyList.tsx`

**翻译文件**: `web/i18n/translations/zh-CN/features/public-api/components/LLMApiKeyList.json`

**翻译内容**:

```json
{
  "LLM Connections": "LLM 连接",
  "Access Denied": "访问被拒绝",
  "You do not have permission to view LLM API keys for this project.": "您没有权限查看此项目的 LLM API 密钥。",
  "Connect your LLM services to enable evaluations and playground features.\n        Your provider will charge based on usage.": "连接您的 LLM 服务以启用评估和游乐场功能。您的提供商将根据使用量收费。",
  "Provider": "提供商",
  "Adapter": "适配器",
  "Base URL": "基础 URL",
  "API Key": "API 密钥",
  "Extra headers": "额外请求头",
  "None": "无",
  "default": "默认",
  "Delete LLM Connection": "删除 LLM 连接",
  "Are you sure you want to delete this connection? This action cannot\n            be undone.": "您确定要删除此连接吗？此操作无法撤销。",
  "Permanently delete": "永久删除",
  "Cancel": "取消"
}
```

### 翻译质量要求

#### 1. 精确匹配

- 翻译键必须与源代码中的文本完全一致
- 包括空格、标点符号、换行符和缩进
- 大小写敏感

#### 2. 术语一致性

- 相同概念使用相同的翻译术语
- 技术术语保持准确性
- 与现有翻译保持一致性

#### 3. 用户体验

- 使用符合中文习惯的表达方式
- 保持专业性和可读性
- 考虑本地化文化差异

### 验证和测试

#### 1. 构建测试

```bash
# 构建中文版本
NEXT_PUBLIC_LOCALE=zh-CN npm run build

# 验证翻译是否生效
grep -r "中文文本" .next/static/chunks/
```

#### 2. 功能测试

- 启动服务器查看翻译效果
- 测试所有相关功能
- 检查是否有遗漏的文本

#### 3. 质量检查

- 检查翻译的准确性和一致性
- 验证专业术语的使用
- 确保用户体验良好

### 常见问题和解决方案

#### 问题1: 翻译键不匹配

**现象**: 翻译没有生效
**原因**: 翻译键与源代码不完全一致
**解决**: 仔细检查源代码中的实际文本，包括所有空格和标点

#### 问题2: 多行文本处理

**现象**: 多行文本翻译失败
**原因**: 没有正确处理换行符和缩进
**解决**: 保持与源代码完全一致的格式

#### 问题3: 特殊字符处理

**现象**: 显示Unicode转义序列
**原因**: 字符编码问题
**解决**: 确保使用UTF-8编码保存文件

### 最佳实践总结

1. **文件组织**: 按功能模块组织翻译文件
2. **命名规范**: 使用组件名称作为文件名
3. **精确匹配**: 保持翻译键与源代码完全一致
4. **质量保证**: 每次翻译后都要测试验证
5. **版本控制**: 及时提交翻译文件到版本控制
6. **文档记录**: 记录翻译工作的过程和注意事项
