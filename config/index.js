module.exports = require(
  process.env.NODE_ENV !== 'production'
    ? './default'
    : './production'
)
