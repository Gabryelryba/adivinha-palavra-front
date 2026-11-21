// What to do when the socket connects: on the first connection of a page, and
// again after every reconnect.
//
// status: the screen's status (connecting | menu | joining | lobby | playing | ended).
// remembered: recallRoom() from arcade-hub-ui/roomMemory.js, or null: the room
//   this tab was in before the page reloaded (a phone that put the tab in the
//   background often reloads it when the player comes back).
// inviteCode: the ?code= the page opened with, not used yet.
//
// -> { action, code?, joinAfter?, usedInvite }
//   "resume-seat": still in the waiting room on this page; ask for the seat back.
//   "dropped": the match went on without us (it cannot be resumed).
//   "resume-remembered": the page reloaded in a waiting room; ask the server for
//     that seat (`code`). If it is gone and the invite was for the same room,
//     join it again as a new player (`joinAfter`).
//   "join": join the invite's room.
//   "menu": nothing to go back to.
export function connectDecision({ status, remembered = null, inviteCode = null, gameId }) {
  if (status === "lobby") return { action: "resume-seat", usedInvite: false };
  if (status === "playing" || status === "ended") return { action: "dropped", usedInvite: false };

  const room = remembered && (remembered.gameId == null || remembered.gameId === gameId) ? remembered : null;
  // An invite to another room wins over the remembered one: the player chose it.
  if (room && (!inviteCode || inviteCode === room.code)) {
    const usedInvite = Boolean(inviteCode);
    if (room.phase === "playing") return { action: "dropped", usedInvite };
    return { action: "resume-remembered", code: room.code, joinAfter: inviteCode || null, usedInvite };
  }
  if (inviteCode) return { action: "join", code: inviteCode, usedInvite: true };
  return { action: "menu", usedInvite: false };
}
