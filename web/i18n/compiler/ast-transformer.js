"use strict";
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

class ASTTransformer {
  /**
   * @param {any} config
   */
  constructor(config) {
    this.translations = config.translations;
    this.locale = config.locale;
    this.baseDir = config.baseDir || "web/i18n/translations";
  }

  // 加载翻译文件
  /**
   * @param {any} locale
   * @param {any} baseDir
   */
  static loadTranslations(locale, baseDir = "web/i18n/translations") {
    const translations = {};

    /** @param {any} dirPath */
    const loadDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          loadDir(fullPath);
        } else if (file.endsWith(".json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const fileTranslations = JSON.parse(content);
            Object.assign(translations, fileTranslations);
          } catch (error) {
            console.warn(
              `Failed to load translations from ${fullPath}:`,
              error,
            );
          }
        }
      }
    };

    const localeDir = path.join(baseDir, locale);
    loadDir(localeDir);

    return translations;
  }

  // 根据文件路径获取对应的翻译文件
  /**
   * @param {string} filePath - 源文件路径
   * @returns {object} - 对应的翻译对象
   */
  getTranslationsForFile(filePath) {
    // 将源文件路径转换为翻译文件路径
    // 例如: /Users/***/Code/langfuse-cn/web/src/features/annotation-queues/components/DeleteAnnotationQueueButton.tsx
    // 转换为: /Users/***/Code/langfuse-cn/web/i18n/translations/zh-CN/features/annotation-queues/components/DeleteAnnotationQueueButton.json

    // 获取当前工作目录
    const cwd = process.cwd();

    // 计算相对于当前工作目录的路径
    const relativeToCwd = path.relative(cwd, filePath);

    // 检查是否是src下的文件（当前在web目录中）
    if (!relativeToCwd.startsWith("src/")) {
      // console.log(
      //   `TranslationLoader: File ${filePath} is not under src/, skipping translation`,
      // );
      return {};
    }

    // 移除src前缀，获取相对路径
    const relativePath = relativeToCwd.replace("src/", "");
    const dirPath = path.dirname(relativePath);
    const fileName = path.basename(relativePath, path.extname(relativePath));

    // 构建翻译文件路径 - 相对于当前工作目录（web目录）
    const translationFilePath = path.join(
      cwd,
      "i18n",
      "translations",
      this.locale,
      dirPath,
      `${fileName}.json`,
    );

    // 尝试加载对应的翻译文件
    if (fs.existsSync(translationFilePath)) {
      try {
        const content = fs.readFileSync(translationFilePath, "utf-8");
        const fileTranslations = JSON.parse(content);
        // console.log(
        //   `TranslationLoader: Loaded translations from ${translationFilePath}`,
        // );
        return fileTranslations;
      } catch (error) {
        console.warn(
          `Failed to load translations from ${translationFilePath}:`,
          error,
        );
        return {};
      }
    } else {
      // 如果没有找到对应的翻译文件，返回空对象
      // console.log(
      //   `TranslationLoader: No translation file found for ${filePath} (expected: ${translationFilePath})`,
      // );
      return {};
    }
  }

  // 转换单个文件
  /**
   * @param {any} filePath
   * @param {any} sourceCode
   */
  transformFile(filePath, sourceCode = null) {
    try {
      if (!sourceCode) {
        sourceCode = fs.readFileSync(filePath, "utf-8");
      }

      // 获取该文件对应的翻译
      const fileTranslations = this.getTranslationsForFile(filePath);

      // 如果没有对应的翻译，直接返回原代码
      if (Object.keys(fileTranslations).length === 0) {
        return null;
      }

      const ast = parser.parse(sourceCode, {
        sourceType: "module",
        plugins: ["jsx", "typescript", "decorators-legacy"],
      });

      let hasChanges = false;

      traverse(ast, {
        // 处理字符串字面量
        StringLiteral(path) {
          const value = path.node.value;
          if (fileTranslations[value]) {
            path.node.value = fileTranslations[value];
            hasChanges = true;
          }
        },

        // 处理JSX文本
        JSXText(path) {
          const value = path.node.value.trim();
          if (value && fileTranslations[value]) {
            path.node.value = fileTranslations[value];
            hasChanges = true;
          }
        },

        // 处理模板字面量
        TemplateLiteral(path) {
          path.node.quasis.forEach((quasi) => {
            const value = quasi.value.raw.trim();
            if (value && fileTranslations[value]) {
              quasi.value.raw = fileTranslations[value];
              quasi.value.cooked = fileTranslations[value];
              hasChanges = true;
            }
          });
        },
      });

      if (hasChanges) {
        const result = generate(ast, {
          retainLines: true,
          jsescOption: {
            minimal: true, // 保持中文字符原样，不转换为Unicode转义序列
          },
        });
        return result.code;
      }

      return null;
    } catch (error) {
      console.error(`Error transforming file ${filePath}:`, error);
      return null;
    }
  }

  // 转换目录中的所有文件
  /**
   * @param {any} dirPath
   * @param {any} outputDir
   */
  transformDirectory(dirPath, outputDir) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory does not exist: ${dirPath}`);
      return;
    }

    /**
     * @param {any} currentDir
     * @param {any} currentOutputDir
     */
    const transformRecursive = (currentDir, currentOutputDir) => {
      if (!fs.existsSync(currentOutputDir)) {
        fs.mkdirSync(currentOutputDir, { recursive: true });
      }

      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const sourcePath = path.join(currentDir, file);
        const targetPath = path.join(currentOutputDir, file);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
          transformRecursive(sourcePath, targetPath);
        } else if (this.shouldTransformFile(file)) {
          const transformedCode = this.transformFile(sourcePath);
          if (transformedCode) {
            fs.writeFileSync(targetPath, transformedCode);
            console.log(`Transformed: ${sourcePath} -> ${targetPath}`);
          } else {
            // 如果没有变化，直接复制文件
            fs.copyFileSync(sourcePath, targetPath);
          }
        } else {
          // 非源代码文件直接复制
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    };

    transformRecursive(dirPath, outputDir);
  }

  // 判断是否应该转换文件
  /**
   * @param {any} filename
   */
  shouldTransformFile(filename) {
    const extensions = [".tsx", ".ts", ".jsx", ".js"];
    return extensions.some((ext) => filename.endsWith(ext));
  }
}

module.exports = { ASTTransformer };
