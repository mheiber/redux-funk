'use strict'
const { deepEqual } = require('assert')
const { createStore } = require('redux')
const { coalesceFunks, funkMiddleware, call, runFunks } = require('./src/index.js')
const test = require('tape')

const asyncAction = payload => new Promise((resolve, reject) => {
  resolve({type: 'SECOND', payload})
})

const reducer = coalesceFunks((state = {text: 'initial'}, action) => {
  switch (action.type) {
    case 'FIRST':
      call(action, [asyncAction, ['payload']])
      return Object.assign({}, state, {text: 'foo'})
    case 'SECOND':
      return Object.assign({}, {text: action.payload})
    default:
      return state
  }
})

test('integration: `call` and `coalesceFunks`', t => {
  const { dispatch, getState } = createStore(reducer)  
  const action = {type: 'FIRST'}
  dispatch(action)
  t.deepEqual(
            getState().funks[0],
            [asyncAction, ['payload']],
            'funks are added to `state`')
  t.deepEqual(
            Object.getOwnPropertySymbols(action),
            [],
            'reducer is pure (action restored to the way it was)')
  t.deepEqual(
            getState().text,
            'foo',
            'rest of state is updated correctly')
  dispatch({type: 'SECOND', payload: 'new payload'})
  t.deepEqual(
            getState(),
            {funks: [], text: 'new payload'},
            'funks are reset on each action'
            )
  t.end()
})

test('`runFunks`', t => {
  // BEGIN FIXTURES
  let calledWith
  const mock = arg => {
    calledWith = arg
    return Promise.resolve({type: 'BAR'})
  }
  const reducer = coalesceFunks((state={}, action) => {
    switch (action.type) {
      case 'FOO':
        call(action, [mock, [action.payload]])
        return state
      case 'BAR':
        return Object.assign(state, {'funksHaveRun': true}) 
    }
  })
  const store = createStore(reducer)
  const { dispatch, getState } = store
  runFunks(store)
  const action = {type: 'FOO', payload: 'hi'}
  dispatch(action)
  // END FIXTURES

  t.deepEqual(
    calledWith,
    action.payload,
    'calls funks'
  )

  // wait to next tick of event loop for promise to resolve
  setTimeout(() => {
    t.deepEqual(
      getState().funksHaveRun,
      true,
      'dispatches actions'
    )
    t.end()  
  })
})
