const types = (value: any): string => {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

type SerializeType = (value?: any) => string;

export const SerializeTypes: { [key: string]: SerializeType } = Object.freeze({
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
    return `[${value.map((value: any) => this.serialize(value)).join()}]`;
  },

  serialize(value) {
    return this?.[types(value)]?.(value) ?? value;
  },
});

export const ArraySerializeTypes: { [key: string]: SerializeType } = Object.freeze({
  ...SerializeTypes,

  array: function(value) {
    return value.map((value: any) => SerializeTypes.serialize(value)).join();
  },
});

export const ObjectSerializeTypes: { [key: string]: SerializeType } = Object.freeze({
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
 */
export const createUrl = (urlBase: string | URL) => (strings: TemplateStringsArray, ...tags: any): URL => (
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
 */
export const url = (strings: TemplateStringsArray, ...tags: any): URL => {
  // use the first tag as the base url, then replace that tag with an empty string
  const urlBase = strings[0] === '' ? tags.splice(0, 1, '') : undefined;
  return createUrl(urlBase)(strings, ...tags);
};
