/**
 * 统一的API响应格式工具类
 * 
 * 标准响应格式:
 * {
 *   success: boolean,     // 请求是否成功
 *   message: string,      // 响应消息
 *   data: any,           // 响应数据
 *   code: number,        // 业务状态码（可选）
 *   timestamp: string,   // 响应时间戳
 *   requestId: string    // 请求ID（可选，用于追踪）
 * }
 */

class ApiResponse {
  /**
   * 成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @param {number} code - 业务状态码
   * @returns {object} 标准响应格式
   */
  static success(data = null, message = '操作成功', code = 200) {
    return {
      success: true,
      message,
      data,
      code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 失败响应
   * @param {string} message - 错误消息
   * @param {number} code - 业务状态码
   * @param {*} data - 错误详情数据（可选）
   * @returns {object} 标准响应格式
   */
  static error(message = '操作失败', code = 400, data = null) {
    return {
      success: false,
      message,
      data,
      code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 分页数据响应
   * @param {Array} items - 数据列表
   * @param {number} total - 总数
   * @param {number} page - 当前页码
   * @param {number} pageSize - 每页大小
   * @param {string} message - 响应消息
   * @returns {object} 标准分页响应格式
   */
  static paginated(items, total, page, pageSize, message = '获取数据成功') {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      success: true,
      message,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: parseInt(total),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      code: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 创建响应中间件
   * @param {object} req - Express请求对象
   * @param {object} res - Express响应对象
   * @param {function} next - Express next函数
   */
  static middleware(req, res, next) {
    // 为响应对象添加便捷方法
    res.success = (data, message, code) => {
      return res.json(ApiResponse.success(data, message, code));
    };

    res.error = (message, code, data) => {
      const statusCode = code >= 400 && code < 600 ? code : 400;
      return res.status(statusCode).json(ApiResponse.error(message, code, data));
    };

    res.paginated = (items, total, page, pageSize, message) => {
      return res.json(ApiResponse.paginated(items, total, page, pageSize, message));
    };

    next();
  }

  /**
   * 处理异步路由错误
   * @param {function} fn - 异步路由处理函数
   * @returns {function} 包装后的路由处理函数
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// 常用的业务状态码
ApiResponse.CODE = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// 常用的响应消息
ApiResponse.MESSAGE = {
  SUCCESS: '操作成功',
  CREATED: '创建成功',
  UPDATED: '更新成功',
  DELETED: '删除成功',
  NOT_FOUND: '资源不存在',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  VALIDATION_ERROR: '数据验证失败',
  INTERNAL_ERROR: '服务器内部错误',
  BAD_REQUEST: '请求参数错误'
};

module.exports = ApiResponse;