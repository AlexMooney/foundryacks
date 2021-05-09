
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createAcksMacro(data, slot) {
    if ( data.type !== "Item" ) return;
    if (!( "data" in data ) ) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;
    const actor = game.actors.get(data.actorId);

    // Create the macro command, including the actor's name if it was dragged
    // from a sheet
    let command;
    if ( actor === null )
      command = `game.acks.rollItemMacro("${item.name}");`;
    else
      command = `game.acks.rollItemMacro("${item.name}", "${actor.data.name}");`;

    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if ( !macro ) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: {"acks.itemMacro": true}
      });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/* -------------------------------------------- */

/**
 * Invoke the roll() method on the named item owned by the named actor; if
 * no actor was specified, attempt to use a selected token or the user's
 * default actor.
 * @param {string} itemName
 * @param {string} actorName
 * @return {Promise}
 */
export function rollItemMacro(itemName, actorName) {
    let actor;

    // If the actor name is specified, use it instead of looking for a token;
    // otherwise, look for a selected token
    if ( typeof actorName !== 'undefined' ) {
      const userId = game.user.data._id;
        for ( const itActor of game.actors.values() ) {
          // Find the actor
          if ( itActor.data.name === actorName ) {
            // Determine if the user is the GM or the owner
            if ( game.user.isGM || itActor.data.permission.get(userId) === 3 ) {
              // Found the actor and the user has permission to use its items
              actor = itActor;
              break;
            }
          }
        }

         if ( !actor )
           return ui.notification.warn(`You do not control an Actor named ${actorName}`);

    } else {
      const speaker = ChatMessage.getSpeaker();
      if ( speaker.token ) actor = game.actors.tokens[speaker.token];
      if ( !actor ) actor = game.actors.get(speaker.actor);
    }

    // Get matching items
    const items = actor ? actor.items.filter(i => i.name === itemName) : [];
    if ( items.length > 1 ) {
      ui.notifications.warn(`Your controlled Actor ${actor.name} has more than one Item with name ${itemName}. The first matched item will be chosen.`);
    } else if ( items.length === 0 ) {
      return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
    }
    const item = items[0];

    // Trigger the item roll
    return item.roll();
}

