const constants = require('./config/constants')

const PlayerService = require('./services/PlayerService')
const RoomService = require('./services/RoomService')
const KubernetesService = require('./services/KubernetesService')

class Gateway {
  constructor () {
    this.p = new PlayerService(constants)
    this.r = new RoomService()
    this.k = new KubernetesService()

    this.subscribe()
  }

  subscribe () {
    this.p.on('ready', player => this.r.playerIsReady(player))
    this.p.on('choice', (player, shape) => this.r.playerChoice(player, shape))
    this.p.on('disconnect', player => this.r.playerDisconnected(player))

    this.r.on('opponent-left', (player, room) => {
      this.p.opponentLeft(player)
      this.k.terminateGameInstance(room.id)
    })
    this.r.on('preparing-room', room => {
      this.k.spawnGameInstance(room.id)
      this.p.roomIsBeingPrepared(room)
    })
    this.r.on('room-is-ready', room => this.p.roomIsReady(room))
    this.r.on('announcement', (room, results, score) => {
      this.p.announceResults(room, results, score)
    })

    this.k.on('instance-ready', (id, ip) => this.r.roomIsReady(id, ip))
  }
}

new Gateway()
