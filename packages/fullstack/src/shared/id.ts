// generate random crypto strong id

// require crypto on node and window.crypto in browser

export function randomId(length = 12) {
    if (typeof window !== 'undefined' && window.crypto) {
        const arr = new Uint8Array(length);
        window.crypto.getRandomValues(arr)
        return btoa(String.fromCharCode(...arr)).slice(0, length)
    }
    // @ts-ignore
    if (typeof require !== 'undefined') {
        // @ts-ignore
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('base64').slice(0, length)
    }
    const arr = new Uint8Array(length).map(() => Math.floor(Math.random() * 256))
    return String.fromCharCode(...arr)
}