const readline = require('readline')
// require('colors')

const state = {
  columns: 80,
  rows: 40,
  actors: [
    {
      id: 'Player',
      character: '★',
      position: {
        row: 10,
        column: 10,
      },
    }
  ]
}

const clearTerminal = () => {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

const getBlockOutput = (row, column) => {
  let matchingActor = null
  state.actors.forEach(actor => {
    if (actor.position.row === row && actor.position.column === column) {
      matchingActor = actor
    }
  })
  return matchingActor ? matchingActor.character : '.'
}

const render = () => {
  clearTerminal()
  let output = ''
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

const step = () => {
  render()
  setTimeout(step, 20)
}

step()
