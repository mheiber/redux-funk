'use strict'
var queue = Symbol('actions')

module.exports.call = function(action, funk) {
  action[queue] = (action[queue] || []).concat([funk])
}

// function from reducer to another reducer
// the new reducer adds a 'funks' key with declarative effects
// of type [func, [args]]
module.exports.coalesceFunks = function(reducer) {
  return function(state, action) {
    // restore action to the way it was
    delete action[queue]
    const nextState = reducer(state, action)
    return Object.assign({}, nextState || {}, {funks: action[queue]})
  }
}

// listen for store updates, and run each funk.
// `runFunks` assumes that each funk either returns nothing
// or returns a promise for an action.
// `runFunks` dispatches the actions
// You can replace `runFunks` with your own implementation
// if you prefer callbacks over promises, for example
module.exports.runFunks = function(store) {
  store.subscribe(function() {
    var funks = store.getState().funks || []
    funks.forEach(function(funk) {
      var func = funk[0]
      var args = funk[1]
      var promiseForAction = func.apply(null, args)
      // dispatch 
      promiseForAction && promiseForAction.then && promiseForAction.then(store.dispatch)
    })
  })
}
