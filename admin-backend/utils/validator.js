/**
 * 数据验证工具类
 * 提供常用的数据验证方法
 */

class Validator {
  /**
   * 验证必填字段
   * @param {object} data - 要验证的数据对象
   * @param {Array} requiredFields - 必填字段数组
   * @returns {object} 验证结果 {isValid: boolean, message: string, field: string}
   */
  static validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return {
          isValid: false,
          message: `${field} 不能为空`,
          field
        };
      }
    }
    return { isValid: true };
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否为有效邮箱
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证URL格式
   * @param {string} url - URL地址
   * @returns {boolean} 是否为有效URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @param {object} options - 验证选项
   * @returns {object} 验证结果
   */
  static validatePassword(password, options = {}) {
    const {
      minLength = 6,
      maxLength = 50,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false
    } = options;

    if (!password || password.length < minLength) {
      return {
        isValid: false,
        message: `密码长度不能少于${minLength}位`
      };
    }

    if (password.length > maxLength) {
      return {
        isValid: false,
        message: `密码长度不能超过${maxLength}位`
      };
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: '密码必须包含大写字母'
      };
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: '密码必须包含小写字母'
      };
    }

    if (requireNumbers && !/\d/.test(password)) {
      return {
        isValid: false,
        message: '密码必须包含数字'
      };
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        message: '密码必须包含特殊字符'
      };
    }

    return { isValid: true };
  }

  /**
   * 验证分页参数
   * @param {object} query - 查询参数
   * @returns {object} 标准化的分页参数
   */
  static validatePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || parseInt(query.limit) || 10));
    const offset = (page - 1) * pageSize;

    // 安全处理search参数，确保它是字符串
    let search = '';
    if (query.search && typeof query.search === 'string') {
      search = query.search.trim();
    }

    return {
      page,
      pageSize,
      offset,
      search
    };
  }

  /**
   * 验证ID参数
   * @param {string|number} id - ID值
   * @returns {object} 验证结果
   */
  static validateId(id) {
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      return {
        isValid: false,
        message: 'ID必须是正整数'
      };
    }
    return {
      isValid: true,
      id: numId
    };
  }

  /**
   * 验证枚举值
   * @param {*} value - 要验证的值
   * @param {Array} allowedValues - 允许的值数组
   * @param {string} fieldName - 字段名称
   * @returns {object} 验证结果
   */
  static validateEnum(value, allowedValues, fieldName = '字段') {
    if (!allowedValues.includes(value)) {
      return {
        isValid: false,
        message: `${fieldName}的值必须是: ${allowedValues.join(', ')} 中的一个`
      };
    }
    return { isValid: true };
  }

  /**
   * 验证字符串长度
   * @param {string} str - 字符串
   * @param {number} minLength - 最小长度
   * @param {number} maxLength - 最大长度
   * @param {string} fieldName - 字段名称
   * @returns {object} 验证结果
   */
  static validateLength(str, minLength = 0, maxLength = 255, fieldName = '字段') {
    if (typeof str !== 'string') {
      return {
        isValid: false,
        message: `${fieldName}必须是字符串`
      };
    }

    if (str.length < minLength) {
      return {
        isValid: false,
        message: `${fieldName}长度不能少于${minLength}个字符`
      };
    }

    if (str.length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName}长度不能超过${maxLength}个字符`
      };
    }

    return { isValid: true };
  }

  /**
   * 清理和验证HTML内容
   * @param {string} html - HTML内容
   * @returns {string} 清理后的HTML
   */
  static sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // 简单的HTML清理，移除潜在危险的标签和属性
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
}

module.exports = Validator;