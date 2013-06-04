/*
 * Least Recently Used Cache AMD module.
 */
define(function () {
    var module     = {};
    var lrucache   = {};
    var asLRUCache = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private module functions.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function createCacheEntry(key, value, older, newer) {
        return {
            key  : key,
            value: value,
            older: older,
            newer: newer
        };
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // LRU cache mixin.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    asLRUCache = (function () {
        /*
         * Initialize the LRU cache object with required properties.
         */
        function initLRU(config) {
            /*
             * Configurable properties.
             */
            this.__maxSize  = config.maxSize || 4;

            this.__size   = 0;
            this.__keys   = {};
            this.__oldest = null;
            this.__newest = null;
            this.__hits   = 0;
            this.__misses = 0;

            return this;
        }

        /*
         * Return the value associated with the key. Updates the entry to be
         * the newest entry. Returns undefined if there is no value for the
         * key.
         */
        function get(key) {
            var entry = this.__keys[key];

            /*
             * If there is no entry for this key, return undefined.
             */
            if ( entry === undefined ) {
                this.__misses += 1;
                return;
            }

            /*
             * If the entry is the newest entry, just return the value.
             */
            if ( entry === this.__newest ) {
                this.__hits += 1;
                return entry.value;
            }

            if ( entry.newer ) {
                if ( entry === this.__oldest ) {
                    this.__oldest = entry.newer;
                }

                entry.newer.older = entry.older;
            }

            if ( entry.older ) {
                entry.older.newer = entry.newer;
            }

            entry.newer = null;
            entry.older = this.__newest;

            if ( this.__newest ) {
                this.__newest.newer = entry;
            }

            this.__newest = entry;
            this.__hits += 1;

            return entry.value;
        }

        /*
         * Put the value for key into the cache. Replaces any key that
         * is already there. Returns a removed value if the cache was full,
         * otherwise undefined value.
         */
        function put(key, value) {
            var oldEntry = this.__newest;
            var entry = createCacheEntry(key, value, oldEntry, null);
            var removedEntry = null;
            var removedVal;

            this.__keys[key] = entry;

            /*
             * If there is already a newest, link it to the new entry.
             * Otherwise, it's the first entry (oldest).
             */
            if (oldEntry) {
                oldEntry.newer = entry;
            }
            else {
                this.__oldest = entry;
            }

            this.__newest = entry;

            /*
             * If we reach the size limit, remove the oldest.
             */
            if ( this.__size === this.__maxSize ) {
                removedEntry = this.__oldest;
                this.__oldest = removedEntry.newer;
                this.__oldest.older = null;
                removedEntry.older = removedEntry.newer = null;
                delete this.__keys[removedEntry.key];
                removedVal = removedEntry.value;
            }
            else {
                this.__size += 1;
            }

            return removedVal;
        }

        /*
         * For each cache entry, pass the value to the function, newest to
         * oldest.
         */
        function forEach(fn, context) {
            var entry = this.__newest;

            while(entry) {
                (context) ?
                    fn.call( context, entry.value ) :
                    fn( entry.value );

                entry = entry.older;
            }
        }

        /*
         * Clear all cache entries.
         */
        function clearAll() {
            this.__size   = 0;
            this.__hits   = 0;
            this.__misses = 0;
            this.__newest = this.__oldest = null;
            this.__keys   = {};
        }

        /*
         * Get the current size of the cache.
         */
        function size() {
            return this.__size;
        }

        /*
         * Returns an array of the keys in the cache from newest to oldest.
         */
        function keys() {
            var keys = [];
            var entry = this.__newest;

            while(entry) {
                keys.push( entry.key );
                entry = entry.older;
            }

            return keys;
        }

        /*
         * Return an array of the values in the cache from newest to oldest.
         */
        function values() {
            var vals = [];
            var entry = this.__newest;

            while(entry) {
                vals.push( entry.value );
                entry = entry.older;
            }

            return vals;
        }

        /*
         * Peek at the value for a key without modifying the cache state.
         * Returns the value or undefined if no value for the key.
         */
        function peek(key) {
            return this.__keys[key];
        }

        /*
         * Get the number of times a key was found.
         */
        function hits() {
            return this.__hits;
        }
        
        /*
         * Get the number of times a key was not found.
         */
        function misses() {
            return this.__misses;
        }

        return function () {
            this.initLRU  = initLRU;
            this.get      = get;
            this.put      = put;
            this.forEach  = forEach;
            this.clearAll = clearAll;
            this.size     = size;
            this.keys     = keys;
            this.values   = values;
            this.peek     = peek;
            this.hits     = hits;
            this.misses   = misses;
        };
    } ());


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Prototype object.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    asLRUCache.call(lrucache);


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Factory function.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function create(config) {
        var obj = Object.create(lrucache);

        if (config && typeof config === 'object') {
            obj.initLRU(config);
        }
    
        return obj;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public module.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    module.asLRUCache = asLRUCache; // mixin
    module.create     = create;     // factory

    return module;
});
