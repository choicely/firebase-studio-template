const defaultComponentName = 'hello'

const componentMapping = {
  [defaultComponentName]: () => require('./components/Hello'),
  counter: () => require('./components/Counter'),
  tic_tac_toe: () => require('./components/TicTacToe'),
}

export {componentMapping, defaultComponentName}
