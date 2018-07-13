'use strict';

const util = require('util');
const { SPLAT } = require('triple-beam');

/**
 * Captures the number of format (i.e. %s strings) in a given string.
 * Based on `util.format`, see Node.js source:
 * https://github.com/nodejs/node/blob/b1c8f15c5f169e021f7c46eb7b219de95fe97603/lib/util.js#L201-L230
 * @type {RegExp}
 */
const formatRegExp = /%[scdjifoO%]/g;

/**
 * Captures the number of escaped % signs in a format string (i.e. %s strings).
 * @type {RegExp}
 */
const escapedPercent = /%%/g;

class Splatter {
  constructor(opts) {
    this.options = opts;
  }

  /**
     * Check to see if tokens <= splat.length, assign { splat, meta } into the
     * `info` accordingly, and write to this instance.
     *
     * @param  {Info} info Logform info message.
     * @param  {String[]} tokens Set of string interpolation tokens.
     * @returns {Info} Modified info message
     * @private
     */
  _splat(info, tokens) {
    const msg = info.message;
    const splat = info[SPLAT] || info.splat || [];
    const percents = msg.match(escapedPercent);
    const escapes = percents && percents.length || 0;

    // We only process the number of splats that we expect.
    // All other splats will be processed (if desired),
    // by another transform.
    const expectedSplat = tokens.length - escapes;
    const splatMerge = expectedSplat > 0
      ? splat.splice(0, expectedSplat)
      : [];

    info.message = util.format(msg, ...splatMerge);

    return info;
  }

  /**
     * Transforms the `info` message by using `util.format` to complete
     * any `info.message` provided it has string interpolation tokens.
     * If no tokens exist then `info` is immutable.
     *
     * @param  {Info} info Logform info message.
     * @param  {Object} opts Options for this instance.
     * @returns {Info} Modified info message
     */
  transform(info) {
    const msg = info.message;
    const splat = info[SPLAT] || info.splat;

    // Evaluate if the message has any interpolation tokens. If not,
    // then let evaluation continue.
    const tokens = msg && msg.match && msg.match(formatRegExp);
    if (!tokens && (!splat || !splat.length)) {
      return info;
    }

    if (tokens) {
      return this._splat(info, tokens);
    }

    return info;
  }
}

/*
 * function splat (info)
 * Returns a new instance of the splat format TransformStream
 * which performs string interpolation from `info` objects. This was
 * previously exposed implicitly in `winston < 3.0.0`.
 */
module.exports = opts => new Splatter(opts);
