'use strict'
var queue = Symbol('actions')

module.exports.call = function(action, func, maybeArgs) {
  action[queue] = (action[queue] || []).concat([func, maybeArgs])
}

module.exports.getEffects = function(action) {
  return action[queue]
}

module.exports.funkMiddleware = function(store) {
  var dispatch = store.dispatch.bind(store)
  return function(next) {
    return function(action) {
      (action[queue] || []).forEach(function(funcAndArgs){
        var func = funcAndArgs[0]
        var maybeArgs = funcAndArgs[1]
        var argsWithDispatch = [dispatch].concat(maybeArgs || [])
        func.apply(null, argsWithDispatch)
      })
      return next(action)
    }
  }
}
