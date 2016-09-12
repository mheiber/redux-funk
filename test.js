'use strict'
const { deepEqual } = require('assert')
const { createStore, applyMiddleware } = require('redux')
const { coalesceFunks, funkMiddleware, call, runFunks } = require('./index.js')

const asyncAction = payload => new Promise((resolve, reject) => {
  resolve({type: 'SECOND', payload})
})

const reducer = coalesceFunks((state = {text: 'initial'}, action) => {
  switch (action.type) {
    case 'FIRST':
      call(action, [asyncAction, ['payload']])
      return Object.assign({}, state, {text: 'foo'})
    case 'SECOND':
      return Object.assign({}, {state: {text: action.payload}})
    default:
      return state
  }
})

const store = createStore(
  reducer,
  applyMiddleware(funkMiddleware)
)

runFunks(store)
store.subscribe(() => {
  console.log(store.getState())
})
store.dispatch({type: 'FIRST'})

