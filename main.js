const clear = require('clear')
const _ = require('lodash')
keypress = require('keypress')
require('colors')

const state = {
  columns: 80,
  rows: 40,
  actors: [
    {
      id: 'Player',
      character: ' '.bgWhite,
      position: {
        row: 10,
        column: 10,
      },
    }
  ]
}

keypress(process.stdin)

let output = ''

const logAndExit = (object) => {
  console.log(object)
  process.exit(22)
}

process.stdin.on('keypress', (ch, key) => {

  if (key && key.ctrl && key.name === 'c') {
    process.stdin.pause()
    logAndExit('Thanks for playing!')
  }

  const player = getPlayer()
  switch (key.name) {
    case 'w':
      player.position.row--
      break
    case 's':
      player.position.row++
      break
    case 'a':
      player.position.column--
      break
    case 'd':
      player.position.column++
      break
  }
  keepPlayerWithinArea()
})

if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true)
}
process.stdin.resume()

const clearTerminal = () => {
  output = ''
  clear()
}

const getPlayer = () => {
  return state.actors.find(a => a.id === 'Player')
}

const keepPlayerWithinArea = () => {
  const player = getPlayer()
  if (player.position.row < 1) {
    player.position.row = 1
  } else if (player.position.row > state.rows) {
    player.position.row = state.rows - 1
  }
  if (player.position.column < 1) {
    player.position.column = 1
  } else if (player.position.column > state.columns) {
    player.position.column = state.columns
  }
}

const getBlockOutput = (row, column) => {

  // Should we be a "wall" block?
  if (row === 0 || row === state.rows - 1) {
    return '-'
  }
  if (column === 1 || column === state.columns) {
    return '|'
  }

  let matchingActor = null
  state.actors.forEach(actor => {
    if (actor.position.row === row && actor.position.column === column) {
      matchingActor = actor
    }
  })
  return matchingActor ? matchingActor.character : ' '
}

const render = () => {
  clearTerminal()
  const blockAmount = state.columns * state.rows
  let rowCounter = 0
  let columnCounter = 0
  for (let index = 0; index < blockAmount; index++) {
    columnCounter++
    output += getBlockOutput(rowCounter, columnCounter)
    if (columnCounter === state.columns) {
      rowCounter++
      output += '\n'
      columnCounter = 0
    }
  }
  console.log(output)
}

const updateEnemies = () => {
  const enemies = state.actors.filter(a => a.id === 'Enemy')
  const player = getPlayer()
  enemies.forEach(enemy => {
    // Slow these annoying fucks down a bit.
    if (_.random(0, 1) === 0) {
      return
    }
    enemy.position.row += (enemy.position.row > player.position.row ? -1 : 1) + _.random(-1, 1)
    enemy.position.column += (enemy.position.column > player.position.column ? -1 : 1) + _.random(-1, 1)
  })
}

const spawnEnemies = () => {
  state.actors.push(
    {
      id: 'Enemy',
      character: ' '.bgRed,
      position: {
        row: state.rows,
        column: _.random(0, state.columns),
      },
    }
  )
  setTimeout(spawnEnemies, _.random(1000, 10000))
}

const updateState = () => {
  keepPlayerWithinArea()
  updateEnemies()
}

const step = () => {
  updateState()
  render()
  setTimeout(step, 60)
}

const init = () => {
  clearTerminal()
  spawnEnemies()
  step()
}

init()
