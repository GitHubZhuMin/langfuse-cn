const { ASTTransformer } = require("./ast-transformer");

/**
 * Webpack loader for compile-time translation
 * 支持基于路径的精确翻译匹配
 * @param {string} source - The source code
 * @param {any} map - Source map
 * @param {any} meta - Additional metadata
 */
function translationLoader(source, map, meta) {
  const callback = this.async();

  // 检查是否设置了locale环境变量
  const locale = process.env.NEXT_PUBLIC_LOCALE;
  if (!locale || locale === "en") {
    // 如果没有设置locale或locale是en，直接返回原代码
    return callback(null, source, map, meta);
  }

  try {
    // 创建转换器 - 不再预加载所有翻译
    const transformer = new ASTTransformer({
      locale,
      baseDir: "web/i18n/translations",
    });

    // 转换源码 - 转换器会根据文件路径自动加载对应的翻译
    const transformedCode = transformer.transformFile(
      this.resourcePath,
      source,
    );

    if (transformedCode) {
      console.log(`TranslationLoader: Transformed ${this.resourcePath}`);
      return callback(null, transformedCode, map, meta);
    } else {
      return callback(null, source, map, meta);
    }
  } catch (error) {
    console.error(`TranslationLoader error for ${this.resourcePath}:`, error);
    return callback(null, source, map, meta);
  }
}

module.exports = translationLoader;
