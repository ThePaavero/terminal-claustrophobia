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
  ],
  enemiesToKill: [],
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
    // Movement.
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

    // Weapons.
    case 'i':
      shoot('up')
      break
    case 'k':
      shoot('down')
      break
    case 'j':
      shoot('left')
      break
    case 'l':
      shoot('right')
      break
  }
  keepActorWithinArea(player)
})

if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true)
}
process.stdin.resume()

const clearTerminal = () => {
  output = ''
  clear()
}

const shoot = (direction) => {
  const player = getPlayer()
  state.actors.push(
    {
      id: 'Bullet',
      character: '·',
      position: {
        row: player.position.row,
        column: player.position.column,
      },
      direction,
    }
  )
}

const getPlayer = () => {
  return state.actors.find(a => a.id === 'Player')
}

const keepActorWithinArea = (actor) => {
  const offset = 2
  if (actor.position.row < offset - 1) {
    actor.position.row = offset - 1
  } else if (actor.position.row > state.rows) {
    actor.position.row = state.rows - offset
  }
  if (actor.position.column < offset) {
    actor.position.column = offset
  } else if (actor.position.column > state.columns) {
    actor.position.column = state.columns
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
    if (_.random(0, 5) > 0) {
      return
    }
    enemy.position.row += (enemy.position.row > player.position.row ? -1 : 1) + _.random(-1, 1)
    enemy.position.column += (enemy.position.column > player.position.column ? -1 : 1) + _.random(-1, 1)
  })
  state.enemiesToKill.forEach(enemyToKill => {
    logAndExit(enemyToKill) // @todo How do I fucking remove the enemy from my actors array? :D
  })
}

const updateBullets = () => {
  const bullets = state.actors.filter(a => a.id === 'Bullet')
  bullets.forEach(bullet => {
    switch (bullet.direction) {
      case 'up':
        bullet.position.row--
        break
      case 'down':
        bullet.position.row++
        break
      case 'left':
        bullet.position.column--
        break
      case 'right':
        bullet.position.column++
        break
    }
  })
}

const bulletOverlapsEnemyOrPlayer = (bullet) => {
  let result = false
  state.actors.forEach(actor => {
    const actorType = actor.id
    if (actorType === 'Player' || actorType === 'Bullet') {
      return null
    }
    if (bullet.position.row === actor.position.row && bullet.position.column === actor.position.column) {
      // Ouch!
      result = {
        bullet,
        actor,
      }
    }
  })
  return result
}

const checkForBulletHits = () => {
  const bullets = state.actors.filter(a => a.id === 'Bullet')
  bullets.forEach(bullet => {
    const hitResult = bulletOverlapsEnemyOrPlayer(bullet)
    if (!hitResult) {
      return
    }
    // Kill the enemy.
    const enemyToKill = hitResult.actor
    state.enemiesToKill.push(enemyToKill)
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
  keepActorWithinArea(getPlayer())
  updateEnemies()
  updateBullets()
  checkForBulletHits()
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
