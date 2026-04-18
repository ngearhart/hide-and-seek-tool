/**
 * GAME STATE MANAGER
 * 
 * This file manages the undo and redo functionality for the game.
 * 
 * We maintain 2 stacks: A history stack and an undo stack.
 *  We start by adding the "original" or "base" state to the history stack.
 *  The first element in the history stack must always contain this base state.
 * Every time we perform an operation, we push the new state the history stack.
 *  This means that the top of the history stack will always contain the currently used game state.
 * 
 * To undo, we pop the latest off the top of the history stack and set the current game state
 *  to the second-from-the-top element. We take this latest element and put it onto the undo stack.
 * 
 * To redo, we pop the latest off the top of the undo stack and set the game state to that.
 */

import { useStore } from "@/stores/app";
import type { GameRecord } from "@/utils"
import { set, type DatabaseReference } from "firebase/database"


export const updateGame = async(newGameObject: GameRecord, oldGameObject: GameRecord, gamesDbRef: DatabaseReference, rewriteLast: boolean = false) => {
    const store = useStore();
    if (store.$state.gameHistory.length == 0) {
        // Base case if the user loads the page for the first time
        // Also add the old state to undo history
        // TODO: Probably could be optimized better
        store.$state.gameHistory.push(oldGameObject);
    }
    if (rewriteLast) {
        // This parameter is set to mean we don't want to track the previous action
        // For example, the custom pin drop and label operations are recorded separately, but
        //  it is not useful to the user to undo the label operation. 
        store.$state.gameHistory.pop();
    }
    store.$state.gameHistory.push(newGameObject);
    // When you perform something new, you clear the Undo history (for redos)
    store.$state.undoHistory = [];
    await set(
        gamesDbRef, newGameObject
    );
};

export const undoGame = async(gamesDbRef: DatabaseReference) => {
    const store = useStore();
    if (store.$state.gameHistory.length < 2) {
        throw "Cannot call Undo function when no history exists (history must contain base state and >= 1 operation)";
    }
    store.$state.undoHistory.push(store.$state.gameHistory.pop()!);
    await set(
        gamesDbRef, store.$state.gameHistory[store.$state.gameHistory.length - 1]
    );
}

export const redoGame = async(gamesDbRef: DatabaseReference) => {
    const store = useStore();
    if (store.$state.undoHistory.length == 0) {
        throw "Cannot call Redo function when no history exists";
    }
    const redoState = store.$state.undoHistory.pop()!;
    store.$state.gameHistory.push(redoState);
    await set(
        gamesDbRef, redoState
    );
}
