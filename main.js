const clear = require('clear')
const _ = require('lodash')
keypress = require('keypress')
require('colors')

const rowAmount = 40
const columnAmount = 80

const state = {
  columns: columnAmount,
  rows: rowAmount,
  actors: [
    {
      id: 'Player',
      character: ' '.bgWhite,
      points: 0,
      health: 5,
      position: {
        row: rowAmount / 2,
        column: columnAmount / 2,
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
      shoot(player, 'up')
      break
    case 'k':
      shoot(player, 'down')
      break
    case 'j':
      shoot(player, 'left')
      break
    case 'l':
      shoot(player, 'right')
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

const shoot = (shooter, direction) => {
  const bullet = {
    id: 'Bullet',
    character: '·'.yellow,
    position: {
      row: shooter.position.row,
      column: shooter.position.column,
    },
    direction,
  }
  state.actors.push(bullet)

  keepActorWithinArea(bullet)
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
    return '-'.gray
  }
  if (column === 1 || column === state.columns) {
    return '|'.gray
  }

  let matchingActor = null
  state.actors.forEach(actor => {
    if (actor.position.row === row && actor.position.column === column) {
      matchingActor = actor
    }
  })
  return matchingActor ? matchingActor.character : ' '
}

const getHeaderContent = () => {
  return `\n HEALTH: ${getPlayer().health}\tPOINTS: ${getPlayer().points}\n`
}

const render = () => {
  clearTerminal()
  const blockAmount = state.columns * state.rows
  let rowCounter = 0
  let columnCounter = 0

  output += getHeaderContent()

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
    state.actors.forEach(actor => {
      if (actor.position.row === enemyToKill.position.row && actor.position.column === enemyToKill.position.column) {
        state.actors = state.actors.filter(a => a !== enemyToKill)
      }
    })
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

    // Kill if out of area.
    if (bullet.position.column < 0 || bullet.position.column > state.columns || bullet.position.row < 0 || bullet.position.row > state.rows) {
      state.actors.forEach(actor => {
        if (actor.position.row === bullet.position.row && actor.position.column === bullet.position.column) {
          state.actors = state.actors.filter(a => a !== bullet)
        }
      })
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
    // Reward player.
    addToPoints(1)
    makeAreaSmallerBy(1)
  })
}

const makeAreaSmallerBy = (by) => {
  state.rows -= by
  state.columns -= by
}

const gameOver = () => {
  // @todo
  logAndExit('GAME OVER')
}

const updateHealthWith = (add) => {
  const player = getPlayer()
  player.health += add
  if (player.health < 1) {
    gameOver()
  }
}

const addToPoints = (add) => {
  getPlayer().points += add
}

const checkForEnemyHit = () => {
  const enemies = state.actors.filter(a => a.id === 'Enemy')
  const player = getPlayer()
  enemies.forEach(enemy => {
    if (enemy.position.row === player.position.row && enemy.position.column === player.position.column) {
      updateHealthWith(-1)
    }
  })
}

const spawnEnemies = () => {
  state.actors.push(
    {
      id: 'Enemy',
      character: ' '.bgRed,
      position: {
        row: _.random(0, 1) === 0 ? state.rows : 0,
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
  checkForEnemyHit()
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
