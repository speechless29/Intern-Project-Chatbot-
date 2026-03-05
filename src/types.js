/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {'user' | 'model'} role
 * @property {string} content
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 * @property {number} updatedAt
 */
