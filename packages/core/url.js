/** @type {(value: any) => string} */
const types = (value) => {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

export const SerializeTypes = Object.freeze({
  null: () => 'null',
  undefined: () => 'null',
  string: (value) => `${encodeURIComponent(value)}`,
  object: function(value) {
    // todo add cric checks
    return JSON.stringify(Object.fromEntries(Object.entries(value).map(([key, value]) => (
      [key, ['object', 'array'].includes(types(value)) ? value : this.serialize(value)]
    ))));
  },
  array: function(value) {
    return `[${value.map((value) => this.serialize(value)).join()}]`;
  },

  serialize(value) {
    return this?.[types(value)]?.(value) ?? value;
  },
});

export const ArraySerializeTypes = Object.freeze({
  ...SerializeTypes,

  array: function(value) {
    return value.map((value) => SerializeTypes.serialize(value)).join();
  },
});

export const ObjectSerializeTypes = Object.freeze({
  ...SerializeTypes,

  object: function(value) {
    return Object.entries(value).map(([key, value]) => (
      // todo think about how to serialize/encode the string, remove undefined from params or only include?
      `${key}=${this.serialize(value)}`
    )).join('&');
  },
});

/**
 * Create the named templated string with the provided base url
 *
 * @type {(urlBase: string | URL) => (strings: TemplateStringsArray, ...tags: any) => URL}
 */
export const createUrl = (urlBase) => (strings, ...tags) => (
  new URL(strings.reduce((acc, value) => {
    const tag = tags.shift();
    // url params encoding
    if ('?#'.includes(acc.slice(-1))) {
      const serializeTypes = Array.isArray(tag) ? ArraySerializeTypes : ObjectSerializeTypes;
      return acc + serializeTypes.serialize(tag) + value;
    }
    // normal url encoding
    return acc + tag + value;
  }), urlBase)
);

/**
 * String template that creates a url from the string
 *
 * @type {(strings: TemplateStringsArray, ...tags: any) => URL}
 */
export const url = (strings, ...tags) => {
  // use the first tag as the base url, then replace that tag with an empty string
  const urlBase = strings[0] === '' ? tags.splice(0, 1, '') : undefined;
  return createUrl(urlBase)(strings, ...tags);
};
